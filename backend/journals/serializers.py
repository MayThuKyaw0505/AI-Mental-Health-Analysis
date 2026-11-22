from rest_framework import serializers
from .models import JournalEntry


# Character bound for storage and inference. Existing longer entries remain readable.
MAX_JOURNAL_LENGTH = 20000


class JournalEntrySerializer(serializers.ModelSerializer):
    content = serializers.CharField(allow_blank=False, max_length=MAX_JOURNAL_LENGTH)

    class Meta:
        model = JournalEntry

        fields = [
            "id",
            "user",
            "title",
            "content",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "created_at",
            "updated_at",
        ]
