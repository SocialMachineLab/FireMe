from django.db import models
from django.db.models import Q
from django.conf import settings
from core.models import SoftDeleteModel

# Create your models here.

class Question(SoftDeleteModel):
    question_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null = False,
            on_delete=models.CASCADE, related_name="questions")
    question = models.TextField()

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "is_active", "created_at"])]

    def __str__(self):
        return self.question[:80] #Upto 80 characters of the question!

class Answer(SoftDeleteModel):
    answer_id = models.BigAutoField(primary_key=True)
    question = models.ForeignKey(Question, on_delete = models.CASCADE, related_name="answers")
    answer = models.TextField()

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["question", "is_active"])]

        #Prevent duplicate active answers per question!
        constraints = [
            # Keep this if you want to prevent duplicate active options per question
            models.UniqueConstraint(
                fields=["question", "answer"],
                condition=Q(is_active=True),
                name="uq_active_answer_per_question",
            ),
        ]

    def __str__(self):
        return self.answer[:80]
    
