from django.urls import path
from .views import (
    QuestionnaireListView,
    AssessmentCreateView,
    AssessmentHistoryView,
)


urlpatterns = [
    path(
        "questionnaires/",
        QuestionnaireListView.as_view(),
        name="questionnaire-list",
    ),

    path(
        "assessments/",
        AssessmentCreateView.as_view(),
        name="assessment-create",
    ),

    path(
        "assessments/history/",
        AssessmentHistoryView.as_view(),
        name="assessment-history",
    ),
]
