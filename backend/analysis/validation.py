import re

from rest_framework.exceptions import ValidationError
from journals.serializers import MAX_JOURNAL_LENGTH

NON_LATIN_LETTERS = re.compile(r"[^\W\d_]", re.UNICODE)


def validate_analysis_text(text):
    if not isinstance(text, str) or not text.strip():
        raise ValidationError({"content": "Write some journal text before requesting analysis."})
    if len(text) > MAX_JOURNAL_LENGTH:
        raise ValidationError({"content": f"Analysis supports at most {MAX_JOURNAL_LENGTH:,} characters. Shorten this entry before analyzing it."})
    # This is a cautious script check, NOT a language detector. It also rejects
    # mixed Burmese/English input. Latin-script non-English text can still pass.
    letters = NON_LATIN_LETTERS.findall(text)
    if not letters or any(not ("a" <= char.lower() <= "z" or "\u00c0" <= char <= "\u024f") for char in letters):
        raise ValidationError({"content": "These models support English text only. Burmese and other non-Latin scripts cannot be analyzed reliably. Your journal can still be saved in its original language."})
