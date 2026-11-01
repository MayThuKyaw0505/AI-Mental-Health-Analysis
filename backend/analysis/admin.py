from django.contrib import admin
from .models import AIAnalysis


@admin.register(AIAnalysis)
class AIAnalysisAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "journal_entry",
        "sentiment",
        "sentiment_confidence",
        "emotion",
        "emotion_confidence",
        "created_at",
    )
