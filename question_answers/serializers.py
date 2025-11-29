from rest_framework import serializers
from .models import Question, Answer

class AnswerSerializer(serializers.ModelSerializer):

    class Meta:
        model = Answer
        fields=["answer_id", "question", "answer", "created_at", "modified_at"]

    def validate_answer(self, value):

        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Answer text cannot be blank!")
        
        return value
    
    def validate(self, attrs):
        request = self.context.get("request")
        question = attrs.get("question", getattr(self.instance, "question", None))
        if question is None:
            raise serializers.ValidationError({"question": "Question is required."})
        if request and question.user_id != request.user.id:
            raise serializers.ValidationError({"question": "You do not own this question."})
        # normalize trimmed text back
        if "answer" in attrs:
            attrs["answer"] = attrs["answer"].strip()
        return attrs
    
class QuestionSerializer(serializers.ModelSerializer):
    
    answers = AnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["question_id", "question", "answers", "is_active", "created_at", "modified_at"]
        # read_only_fields = ["is_active", "created_at", "modified_at"]


    def create(self, validated_data):
        request = self.context["request"]
        return Question.objects.create(user=request.user, **validated_data)

    def validate_question(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Question text cannot be left blank!")
        
        return value
    
    