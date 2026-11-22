from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from assessments.models import Questionnaire, Question


class SecurityTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(username="fictional_alex", password="Fictional-Safe-8234!")
        cls.other = User.objects.create_user(username="fictional_sam", password="Fictional-Safe-8234!")
        cls.phq = Questionnaire.objects.create(name="PHQ-9", questionnaire_type="PHQ9")
        cls.gad = Questionnaire.objects.create(name="GAD-7", questionnaire_type="GAD7")
        # Deliberately create question 9 FIRST. Safety logic must use question_number.
        for questionnaire, numbers in [(cls.phq, [9, *range(1, 9)]), (cls.gad, range(1, 8))]:
            for number in numbers:
                Question.objects.create(questionnaire=questionnaire, question_number=number, question_text=f"Fictional test question {number}")

    def setUp(self):
        self.client.force_authenticate(self.user)

    def assessment_payload(self, questionnaire=None, total=0, question_nine=None):
        questionnaire = questionnaire or self.phq
        responses = []
        remaining = total
        for question in questionnaire.questions.order_by("question_number"):
            score = min(3, remaining)
            remaining -= score
            if question.question_number == 9 and question_nine is not None:
                score = question_nine
            responses.append({"question": question.pk, "score": score})
        return {"questionnaire": questionnaire.pk, "responses": list(reversed(responses))}
