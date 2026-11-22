from django.urls import reverse
from api.test_helpers import SecurityTestCase
from analysis.models import AIAnalysis
from .models import JournalEntry
from .serializers import MAX_JOURNAL_LENGTH


class JournalSecurityTests(SecurityTestCase):
    def setUp(self):
        super().setUp()
        self.own = JournalEntry.objects.create(user=self.user, content="Fictional English reflection")
        self.foreign = JournalEntry.objects.create(user=self.other, content="Another fictional reflection")

    def test_list_and_detail_are_owner_only(self):
        response = self.client.get(reverse("journal-list-create"))
        self.assertEqual([row["id"] for row in response.data], [self.own.pk])
        for method, data in [(self.client.get, None), (self.client.patch, {"content": "changed"}), (self.client.put, {"content": "changed"}), (self.client.delete, None)]:
            with self.subTest(method=method.__name__):
                response = method(reverse("journal-detail", args=[self.foreign.pk]), data, format="json")
                self.assertEqual(response.status_code, 404)
        self.foreign.refresh_from_db()
        self.assertEqual(self.foreign.content, "Another fictional reflection")

    def test_client_cannot_assign_or_transfer_owner(self):
        response = self.client.post(reverse("journal-list-create"), {"user": self.other.pk, "content": "Fictional entry"})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(JournalEntry.objects.get(pk=response.data["id"]).user_id, self.user.pk)
        self.client.patch(reverse("journal-detail", args=[self.own.pk]), {"user": self.other.pk})
        self.own.refresh_from_db()
        self.assertEqual(self.own.user_id, self.user.pk)

    def test_empty_overlong_and_invalid_content(self):
        for data in [{}, {"content": ""}, {"content": "  \n "}, {"content": "x" * (MAX_JOURNAL_LENGTH + 1)}, {"content": None}, {"content": []}]:
            with self.subTest(kind=type(data.get("content")).__name__):
                self.assertEqual(self.client.post(reverse("journal-list-create"), data, format="json").status_code, 400)
        self.assertEqual(self.client.post(reverse("journal-list-create"), {"content": "မြန်မာစာ"}).status_code, 201)

    def test_edit_removes_saved_analysis_and_other_user_is_untouched(self):
        own_analysis = AIAnalysis.objects.create(journal_entry=self.own, sentiment="positive")
        other_analysis = AIAnalysis.objects.create(journal_entry=self.foreign, sentiment="neutral")
        response = self.client.patch(reverse("journal-detail", args=[self.own.pk]), {"content": "Updated fictional reflection"})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(AIAnalysis.objects.filter(pk=own_analysis.pk).exists())
        self.assertTrue(AIAnalysis.objects.filter(pk=other_analysis.pk).exists())

    def test_invalid_and_missing_ids(self):
        self.assertEqual(self.client.get(reverse("journal-detail", args=[999999])).status_code, 404)
        self.assertEqual(self.client.get("/api/journals/not-an-id/").status_code, 404)
