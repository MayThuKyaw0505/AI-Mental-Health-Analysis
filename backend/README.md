# Django backend

This local academic prototype uses Django REST Framework, SimpleJWT, and
PostgreSQL. Activate the existing `backend/.venv` before running commands.

## Local configuration

`config/settings.py` reads environment variables and automatically loads simple
`KEY=value` lines from `backend/.env`. Shell environment variables take precedence.
Values containing spaces or `#` must be quoted. The loader does not execute shell
commands, interpolate other variables, or implement the full dotenv format.

Your existing database configuration was preserved in the ignored local `.env`
during Step 28. Do not replace that file with the example.

For a **fresh checkout only**:

1. Copy `.env.example` to `.env` and enter your own local PostgreSQL connection
   details. Do not commit `.env`.
2. Generate a local signing key without printing it:

   ```sh
   python -c 'from pathlib import Path; import secrets; p = Path(".env"); p.write_text(p.read_text().replace("replace-with-a-random-local-key", secrets.token_urlsafe(50)))'
   ```

The example contains placeholders only. The application rejects its unchanged
signing-key placeholder. The local `.env` created during implementation has
restricted file permissions.

| Variable | Purpose |
| --- | --- |
| `DJANGO_SECRET_KEY` | Required local signing key; changing it requires users to sign in again |
| `DJANGO_DEBUG` | Defaults to `false`; temporarily enable only for local debugging |
| `DJANGO_ALLOWED_HOSTS` | Defaults to `localhost,127.0.0.1,[::1]` |
| `POSTGRES_NAME` | Your existing PostgreSQL database name |
| `POSTGRES_USER` | Your existing PostgreSQL user |
| `POSTGRES_PASSWORD` | Your local database password |
| `POSTGRES_HOST` | Defaults to `localhost` |
| `POSTGRES_PORT` | Defaults to `5432` |

CORS is restricted to `http://localhost:5173` and `http://127.0.0.1:5173`.
No HTTPS redirects or secure-cookie requirements are enabled for this localhost
HTTP demonstration. With `DEBUG=false`, Django's development server does not
serve the admin's static assets; temporarily use local debugging mode if needed
for admin styling. The React application is served separately by Vite.

## Run locally

From the project root:

```sh
cd backend
source .venv/bin/activate
python manage.py check
python manage.py runserver
```

For a fresh installation, create the virtual environment and install
`requirements.txt` first. Run `python manage.py migrate` on a new database, then
`python manage.py seed_questionnaires` to install the two questionnaires. Step 28
does not introduce migrations or require reseeding your existing database.

- Public liveness endpoint: `http://127.0.0.1:8000/api/health/`. It does not test
  the database connection or expose configuration.
- Account registration and JWT login/refresh are public authentication endpoints.
- Journals, questionnaires, assessments, AI analyses, profile updates, password
  changes, and account deletion require backend authentication.
- Journal/detail and analysis/detail queries are filtered by the current user;
  unavailable and foreign-owned records return 404. Assessment history contains
  only the current user's results. There is no public response-detail endpoint.

## Validation and error handling

Journal content must be nonblank and at most 20,000 characters. Existing longer
records remain readable, but must be shortened before analysis. Registration
uses Django's configured password validators. Assessment submission validates
questionnaire configuration, exact question IDs, complete unique answers, and
integer scores from 0 to 3 before writing any result. Saving an assessment and
its answers is atomic: failures roll the entire operation back.

Unexpected API errors return generic JSON. Database outages return HTTP 503.
AI failures return HTTP 503 without overwriting a previously saved analysis.
Server logs report only exception types from these handlers, not request bodies
or exception messages. API responses include `Cache-Control: no-store, private`.

## Verification

```sh
python manage.py check
python manage.py test
```

Django tests use fictional data in a separate `test_...` database that Django
creates and removes. PostgreSQL must be running, and the local database user
must be allowed to create a test database. Do not reset the development database.

See [../SECURITY_TESTING.md](../SECURITY_TESTING.md) for the Step 28 review,
limitations, file list, verification results, and manual testing checklist.
