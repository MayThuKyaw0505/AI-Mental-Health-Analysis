from django.db import models
from journals.models import JournalEntry


class AIAnalysis(models.Model):
    journal_entry = models.OneToOneField(
        JournalEntry,
        on_delete=models.CASCADE,
        related_name="ai_analysis"
    )

    sentiment = models.CharField(
        max_length=50
    )

    sentiment_confidence = models.FloatField(
        null=True,
        blank=True
    )

    emotion = models.CharField(
        max_length=50,
        blank=True
    )

    emotion_confidence = models.FloatField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"Analysis for Journal {self.journal_entry.id}"
