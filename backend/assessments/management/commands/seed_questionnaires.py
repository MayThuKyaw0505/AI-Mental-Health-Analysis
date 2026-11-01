
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from assessments.models import Questionnaire, Question


QUESTIONNAIRES = {
    "PHQ9": {
        "name": "PHQ-9",
        "description": "Depression symptom screening over the past two weeks",
        "questions": [
            "Little interest or pleasure in doing things",
            "Feeling down, depressed, or hopeless",
            "Trouble falling or staying asleep, or sleeping too much",
            "Feeling tired or having little energy",
            "Poor appetite or overeating",
            "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
            "Trouble concentrating on things, such as reading the newspaper or watching television",
            "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
            "Thoughts that you would be better off dead or of hurting yourself in some way",
        ],
    },
    "GAD7": {
        "name": "GAD-7",
        "description": "Anxiety symptom screening over the past two weeks",
        "questions": [
            "Feeling nervous, anxious, or on edge",
            "Not being able to stop or control worrying",
            "Worrying too much about different things",
            "Trouble relaxing",
            "Being so restless that it is hard to sit still",
            "Becoming easily annoyed or irritable",
            "Feeling afraid as if something awful might happen",
        ],
    },
}


class Command(BaseCommand):
    help = "Safely create or update PHQ-9 and GAD-7 questions"

    @transaction.atomic
    def handle(self, *args, **options):
        for questionnaire_type, data in QUESTIONNAIRES.items():
            questionnaire, _ = Questionnaire.objects.update_or_create(
                questionnaire_type=questionnaire_type,
                defaults={
                    "name": data["name"],
                    "description": data["description"],
                },
            )

            for number, text in enumerate(data["questions"], start=1):
                existing = Question.objects.filter(
                    questionnaire=questionnaire,
                    question_number=number,
                )

                if existing.count() > 1:
                    raise CommandError(
                        f"Duplicate questions for {data['name']} Q{number}"
                    )

                question = existing.first()

                if question:
                    question.question_text = text
                    question.save(update_fields=["question_text"])
                else:
                    Question.objects.create(
                        questionnaire=questionnaire,
                        question_number=number,
                        question_text=text,
                    )

        self.stdout.write(
            self.style.SUCCESS("Questionnaires updated successfully.")
        )
