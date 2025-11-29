from django.db import models
from django.utils import timezone
from django.db.models import Q, F
from core.models import SoftDeleteModel
from django.core.exceptions import ValidationError


# Create your models here.

class PollQuerySet(models.QuerySet):

    def live(self, now=None):
        now = now or timezone.now()
        return self.filter(is_active = True, starts_at__lte=now, ends_at__gte=now)
    
    def upcoming(self, now = None):
        now = now or timezone.now()
        return self.filter(is_active = True, starts_at__gt = now)
    
    def finished(self, now=None):
        now = now or timezone.now()
        return self.filter(is_active = True, ends_at__lt = now)



class Poll(SoftDeleteModel):

    poll_id = models.BigAutoField(primary_key=True)
    title = models.CharField(max_length=150, null=True, blank=True)
    query = models.ForeignKey("campaign.Query", on_delete=models.CASCADE, related_name="polls")
    question = models.ForeignKey("question_answers.Question", on_delete=models.PROTECT, related_name="polls")
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()

    objects = PollQuerySet.as_manager()

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["query", "is_active", "starts_at", "ends_at"]),
            models.Index(fields=["question"]),
            models.Index(fields=["query", "title"])
        ]
        constraints=[
            models.CheckConstraint(
                check=Q(ends_at__gte=F("starts_at")),
                name="chk_poll_window_valid",
            ),
        ]

    def __str__(self):
        return self.title
    
    @property
    def is_live(self) -> bool:
        now = timezone.now()
        return self.is_active and self.starts_at <= now <= self.ends_at


class PollResult(SoftDeleteModel):
    pr_id = models.BigAutoField(primary_key=True)
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name="results")
    answer = models.ForeignKey("question_answers.Answer", on_delete=models.PROTECT, related_name = "poll_results", null=True, blank=True)
    user_identifier = models.CharField(max_length=255)

    class Meta:

        ordering = ["-created_at"]
        indexes=[
            models.Index(fields=["poll","is_active", "user_identifier"]),
            models.Index(fields=["poll", "answer"])
        ]
        constraints=[
            models.UniqueConstraint(
                fields=["poll", "user_identifier"],
                condition=Q(is_active=True),
                name="uq_active_result_per_user_per_poll",
            )
        ]

    def clean(self):

        if self.answer_id and self.poll_id:
            if self.answer.question_id != self.poll.question_id:
                raise ValidationError("Answer does not belong to this Poll's Question.")
        if self.user_identifier:
            self.user_identifier = self.user_identifier.strip()

