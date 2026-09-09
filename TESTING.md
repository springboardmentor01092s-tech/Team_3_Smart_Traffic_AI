# Testing Guide

## Backend (pytest)

```bash
cd Backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
pytest -q
```

Expected result: `18 passed`.

What's covered (`Backend/app/tests/`):
- `test_auth.py` — registration, login (success/failure), `/auth/me`,
  role-based access control on `/auth/admin`.
- `test_traffic.py` — congestion-level calculation, operator-only
  ingestion, live traffic (latest reading per road), per-road history.
- `test_alerts.py` — auth requirement, alert creation, alert listing.

Tests run against an isolated SQLite file (`app/tests/test_users.db`)
created fresh before every test and dropped afterward — they never touch
`users.db` or any real data, and are safe to run repeatedly.

### Adding more tests
Follow the existing pattern: import `register_user`, `login_user`, and
`auth_headers` from `conftest.py`, use the `client` fixture, and each test
gets a clean database automatically via the `fresh_database` fixture.

## Frontend (Jest + React Testing Library)

```bash
cd frontend
npm install
CI=true npm test -- --watchAll=false
```

Expected result: `Tests: 5 passed, 5 total`.

What's covered:
- `src/components/ProtectedRoute.test.jsx` — redirect-to-login when
  unauthenticated, access granted for matching role, redirect to the
  correct dashboard for a mismatched role.
- `src/pages/Login.test.jsx` — form renders and accepts input.

### Notes on the test setup
- `src/setupTests.js` imports `@testing-library/jest-dom` matchers and
  polyfills `TextEncoder`/`TextDecoder`, which `react-router` v7 needs but
  jsdom (Jest's DOM environment) doesn't provide by default.
- `package.json` adds a `jest.moduleNameMapper` entry so Jest can resolve
  `react-router-dom`'s package `exports` correctly. Without these two
  fixes, any test that imports `react-router-dom` fails to even load —
  this affects any new frontend test you add that touches routing.

## Continuous testing
Both suites are fast (backend ~7s, frontend ~2s) and side-effect free, so
they're a good fit for a CI step (e.g. GitHub Actions) before building the
Docker images described in `DEPLOYMENT.md`. A minimal workflow would run
`pytest -q` in `Backend/` and `CI=true npm test -- --watchAll=false` in
`frontend/` on every push.
