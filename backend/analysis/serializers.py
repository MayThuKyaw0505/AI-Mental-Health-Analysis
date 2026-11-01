# from rest_framework import serializers
# from .models import AIAnalysis


# class AIAnalysisSerializer(serializers.ModelSerializer):
#     journal_id = serializers.IntegerField(
#         source="journal_entry.id",
#         read_only=True
#     )

#     class Meta:
#         model = AIAnalysis
#         fields = [
#             "id",
#             "journal_id",
#             "sentiment",
#             "sentiment_confidence",
#             "emotion",
#             "emotion_confidence",
#             "created_at",
#         ]

from rest_framework import serializers
from .models import AIAnalysis


class AIAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIAnalysis
        fields = [
            "id",
            "journal_entry",
            "sentiment",
            "sentiment_confidence",
            "emotion",
            "emotion_confidence",
            "created_at",
        ]
        read_only_fields = fields
