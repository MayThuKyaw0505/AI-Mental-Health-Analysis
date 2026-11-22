from django.db import transaction
from rest_framework import serializers
from .models import (
    Questionnaire,
    Question,
    Assessment,
    Response,
)


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = [
            "id",
            "question_number",
            "question_text",
        ]


class QuestionnaireSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Questionnaire
        fields = [
            "id",
            "name",
            "questionnaire_type",
            "description",
            "questions",
        ]


class ResponseInputSerializer(serializers.Serializer):
    question = serializers.IntegerField()
    score = serializers.IntegerField(
        min_value=0,
        max_value=3
    )


class AssessmentCreateSerializer(serializers.Serializer):
    questionnaire = serializers.PrimaryKeyRelatedField(
        queryset=Questionnaire.objects.all()
    )

    responses = ResponseInputSerializer(many=True)

    def validate(self, data):
        questionnaire = data["questionnaire"]
        responses = data["responses"]
        expected_count = {"PHQ9": 9, "GAD7": 7}.get(questionnaire.questionnaire_type)
        numbers = list(questionnaire.questions.values_list("question_number", flat=True))
        if expected_count is None or sorted(numbers) != list(range(1, expected_count + 1)):
            raise serializers.ValidationError("This questionnaire is not configured correctly. Please contact the project administrator.")

        valid_questions = list(
            questionnaire.questions.values_list("id", flat=True)
        )

        submitted_questions = [
            item["question"] for item in responses
        ]

        # Check number of answers
        if len(submitted_questions) != len(valid_questions):
            raise serializers.ValidationError(
                f"You must answer all {len(valid_questions)} questions."
            )

        # Check duplicate questions
        if len(submitted_questions) != len(set(submitted_questions)):
            raise serializers.ValidationError(
                "The same question cannot be answered more than once."
            )

        # Check questions belong to selected questionnaire
        if set(submitted_questions) != set(valid_questions):
            raise serializers.ValidationError(
                "Invalid questions were submitted for this questionnaire."
            )

        return data

    @transaction.atomic
    def create(self, validated_data):
        user = self.context["request"].user
        questionnaire = validated_data["questionnaire"]
        response_data = validated_data["responses"]

        total_score = sum(
            item["score"] for item in response_data
        )

        severity = self.get_severity(
            questionnaire.questionnaire_type,
            total_score
        )

        assessment = Assessment.objects.create(
            user=user,
            questionnaire=questionnaire,
            total_score=total_score,
            severity=severity,
        )

        for item in response_data:
            question = Question.objects.get(
                id=item["question"],
                questionnaire=questionnaire,
            )

            Response.objects.create(
                assessment=assessment,
                question=question,
                score=item["score"],
            )

        return assessment

    def get_severity(self, questionnaire_type, score):
        if questionnaire_type == "PHQ9":
            if score <= 4:
                return "Minimal"
            elif score <= 9:
                return "Mild"
            elif score <= 14:
                return "Moderate"
            elif score <= 19:
                return "Moderately Severe"
            return "Severe"

        if questionnaire_type == "GAD7":
            if score <= 4:
                return "Minimal"
            elif score <= 9:
                return "Mild"
            elif score <= 14:
                return "Moderate"
            return "Severe"

        return "Unknown"

    def to_representation(self, instance):
        return AssessmentResultSerializer(instance).data


def safety_support_recommended(assessment):
    if assessment.questionnaire.questionnaire_type != "PHQ9":
        return False
    # Look up the persisted validated answer by question NUMBER, never list position.
    answers = [answer for answer in assessment.responses.all() if answer.question.question_number == 9]
    if not answers:
        return None  # Historical data without a recorded answer cannot be assessed.
    return any(answer.score > 0 for answer in answers)


class AssessmentResultSerializer(serializers.ModelSerializer):
    safety_support_recommended = serializers.SerializerMethodField()

    def get_safety_support_recommended(self, instance):
        return safety_support_recommended(instance)

    questionnaire = serializers.CharField(
        source="questionnaire.name",
        read_only=True
    )

    class Meta:
        model = Assessment
        fields = [
            "id",
            "questionnaire",
            "total_score",
            "severity",
            "created_at",
            "safety_support_recommended",
        ]
