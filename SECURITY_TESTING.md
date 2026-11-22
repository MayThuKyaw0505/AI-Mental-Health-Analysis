# Step 28 — Security, errors, and mental health safety

## Findings and changes

The existing journal, analysis, assessment-history, and profile views already
restricted queries to the current authenticated user. Step 28 keeps those
ownership checks and adds authenticated-by-default DRF permissions as a second
layer. Public registration, token endpoints, and the non-sensitive liveness
endpoint remain public.

The most important issues found were hardcoded PostgreSQL configuration,
registration without Django password validation, unhandled AI exceptions,
concurrent JWT refreshes, missing PHQ-9 question-9 support guidance, and a
journal-update hook defined outside its view class. That disconnected hook meant
journal edits could leave stale AI results attached.

Changes include:

- PostgreSQL settings now use environment variables, with existing local values
  preserved in ignored `backend/.env`. A fresh signing key was generated locally.
  `backend/.env.example` contains only placeholders. `.gitignore` already covers
  `.env` files; the actual local file is not tracked. Restart Django and sign in
  again after the configuration/key change.
- `DEBUG` defaults to false. The custom DRF exception handler also returns safe
  JSON when local debugging is enabled. Database failures return 503; conflicting
  writes return 409; unexpected errors return 500. Handlers do not log request
  bodies, model exception messages, tokens, passwords, or questionnaire responses.
- Registration uses Django's configured password validators and preserves
  password whitespace. Username uniqueness and email-format validation remain
  provided by the serializers. Email remains optional during registration to
  preserve the existing registration flow.
- Journals reject blank content and content over 20,000 characters. Ownership
  fields remain read-only. Editing a journal now deletes its stale analysis in
  the same transaction. An analysis that finishes after the journal changes is
  rejected with 409 rather than saving an outdated prediction.
- Assessment submissions validate the expected question-number set for PHQ-9
  and GAD-7, exact question IDs, complete unique responses, and scores 0–3.
  Creating the assessment and answers is atomic. Existing score thresholds are
  unchanged and covered at every boundary.
- Backend result/history serializers expose `safety_support_recommended` using
  the saved answer whose **question_number is 9**, for PHQ-9 only. A score greater
  than zero triggers the flag regardless of the total score. Missing historical
  question-9 answers produce `null`, meaning unknown, not a reassuring negative.
  Full responses are not added to unrelated result APIs.
- The frontend shows supportive guidance when selecting a positive question-9
  answer, after submission using the backend flag, and beside dated historical
  results. Guidance encourages professional/trusted-person support and local
  emergency care for immediate danger. The app does not assess suicide risk,
  monitor emergencies, contact anyone, diagnose, or provide treatment. No hotline
  numbers were added.
- AI predictions are labelled as automated. The UI explains English-only
  support, possible bias/inaccuracy, token truncation, and that confidence is not
  clinical certainty. Both model IDs and their existing inference behavior are
  preserved. Burmese journals can still be saved normally. A cautious script
  check blocks Burmese, mixed Burmese/English, and other non-Latin scripts from
  analysis. This is **not** a complete language detector: non-English Latin-script
  text can pass. No translation service or new model was added.
- The Axios interceptor shares concurrent refreshes, avoids refreshing login
  failures, and prevents a completed refresh restoring a logged-out session.
  Invalid refresh tokens clear authentication and redirect to a visible expired-
  session message. Network/server failures during refresh preserve stored tokens
  so an outage does not falsely sign the user out. Requests have timeouts; AI gets
  a longer 120-second timeout. Timeout messages acknowledge an uncertain write
  outcome and advise reloading before retrying.
- Common frontend error messages distinguish network failures, timeouts,
  authentication/permission failures, unavailable records, and server errors.
  Nested assessment validation errors are readable. Existing disabled/loading
  controls prevent repeated submissions while a request is processing.
- API responses have `Cache-Control: no-store, private`. CORS permits only the
  two local Vite origins, with no wildcard.

## Model and safety references

