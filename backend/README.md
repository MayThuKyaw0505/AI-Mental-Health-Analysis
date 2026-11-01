# Django backend

Requires Python 3.12 or newer. Uses Django and SQLite for local development.

## Run locally

From the project root:

```sh
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

If the virtual environment already exists, skip creating it and activate it.

- Health endpoint: http://127.0.0.1:8000/api/health/ returns `{"status": "ok"}`.
- Admin: http://127.0.0.1:8000/admin/. Create a login with `python manage.py createsuperuser`.

## Configuration

Settings read environment variables from the shell; `.env` files are not loaded automatically.

| Variable | Local default |
| --- | --- |
| `DJANGO_DEBUG` | `true` (set to `false` outside development) |
| `DJANGO_SECRET_KEY` | Development-only key; required when debug is disabled |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1,[::1]` (comma-separated) |

This is a development scaffold. Configure production hosting and security settings before deployment.

## Structure

- `config/`: settings and project URL routing; ASGI and WSGI entry points.
- `api/`: application code and API routes.
- `db.sqlite3`: local database, excluded from version control.

Run `python manage.py check` to validate the project configuration.
