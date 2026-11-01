# Step 27 — UI and responsive design

The frontend uses the name **Stillwell** and a shared teal, green, and neutral theme.
No backend files, API endpoints, database models, authentication storage, AI models,
or clinical scoring rules were changed in this step. No application dependencies
were added.

## How the frontend is organized

- `src/components/AppLayout.jsx`: the authenticated sidebar, mobile menu, active
  navigation, logout button, shared footer, and keyboard skip link. React Router's
  `Outlet` displays the current page inside this layout. The existing
  `ProtectedRoute` wraps the layout, protecting all five authenticated pages.
- `src/components/AuthLayout.jsx`: shared welcome panel and centered forms for
  Login and Register.
- `src/components/UI.jsx`: page headings, error/success notices, loading
  indicators, and empty states.
- `src/components/PasswordField.jsx`: a labelled password input with a show/hide
  control. It does not store the password beyond the existing page state.
- `src/components/ConfirmDialog.jsx`: a native modal dialog that keeps keyboard
  focus inside the dialog, supports Escape to cancel before deletion begins,
  and disables controls while a deletion request is running.
- `src/components/Icon.jsx`: local SVG icons; no icon package or image service.
- `src/utils/format.js`: shared date formatting, questionnaire-name display, and
  readable API error messages. It does not calculate scores or severity.
- `src/index.css`: shared design tokens, cards, buttons, forms, and responsive
  rules. `src/pages/Profile.css` contains only Profile-specific layout rules.

The dashboard displays real API counts and scores. Recent entries display titles
and dates; full journal text appears on Journals. Analysis confidence values are
shown only when the API provides a numeric value. Editing a journal continues to
invalidate its previous analysis through the existing backend behavior.

## Verification performed

- `npm run build`: successful. Vite reports the existing large JavaScript bundle
  warning; it does not prevent the local demonstration.
- `npm run lint`: no warnings or errors.
- `git diff --check`: successful.
- Headless Chrome exercised the running frontend and Django API using a newly
  registered disposable account. No mocked API responses or sample data were
  added to the application. The account and its associated records were removed
  when the checks finished.
- Browser checks covered protected-route redirection, registration, password
  visibility, invalid and valid login, empty dashboard values, journal create and
  edit, AI analysis and persistence after reload, PHQ-9 and GAD-7 submission,
  progress indicators, history chart/table, mobile navigation, profile editing,
  password mismatch feedback, password-change logout and subsequent login,
  journal deletion cancellation/confirmation, and account deletion
  cancellation/confirmation. No uncaught runtime errors were reported.
- Every page was checked at 1440, 768, 390, and 320 CSS pixels. No page-level
  horizontal overflow was found, and all form inputs had associated labels.

These are targeted checks, not a full WCAG audit or a guarantee across every
browser/device. The native dialogs were exercised in Chrome.

## Repeat the manual checks

1. Start PostgreSQL and Django as usual. In `frontend/`, run `npm run dev` and open
   `http://localhost:5173`.
2. While signed out, visit `/profile` directly. Expect a redirect to Login.
3. Register a disposable account. Check labels, required fields, password
   visibility, and the account-created message. Try an incorrect login, then
   sign in with the correct details.
4. Check Dashboard with no data. Create journal entries and assessments, then
   return to Dashboard and confirm counts and latest scores match your records.
5. Create a journal, edit it, and cancel an edit. Analyze it, wait for the loading
   state to finish, then reload to confirm the analysis is saved. Edit the journal
   again and confirm the previous analysis disappears. Reanalyze it.
6. Delete a journal: first cancel the dialog, then confirm deletion. Check the
   journal and saved analysis disappear.
7. Open Assessments. Select PHQ-9, answer some questions, and check progress.
   Complete all questions and submit. Repeat with GAD-7. Verify the result and
   severity match the backend response, and the two-week period stays visible.
8. Open Assessment History. Check dates, questionnaire names, scores, severity,
   chart legend, and the two distinct line styles. Inspect a point's tooltip.
9. Update Profile details, reload, and check persistence. Try an invalid email
   or another account's username. Test mismatched new passwords and an incorrect
   current password before changing the password successfully. Expect logout;
   sign in using the new password.
10. With only your disposable account, enter the account-deletion password and
    select the confirmation checkbox. Cancel the dialog with Escape, then open
    it again and confirm deletion. Expect logout and failed subsequent login.
11. Resize to desktop, tablet, and mobile widths. Open the mobile menu, select
    each page, and verify the menu closes and the current page is highlighted.
    Check charts, long journal text, forms, and buttons fit their containers.
12. Use Tab and Shift+Tab throughout. Verify visible focus, the skip link,
    keyboard radio selection, password toggles, and modal cancellation. Enable
    reduced motion in your operating system and check loading text stays clear.
13. Use Log out in the shared navigation and confirm protected pages redirect
    to Login again.

## Files changed in Step 27

Created:

- `src/components/AppLayout.jsx`
- `src/components/AuthLayout.jsx`
- `src/components/ConfirmDialog.jsx`
- `src/components/Icon.jsx`
- `src/components/PasswordField.jsx`
- `src/components/UI.jsx`
- `src/utils/format.js`
- `UI_TESTING.md`

Modified:

- `index.html`
- `public/favicon.svg`
- `src/App.jsx`
- `src/index.css`
- `src/pages/Dashboard.jsx`
- `src/pages/Journals.jsx`
- `src/pages/Assessments.jsx`
- `src/pages/AssessmentHistory.jsx`
- `src/pages/Profile.jsx`
- `src/pages/Profile.css`
- `src/pages/Login.jsx`
- `src/pages/Register.jsx`
