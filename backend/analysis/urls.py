from django.urls import path
from .views import (
    AnalyzeJournalView,
    AIAnalysisResultView,
    AIAnalysisHistoryView,
)


urlpatterns = [
    path(
        "journals/<int:journal_id>/analyze/",
        AnalyzeJournalView.as_view(),
        name="analyze-journal",
    ),
    path(
        "journals/<int:journal_id>/",
        AIAnalysisResultView.as_view(),
        name="analysis-result",
    ),
    path(
        "history/",
        AIAnalysisHistoryView.as_view(),
        name="ai-analysis-history",
    ),
]