The model authors describe both classifiers as English-language models:
[DistilBERT sentiment model card](https://huggingface.co/distilbert/distilbert-base-uncased-finetuned-sst-2-english)
and [emotion model card](https://huggingface.co/j-hartmann/emotion-english-distilroberta-base).

Question-9 guidance is deliberately separate from scoring or a risk determination.
The [VA/DoD guideline](https://healthquality.va.gov/HEALTHQUALITY/guidelines/MH/srb/VADOD-CPG-Suicide-Risk-Full-CPG-2024_Final_508.pdf)
discusses PHQ-9 item 9 as a screening input; this prototype does not implement a
clinical suicide-risk assessment. Existing PHQ-9/GAD-7 thresholds were preserved.

## Remaining prototype limitations

- JWTs remain in localStorage to preserve the existing architecture. Scripts
  running on the same origin can read them, so a future XSS flaw could expose
  tokens. Passwords, journal content, and responses are not stored there by this
  application. Logout removes this browser's tokens; a copied token may remain
  valid until expiry, password change, or account deletion. Password changes
  invalidate old access/refresh tokens using the existing SimpleJWT checks.
- Journal/assessment database content is not encrypted at the application level.
  Database administrators and separately made backups may retain access.
- Removing credentials from current settings does not remove old Git history.
  If earlier commits have been shared, rotate the old PostgreSQL password and
  update the ignored `.env`. Git history was not rewritten and no database user
  passwords were changed automatically.
- The app is a localhost academic demonstration. This work is not a production
  penetration test, clinical validation, full language detector, emergency
  monitoring service, or complete WCAG audit. Login rate limiting, secure hosting,
  backup retention, and a future cookie-based token design need separate work
  before any public deployment.
- Browser submission guards are not server-side idempotency keys. If a write
  times out, reload to check the outcome before submitting again.

## Verification

Completed checks:

- `python manage.py check`: passed.
- `python manage.py test`: all **41 backend tests passed**, using a separate
  PostgreSQL test database.
- `python manage.py makemigrations --check --dry-run`: no changes detected.
- `npm test`: all **6 frontend error-message tests passed** with Node's built-in
  runner.
- `npm run lint`: passed with no warnings.
- `npm run build`: passed. Vite still reports the existing bundle-size warning.
- `git diff --check`: passed.
- **20 Chrome workflow checks passed** against the running local API: registration,
  login, a single shared refresh for parallel requests, unavailable-backend
  feedback, journal creation/editing, Burmese saving with analysis rejection,
  real English AI analysis and saved-result reload, stale-analysis invalidation,
  both assessment submissions, live/result/history safety guidance at PHQ-9
  total 1, responsive layouts at 1440/768/390/320px, labelled fields, mobile
  navigation, profile updates, password validation/change/logout, invalid-refresh
  logout messaging, and confirmed journal/account deletion. No uncaught browser
  runtime errors were reported. PostgreSQL and model failures are simulated in
  backend tests; frontend unit tests check safe 5xx feedback.

All tests use fictional data. Backend tests run against Django's separate
PostgreSQL test database. Browser checks create a disposable account and remove
only that account's records; existing development records are not reset or
deleted. No sample data or mocked API responses were added to the application.

## Manual localhost checklist

1. In VS Code, review `backend/.env` locally without copying its contents into
   chat or Git. Existing values have been preserved. For a fresh setup, follow
   `backend/README.md`; do not overwrite a working `.env` with the example.
2. Start PostgreSQL. In a terminal:

   ```sh
   cd backend
   source .venv/bin/activate
   python manage.py check
   python manage.py test
   python manage.py runserver
   ```

   Tests require permission to create a separate PostgreSQL test database. There
   are no new migrations and no need to reset or reseed an existing database.
3. In another terminal:

   ```sh
   cd frontend
   npm test
   npm run lint
   npm run build
   npm run dev
   ```

   Open `http://localhost:5173`. Sign in again after the signing-key change.
4. Register a fictional disposable account. Try blank fields, a duplicate
   username, malformed email, and common/numeric passwords. A valid unrelated
   password should register and work at login.
5. In Journals, reject blank/whitespace-only text. Create and edit an English
   entry, analyze it, and reload to verify persistence. Edit it again: the old
   analysis should disappear. Analyze the updated entry again.
6. Save a Burmese entry. Saving should work; analysis should return an
   understandable English-only limitation without destroying the journal.
   The input help explains the 20,000-character limit and model truncation.
7. Submit PHQ-9 with every answer 0 except **question 9 = 1**. The supportive
   message must appear before submission, on the saved result, and in History,
   even though the total score is only 1. Repeat with question 9 = 0; no positive-
   response message should appear. GAD-7 does not trigger this PHQ-9 message.
8. Use browser developer tools' Network panel to inspect validation errors. To
   test expired access with a valid refresh token, set only `access_token` to a
   fictional invalid string in Application → Local Storage and reload Dashboard.
   It should recover through one shared refresh for its parallel requests. Set
   both tokens to fictional invalid strings: expect logout and the expired-
   session message. Never paste actual token values into reports.
9. Block the backend URL using developer tools request blocking, then open
   Journals or Dashboard. Confirm a clear connection message. Unblock and reload.
   Do not stop PostgreSQL while writing real development records just to test an
   outage; the backend tests simulate database and model failures safely.
10. Sign in as a second disposable user. Its journals, assessment history, and AI
    history must not contain the first user's data. Directly requesting another
    user's journal or analysis ID should return 404, and modifying it should fail.
11. Check profile edits, wrong-current-password rejection, password matching,
    successful password-change logout, and login with the new password. Existing
    profile tests also verify that protected fields cannot be overwritten.
12. Delete only the disposable accounts you created for testing. Require the
    password, checkbox, and confirmation dialog. Verify logout. Automated tests
    confirm related journals, analyses, assessments, and answers are removed while
    the other user's data remains.
13. Resize to mobile width and check the safety notices, errors, forms, charts,
    and navigation remain usable. Confirm no credentials, journal text, or
    questionnaire responses appear in the browser console.

## Files created or modified

Created:

- `backend/.env.example` — placeholder-only local setup template.
- `backend/config/env.py` — small non-executing local configuration loader.
- `backend/api/exceptions.py` — safe JSON API errors and minimal logs.
- `backend/api/middleware.py` — no-store API response headers.
- `backend/api/test_helpers.py` — fictional reusable security test fixtures.
- `backend/analysis/validation.py` — bounded/nonblank analysis input and script checks.
- `frontend/src/components/SafetyNotice.jsx` — shared supportive question-9 guidance.
- `frontend/src/utils/format.test.js` — dependency-free Node error-message tests.
- `SECURITY_TESTING.md` — this review and manual checklist.
- `backend/.env` — local configuration preserved/generated; ignored, not a commit file.

Modified:

- `backend/config/settings.py` — environment configuration, safe errors, default permissions, and local CORS.
- `backend/accounts/serializers.py` — registration password validation.
- `backend/accounts/tests.py` — registration validation and password-storage tests; existing privacy tests retained.
- `backend/journals/serializers.py` — journal content validation.
- `backend/journals/views.py` — connected transactional stale-analysis invalidation.
- `backend/journals/tests.py` — ownership, validation, and stale-analysis tests.
- `backend/assessments/serializers.py` — questionnaire checks, atomic saving, question-9 support flag.
- `backend/assessments/views.py` — prefetch saved answers for history safety flags.
- `backend/assessments/tests.py` — scoring, invalid answers, ownership, support flags, rollback tests.
- `backend/analysis/services.py` — lazy model-library import; model IDs unchanged.
- `backend/analysis/views.py` — analysis validation, safe model failures, stale-write protection.
- `backend/analysis/tests.py` — ownership, language/length, model-failure, and stale-result tests.
- `backend/api/tests.py` — endpoint permissions, JWTs, safe errors, CORS, caching, and configuration tests.
- `backend/README.md` — corrected PostgreSQL/local setup instructions.
- `frontend/src/api/axios.js` — shared refresh, expiry feedback, and timeouts.
- `frontend/src/utils/format.js` — safe and readable error messages.
- `frontend/src/pages/Assessments.jsx` — live/result guidance and real question numbers.
- `frontend/src/pages/AssessmentHistory.jsx` — dated historical support guidance.
- `frontend/src/pages/Journals.jsx` — English-only/model-limit notices and validation errors.
- `frontend/src/pages/Dashboard.jsx` — shared network/server error feedback.
- `frontend/src/pages/Login.jsx` — expired-session feedback.
- `frontend/package.json` — `npm test` uses Node's built-in test runner; no new dependencies.

No database models, migrations, AI model IDs, scoring thresholds, or UI theme files
were changed. Unrelated user changes are outside this file list.
