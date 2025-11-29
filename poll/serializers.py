from django.utils import timezone
from .models import Poll, PollResult
from rest_framework import serializers
from question_answers.models import Answer

class PollSerializer(serializers.ModelSerializer):

    class Meta:
        model = Poll
        fields = ["poll_id", "title", "query", "question", "starts_at", "ends_at", "is_active"]

    def validate(self, data):
        
        starts = data.get("starts_at", getattr(self.instance, "starts_at", None))
        ends = data.get("ends_at", getattr(self.instance, "ends_at", None))

        if starts and ends and ends < starts:
            raise serializers.ValidationError({"ends_at": "End time must be greater than start time"})
        
        question = data.get("question", getattr(self.instance, "question", None))
        if question and not question.is_active:
            raise serializers.ValidationError({"question": "Question must be active."})
        
        return data
    

class PollResultSerializer(serializers.ModelSerializer):

    class Meta:
        model = PollResult
        fields = ["pr_id", "poll", "answer", "user_identifier", "is_active"]

    def validate(self, data):
        poll = data.get("poll", getattr(self.instance, "poll", None))
        answer = data.get("answer", getattr(self.instance, "answer", None))
        user_identifier = data.get("user_identifier", getattr(self.instance, "user_identifier", "")) or ""
        user_identifier = user_identifier.strip()

        data['user_identifier'] = user_identifier

        if answer and answer.question_id != poll.question_id:
            raise serializers.ValidationError({"answer": "Answer does not belong to this Question !"})
        
        if poll:
            now = timezone.now()
            if not (poll.is_active and poll.starts_at <= now <= poll.ends_at):
                raise serializers.ValidationError({"poll": "Poll is not live."})
            
        # Un Comment this if we need to dis allow poll answer edit !
        # 
        # if poll and user_identifier:
        #     dup_qs = (
        #         PollResult.objects.active()
        #         .filter(poll=poll, user_identifier=user_identifier)
        #     )
        #     if self.instance:
        #         dup_qs = dup_qs.exclude(pk=self.instance.pk)
        #     if dup_qs.exists():
        #         raise serializers.ValidationError(
        #             {"user_identifier": "A response from this user is already recorded for this poll."}
        #         )

        return data
