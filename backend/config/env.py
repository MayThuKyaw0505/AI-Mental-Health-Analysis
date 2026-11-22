"""Read simple KEY=value local settings without executing shell commands."""
import os
import shlex

from django.core.exceptions import ImproperlyConfigured


def load_local_env(path):
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        key, separator, value = line.partition("=")
        key = key.strip()
        if not separator or not key.isidentifier():
            raise ImproperlyConfigured("Invalid local .env setting. Use KEY=value lines.")
        try:
            parts = shlex.split(value, comments=True)
        except ValueError:
            raise ImproperlyConfigured("Invalid quoting in local .env settings.") from None
        if len(parts) > 1:
            raise ImproperlyConfigured("Quote values containing spaces in local .env settings.")
        os.environ.setdefault(key, parts[0] if parts else "")
