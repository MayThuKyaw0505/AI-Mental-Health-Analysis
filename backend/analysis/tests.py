from unittest.mock import patch
from django.urls import reverse
from api.test_helpers import SecurityTestCase
from journals.models import JournalEntry
from journals.serializers import MAX_JOURNAL_LENGTH
from .models import AIAnalysis


class AnalysisSecurityTests(SecurityTestCase):
    def setUp(self):
        super().setUp()
        self.own = JournalEntry.objects.create(user=self.user, content="Fictional peaceful day")
        self.foreign = JournalEntry.objects.create(user=self.other, content="Another fictional day")
        self.foreign_analysis = AIAnalysis.objects.create(journal_entry=self.foreign, sentiment="positive")

    def test_cannot_read_or_analyze_other_users_journal(self):
        with patch("analysis.views.analyze_sentiment") as sentiment:
            self.assertEqual(self.client.post(reverse("analyze-journal", args=[self.foreign.pk])).status_code, 404)
            self.assertEqual(self.client.get(reverse("analysis-result", args=[self.foreign.pk])).status_code, 404)
            self.assertEqual(self.client.get(reverse("ai-analysis-history")).data, [])
            sentiment.assert_not_called()

    def test_blank_legacy_overlong_and_unsupported_text(self):
        for text in ["", "   ", "x" * (MAX_JOURNAL_LENGTH + 1), "မြန်မာစာ", "English and မြန်မာစာ", "こんにちは", "1234 !"]:
            self.own.content = text
            self.own.save()
            with self.subTest(length=len(text)), patch("analysis.views.analyze_sentiment") as sentiment:
                result = self.client.post(reverse("analyze-journal", args=[self.own.pk]))
                self.assertEqual(result.status_code, 400)
                sentiment.assert_not_called()
        self.assertFalse(AIAnalysis.objects.filter(journal_entry=self.own).exists())

    @patch("analysis.views.analyze_emotion", return_value={"emotion": "joy", "emotion_confidence": .85})
    @patch("analysis.views.analyze_sentiment", return_value={"sentiment": "positive", "sentiment_confidence": .9})
    def test_english_analysis_saved_and_own_history_only(self, sentiment, emotion):
        result = self.client.post(reverse("analyze-journal", args=[self.own.pk]))
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.data["sentiment"], "positive")
        history = self.client.get(reverse("ai-analysis-history"))
        self.assertEqual(len(history.data), 1)
        self.assertEqual(history.data[0]["journal_entry"], self.own.pk)
        self.assertNotIn("content", history.data[0])
        self.assertNotEqual(history.data[0]["id"], self.foreign_analysis.pk)

    def test_model_failure_does_not_leak_details_or_destroy_saved_result(self):
        saved = AIAnalysis.objects.create(journal_entry=self.own, sentiment="positive")
        with patch("analysis.views.analyze_sentiment", side_effect=RuntimeError("Fictional sensitive journal and credentials")), self.assertLogs("analysis.views", level="WARNING") as captured:
            result = self.client.post(reverse("analyze-journal", args=[self.own.pk]))
        self.assertEqual(result.status_code, 503)
        self.assertNotIn("sensitive", str(result.data))
        self.assertNotIn("sensitive", str(captured.output))
        self.assertNotIn(self.own.content, str(captured.output))
        saved.refresh_from_db()
        self.assertEqual(saved.sentiment, "positive")

    def test_changed_entry_does_not_receive_stale_analysis(self):
        def sentiment(_text):
            JournalEntry.objects.filter(pk=self.own.pk).update(content="Updated fictional text")
            return {"sentiment": "positive", "sentiment_confidence": .9}
        with patch("analysis.views.analyze_sentiment", side_effect=sentiment), patch("analysis.views.analyze_emotion", return_value={"emotion":"joy","emotion_confidence":.8}):
            result = self.client.post(reverse("analyze-journal", args=[self.own.pk]))
        self.assertEqual(result.status_code, 409)
        self.assertFalse(AIAnalysis.objects.filter(journal_entry=self.own).exists())
