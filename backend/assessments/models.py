# from django.db import models

# Create your models here.

from django.db import models
from django.contrib.auth.models import User


class Questionnaire(models.Model):
    TYPE_CHOICES = [
        ("PHQ9", "PHQ-9"),
        ("GAD7", "GAD-7"),
    ]

    name = models.CharField(max_length=100)
    questionnaire_type = models.CharField(
        max_length=10,
        choices=TYPE_CHOICES,
        unique=True
    )
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Question(models.Model):
    questionnaire = models.ForeignKey(
        Questionnaire,
        on_delete=models.CASCADE,
        related_name="questions"
    )

    question_number = models.PositiveIntegerField()
    question_text = models.TextField()

    def __str__(self):
        return f"{self.questionnaire.name} - Q{self.question_number}"


class Assessment(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="assessments"
    )

    questionnaire = models.ForeignKey(
        Questionnaire,
        on_delete=models.CASCADE
    )

    total_score = models.PositiveIntegerField()
    severity = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.questionnaire.name}"


class Response(models.Model):
    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name="responses"
    )

    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE
    )

    score = models.PositiveSmallIntegerField()

    def __str__(self):
        return f"{self.assessment} - Q{self.question.question_number}"
