from unittest.mock import patch
from django.db import DatabaseError
from django.urls import reverse
from api.test_helpers import SecurityTestCase
from .models import Assessment, Questionnaire, Response


class AssessmentSecurityTests(SecurityTestCase):
    def submit(self, data):
        return self.client.post(reverse("assessment-create"), data, format="json")

    def test_invalid_questionnaire_and_missing_payload(self):
        for data in [{}, {"questionnaire": 999999, "responses": []}, {"questionnaire": self.phq.pk}, {"responses": []}]:
            self.assertEqual(self.submit(data).status_code, 400)
        self.assertEqual(Assessment.objects.count(), 0)

    def test_missing_duplicate_foreign_and_extra_answers(self):
        for kind in ["missing", "duplicate", "foreign", "extra"]:
            data = self.assessment_payload()
            if kind == "missing": data["responses"].pop()
            elif kind == "duplicate": data["responses"][0] = data["responses"][1].copy()
            elif kind == "foreign": data["responses"][0]["question"] = self.gad.questions.first().pk
            else: data["responses"].append(data["responses"][0].copy())
            with self.subTest(kind=kind):
                self.assertEqual(self.submit(data).status_code, 400)
        self.assertEqual(Assessment.objects.count(), 0)
        self.assertEqual(Response.objects.count(), 0)

    def test_scores_must_be_integers_zero_to_three(self):
        for value in [-1, 4, 1.5, True, None, "invalid"]:
            data = self.assessment_payload()
            data["responses"][0]["score"] = value
            with self.subTest(value=value):
                self.assertEqual(self.submit(data).status_code, 400)

    def test_rejects_unconfigured_questionnaire(self):
        questionnaire = Questionnaire.objects.create(name="Incomplete", questionnaire_type="OTHER")
        self.assertEqual(self.submit({"questionnaire": questionnaire.pk, "responses": []}).status_code, 400)
        self.phq.questions.filter(question_number=2).delete()
        data = self.assessment_payload()
        self.assertEqual(self.submit(data).status_code, 400)

    def test_phq_scoring_thresholds_unchanged(self):
        for total, severity in [(0,"Minimal"),(4,"Minimal"),(5,"Mild"),(9,"Mild"),(10,"Moderate"),(14,"Moderate"),(15,"Moderately Severe"),(19,"Moderately Severe"),(20,"Severe"),(27,"Severe")]:
            with self.subTest(total=total):
                result = self.submit(self.assessment_payload(total=total))
                self.assertEqual(result.status_code, 201)
                self.assertEqual((result.data["total_score"], result.data["severity"]), (total, severity))

    def test_gad_scoring_thresholds_unchanged(self):
        for total, severity in [(0,"Minimal"),(4,"Minimal"),(5,"Mild"),(9,"Mild"),(10,"Moderate"),(14,"Moderate"),(15,"Severe"),(21,"Severe")]:
            with self.subTest(total=total):
                result = self.submit(self.assessment_payload(self.gad, total=total))
                self.assertEqual(result.status_code, 201)
                self.assertEqual((result.data["total_score"], result.data["severity"]), (total, severity))
                self.assertIs(result.data["safety_support_recommended"], False)

    def test_question_nine_uses_number_not_position_or_total(self):
        for score in [0, 1, 2, 3]:
            with self.subTest(score=score):
                result = self.submit(self.assessment_payload(question_nine=score))
                self.assertEqual(result.status_code, 201)
                self.assertEqual(result.data["total_score"], score)
                self.assertEqual(result.data["severity"], "Minimal")
                self.assertIs(result.data["safety_support_recommended"], score > 0)
                history = self.client.get(reverse("assessment-history"))
                saved = next(row for row in history.data if row["id"] == result.data["id"])
                self.assertIs(saved["safety_support_recommended"], score > 0)
        high = self.submit(self.assessment_payload(total=24, question_nine=0))
        self.assertIs(high.data["safety_support_recommended"], False)

    def test_history_and_responses_are_owner_only(self):
        own = self.submit(self.assessment_payload(question_nine=1))
        self.client.force_authenticate(self.other)
        foreign = self.submit(self.assessment_payload(total=12))
        self.client.force_authenticate(self.user)
        history = self.client.get(reverse("assessment-history"), {"user": self.other.pk})
        self.assertEqual([row["id"] for row in history.data], [own.data["id"]])
        self.assertNotIn("responses", history.data[0])
        self.assertEqual(self.client.get(f"/api/assessments/{foreign.data['id']}/").status_code, 404)

    def test_failure_rolls_back_assessment_and_answers(self):
        original = Response.objects.create
        count = 0
        def create_then_fail(**kwargs):
            nonlocal count
            count += 1
            if count == 2: raise DatabaseError("Fictional sensitive database details")
            return original(**kwargs)
        with patch("assessments.serializers.Response.objects.create", side_effect=create_then_fail):
            result = self.submit(self.assessment_payload())
        self.assertEqual(result.status_code, 503)
        self.assertNotIn("sensitive", str(result.data))
        self.assertEqual(Assessment.objects.count(), 0)
        self.assertEqual(Response.objects.count(), 0)

    def test_historical_missing_question_nine_is_unknown(self):
        Assessment.objects.create(user=self.user, questionnaire=self.phq, total_score=0, severity="Minimal")
        result = self.client.get(reverse("assessment-history"))
        self.assertIsNone(result.data[0]["safety_support_recommended"])
