from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from analysis.models import AIAnalysis
from assessments.models import Assessment, Question, Questionnaire, Response
from journals.models import JournalEntry


class ProfilePrivacyTests(APITestCase):
    password = "Original-Secret-472!"
    new_password = "Replacement-Secret-936!"

    def setUp(self):
        self.user = User.objects.create_user(
            username="student", email="student@example.com", password=self.password
        )
        self.other = User.objects.create_user(
            username="another", email="another@example.com", password=self.password
        )
        tokens = self.client.post(reverse("login"), {
            "username": self.user.username, "password": self.password,
        }).data
        self.access = tokens["access"]
        self.refresh = tokens["refresh"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access}")

    def change_password(self, **overrides):
        data = {
            "current_password": self.password,
            "new_password": self.new_password,
            "confirm_new_password": self.new_password,
        }
        data.update(overrides)
        return self.client.post(reverse("change-password"), data, format="json")

    def test_all_profile_endpoints_require_authentication(self):
        self.client.credentials()
        requests = [
            (self.client.get, "profile"),
            (self.client.patch, "profile"),
            (self.client.post, "change-password"),
            (self.client.delete, "delete-account"),
        ]
        for method, name in requests:
            with self.subTest(method=method.__name__, endpoint=name):
                self.assertEqual(method(reverse(name)).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_exposes_only_safe_own_fields(self):
        response = self.client.get(reverse("profile"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(set(response.data), {"id", "username", "email", "date_joined"})
        self.assertEqual(response.data["id"], self.user.pk)
        self.assertEqual(response.data["email"], self.user.email)
        self.assertTrue(response.data["date_joined"])

    def test_normal_login_and_refresh_continue_to_work(self):
        self.client.credentials()
        response = self.client.post(reverse("token-refresh"), {"refresh": self.refresh})
        self.assertEqual(response.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        self.assertEqual(self.client.get(reverse("profile")).status_code, 200)

    def test_password_change_preserves_other_users_authentication(self):
        self.client.credentials()
        other_tokens = self.client.post(reverse("login"), {
            "username": self.other.username, "password": self.password,
        }).data
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access}")
        self.assertEqual(self.change_password().status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {other_tokens['access']}")
        response = self.client.get(reverse("profile"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["id"], self.other.pk)

    def test_update_changes_only_own_profile(self):
        original_joined = self.user.date_joined
        response = self.client.patch(reverse("profile"), {
            "id": self.other.pk, "username": "updated", "email": "updated@example.com",
            "date_joined": "2000-01-01T00:00:00Z", "is_staff": True, "password": "unsafe",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.other.refresh_from_db()
        self.assertEqual(self.user.username, "updated")
        self.assertEqual(self.user.email, "updated@example.com")
        self.assertEqual(self.user.date_joined, original_joined)
        self.assertFalse(self.user.is_staff)
        self.assertTrue(self.user.check_password(self.password))
        self.assertEqual(self.other.username, "another")
        self.assertEqual(self.other.email, "another@example.com")
        self.assertEqual(self.client.get(reverse("profile")).status_code, 200)

    def test_profile_validation(self):
        for data, field in [
            ({"username": "another"}, "username"),
            ({"username": "bad name!"}, "username"),
            ({"username": ""}, "username"),
            ({"email": "not-an-email"}, "email"),
            ({"email": ""}, "email"),
        ]:
            with self.subTest(data=data):
                response = self.client.patch(reverse("profile"), data, format="json")
                self.assertEqual(response.status_code, 400)
                self.assertIn(field, response.data)

    def test_password_change_validates_current_confirmation_and_django_rules(self):
        cases = [
            ({"current_password": "incorrect"}, "current_password"),
            ({"confirm_new_password": "different"}, "confirm_new_password"),
            ({"new_password": "short", "confirm_new_password": "short"}, "new_password"),
            ({"new_password": "123456789123", "confirm_new_password": "123456789123"}, "new_password"),
            ({"new_password": "password", "confirm_new_password": "password"}, "new_password"),
            ({"new_password": "student", "confirm_new_password": "student"}, "new_password"),
        ]
        for overrides, field in cases:
            with self.subTest(overrides=overrides):
                response = self.change_password(**overrides)
                self.assertEqual(response.status_code, 400)
                self.assertIn(field, response.data)
                self.user.refresh_from_db()
                self.assertTrue(self.user.check_password(self.password))

    def test_password_change_hashes_password_and_invalidates_old_tokens(self):
        response = self.change_password()
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(self.new_password))
        self.assertFalse(self.user.check_password(self.password))
        self.assertNotEqual(self.user.password, self.new_password)
        self.assertNotIn(self.new_password, str(response.data))
        self.assertEqual(self.client.get(reverse("profile")).status_code, 401)

        self.client.credentials()
        refresh_response = self.client.post(reverse("token-refresh"), {"refresh": self.refresh})
        self.assertEqual(refresh_response.status_code, 401)
        self.client.credentials()
        self.assertEqual(self.client.post(reverse("login"), {
            "username": "student", "password": self.password,
        }).status_code, 401)
        login = self.client.post(reverse("login"), {
            "username": "student", "password": self.new_password,
        })
        self.assertEqual(login.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        self.assertEqual(self.client.get(reverse("profile")).status_code, 200)

    def test_delete_requires_password_and_explicit_confirmation(self):
        for data in [
            {}, {"password": self.password}, {"confirm_deletion": True},
            {"password": "wrong", "confirm_deletion": True},
            {"password": self.password, "confirm_deletion": False},
        ]:
            with self.subTest(data=data):
                self.assertEqual(self.client.delete(
                    reverse("delete-account"), data, format="json"
                ).status_code, 400)
                self.assertTrue(User.objects.filter(pk=self.user.pk).exists())

    def test_delete_cascades_personal_data_and_preserves_other_user(self):
        questionnaire = Questionnaire.objects.create(name="PHQ-9", questionnaire_type="PHQ9")
        question = Question.objects.create(
            questionnaire=questionnaire, question_number=1, question_text="Test question"
        )
        records = []
        for user in [self.user, self.other]:
            journal = JournalEntry.objects.create(user=user, content="Private journal")
            analysis = AIAnalysis.objects.create(journal_entry=journal, sentiment="positive")
            assessment = Assessment.objects.create(
                user=user, questionnaire=questionnaire, total_score=1, severity="Minimal"
            )
            answer = Response.objects.create(assessment=assessment, question=question, score=1)
            records.append([journal, analysis, assessment, answer])
        deleted_user_id = self.user.pk
        response = self.client.delete(reverse("delete-account"), {
            "password": self.password, "confirm_deletion": True, "user_id": self.other.pk,
        }, format="json")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(User.objects.filter(pk=deleted_user_id).exists())
        self.assertTrue(User.objects.filter(pk=self.other.pk).exists())
        for record in records[0]:
            self.assertFalse(type(record).objects.filter(pk=record.pk).exists())
        for record in records[1]:
            self.assertTrue(type(record).objects.filter(pk=record.pk).exists())
        self.assertTrue(Questionnaire.objects.filter(pk=questionnaire.pk).exists())
        self.assertTrue(Question.objects.filter(pk=question.pk).exists())
        self.assertEqual(self.client.get(reverse("profile")).status_code, 401)
        self.client.credentials()
        refresh_response = self.client.post(reverse("token-refresh"), {"refresh": self.refresh})
        self.assertEqual(refresh_response.status_code, 401)
