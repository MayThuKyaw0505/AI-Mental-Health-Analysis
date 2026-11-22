import logging

from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from journals.models import JournalEntry
from .models import AIAnalysis
from .services import analyze_sentiment, analyze_emotion
from .serializers import AIAnalysisSerializer
from .validation import validate_analysis_text

logger = logging.getLogger(__name__)


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

        validate_analysis_text(journal.content)
        original_content = journal.content
        try:
            sentiment_result = analyze_sentiment(original_content)
            emotion_result = analyze_emotion(original_content)
        except Exception as exc:
            # Never log text, request bodies, or the model exception message.
            logger.warning("AI processing failed (%s).", type(exc).__name__)
            return Response(
                {"detail": "AI analysis is temporarily unavailable. Your journal is saved. Please try again later."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        with transaction.atomic():
            current = get_object_or_404(
                JournalEntry.objects.select_for_update(), pk=journal.pk, user=request.user
            )
            if current.content != original_content:
                return Response({"detail": "This journal changed during analysis. Please analyze the updated entry again."}, status=409)
            analysis, _ = AIAnalysis.objects.update_or_create(
                journal_entry=current,
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
