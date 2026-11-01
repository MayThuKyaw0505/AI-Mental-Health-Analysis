# from django.shortcuts import render

# Create your views here.
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Questionnaire, Assessment

from .serializers import (
    QuestionnaireSerializer,
    AssessmentCreateSerializer,
    AssessmentResultSerializer,
)


class QuestionnaireListView(generics.ListAPIView):
    queryset = Questionnaire.objects.prefetch_related(
        "questions"
    )
    serializer_class = QuestionnaireSerializer
    permission_classes = [IsAuthenticated]


class AssessmentCreateView(generics.CreateAPIView):
    serializer_class = AssessmentCreateSerializer
    permission_classes = [IsAuthenticated]


class AssessmentHistoryView(generics.ListAPIView):
    serializer_class = AssessmentResultSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Assessment.objects.filter(
            user=self.request.user
        ).select_related(
            "questionnaire"
        ).order_by("-created_at")
