from django.shortcuts import render

from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from journals.models import JournalEntry
from .models import AIAnalysis
from .services import analyze_sentiment, analyze_emotion
from .serializers import AIAnalysisSerializer


class AnalyzeJournalView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, journal_id):

        try:
            journal = JournalEntry.objects.get(
                id=journal_id,
                user=request.user
            )

        except JournalEntry.DoesNotExist:
            return Response(
                {"error": "Journal entry not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        sentiment_result = analyze_sentiment(journal.content)

        emotion_result = analyze_emotion(journal.content)

        analysis, created = AIAnalysis.objects.update_or_create(
            journal_entry=journal,
            defaults={
                "sentiment": sentiment_result["sentiment"],
                "sentiment_confidence": sentiment_result["sentiment_confidence"],
                "emotion": emotion_result["emotion"],
                "emotion_confidence": emotion_result["emotion_confidence"],
            },
        )

        return Response(
            {
                "journal_id": journal.id,

                "sentiment": analysis.sentiment,
                "sentiment_confidence":
                analysis.sentiment_confidence,

                "emotion": analysis.emotion,
                "emotion_confidence":
                analysis.emotion_confidence,
            },
            status=status.HTTP_200_OK
        )


class AIAnalysisResultView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, journal_id):

        try:
            analysis = AIAnalysis.objects.select_related(
                "journal_entry"
            ).get(
                journal_entry__id=journal_id,
                journal_entry__user=request.user
            )

        except AIAnalysis.DoesNotExist:
            return Response(
                {
                    "error": "AI analysis not found for this journal."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AIAnalysisSerializer(analysis)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )


class AIAnalysisHistoryView(generics.ListAPIView):
    serializer_class = AIAnalysisSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            AIAnalysis.objects
            .filter(journal_entry__user=self.request.user)
            .select_related("journal_entry")
            .order_by("-created_at")
        )
