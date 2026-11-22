from datetime import timedelta
from unittest.mock import patch
from django.db import OperationalError
from django.test import SimpleTestCase, override_settings
from django.urls import reverse
from rest_framework_simplejwt.tokens import AccessToken
from .test_helpers import SecurityTestCase
from .exceptions import safe_exception_handler


class EndpointSecurityTests(SecurityTestCase):
    def test_private_endpoints_require_authentication(self):
        self.client.force_authenticate(None)
        requests = [
            ("get", "journal-list-create", []), ("post", "journal-list-create", []),
            ("get", "journal-detail", [1]), ("patch", "journal-detail", [1]), ("delete", "journal-detail", [1]),
            ("get", "questionnaire-list", []), ("post", "assessment-create", []), ("get", "assessment-history", []),
            ("post", "analyze-journal", [1]), ("get", "analysis-result", [1]), ("get", "ai-analysis-history", []),
            ("get", "profile", []), ("patch", "profile", []), ("post", "change-password", []), ("delete", "delete-account", []),
        ]
        for method, name, args in requests:
            with self.subTest(endpoint=name, method=method):
                self.assertEqual(getattr(self.client, method)(reverse(name, args=args)).status_code, 401)

    def test_invalid_and_expired_jwt(self):
        self.client.force_authenticate(None)
        expired = AccessToken.for_user(self.user)
        expired.set_exp(lifetime=timedelta(seconds=-1))
        for token in ["invalid-token", str(expired)]:
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
            self.assertEqual(self.client.get(reverse("profile")).status_code, 401)

    @override_settings(DEBUG=True)
    def test_database_error_is_safe_json_even_in_debug(self):
        with patch("journals.views.JournalEntry.objects.filter", side_effect=OperationalError("Fictional secret connection details")), self.assertLogs("api.exceptions", level="ERROR") as logs:
            result = self.client.get(reverse("journal-list-create"))
        self.assertEqual(result.status_code, 503)
        self.assertEqual(result["Cache-Control"], "no-store, private")
        self.assertNotIn("secret", str(result.data))
        self.assertNotIn("secret", str(logs.output))

    def test_personal_and_auth_responses_are_not_cached(self):
        for url in [reverse("profile"), reverse("assessment-history"), reverse("journal-list-create")]:
            self.assertEqual(self.client.get(url)["Cache-Control"], "no-store, private")

    def test_invalid_json_has_validation_response(self):
        result = self.client.post(reverse("journal-list-create"), '{"content":', content_type="application/json")
        self.assertEqual(result.status_code, 400)

    def test_cors_is_limited_to_local_frontend(self):
        for origin in ["http://localhost:5173", "http://127.0.0.1:5173"]:
            result = self.client.options(reverse("profile"), HTTP_ORIGIN=origin, HTTP_ACCESS_CONTROL_REQUEST_METHOD="GET")
            self.assertEqual(result["Access-Control-Allow-Origin"], origin)
        result = self.client.options(reverse("profile"), HTTP_ORIGIN="https://untrusted.example", HTTP_ACCESS_CONTROL_REQUEST_METHOD="GET")
        self.assertNotIn("Access-Control-Allow-Origin", result)


class ErrorHandlerTests(SimpleTestCase):
    def test_unexpected_errors_do_not_expose_message(self):
        with self.assertLogs("api.exceptions", level="ERROR") as logs:
            result = safe_exception_handler(RuntimeError("Fictional private payload"), {})
        self.assertEqual(result.status_code, 500)
        self.assertNotIn("private payload", str(result.data))
        self.assertNotIn("private payload", str(logs.output))


class LocalEnvironmentTests(SimpleTestCase):
    def test_local_values_preserve_quoting_and_environment_overrides(self):
        import os
        import tempfile
        from pathlib import Path
        from config.env import load_local_env
        with tempfile.TemporaryDirectory() as directory, patch.dict(os.environ, {"EXISTING": "shell-wins"}, clear=True):
            path = Path(directory) / ".env"
            path.write_text("# fictional test values\nEXISTING=file-value\nQUOTED='spaces # and symbols $()'\nEMPTY=\n")
            load_local_env(path)
            self.assertEqual(os.environ["EXISTING"], "shell-wins")
            self.assertEqual(os.environ["QUOTED"], "spaces # and symbols $()")
            self.assertEqual(os.environ["EMPTY"], "")

    def test_malformed_environment_does_not_echo_values(self):
        import tempfile
        from pathlib import Path
        from django.core.exceptions import ImproperlyConfigured
        from config.env import load_local_env
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / ".env"
            path.write_text("KEY='fictional private value")
            with self.assertRaises(ImproperlyConfigured) as error:
                load_local_env(path)
            self.assertNotIn("private value", str(error.exception))
