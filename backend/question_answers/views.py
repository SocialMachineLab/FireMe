from django.shortcuts import render
from .models import Question, Answer
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated

from .serializers import QuestionSerializer, AnswerSerializer
# Create your views here.

class QuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Question.objects.filter(user=self.request.user)
        term = self.request.query_params.get("search")
        if term:
            qs = qs.filter(question__icontains=term.strip())

        return qs.order_by("-created_at")

    def perform_destroy(self, instance):
        instance.delete()

    @action(detail=True, methods=["get"])
    def answers(self, request, pk=None):
        question = get_object_or_404(self.get_queryset(), pk=pk)
        qs = question.answers.filter(is_active=True).order_by("answer_id")
        return Response(AnswerSerializer(qs, many=True).data)

    @action(detail=True, methods=["post"])
    def add_answer(self, request, pk=None):
        question = get_object_or_404(self.get_queryset(), pk=pk)
        payload = {"question": question.question_id, "answer": request.data.get("answer", "").strip()}
        serializer = AnswerSerializer(data=payload, context={"request": request})
        if serializer.is_valid():
            ans = serializer.save()
            return Response(AnswerSerializer(ans, context={"request": request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AnswerViewSet(viewsets.ModelViewSet):
    serializer_class = AnswerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only answers for the current user's questions
        return Answer.objects.filter(question__user=self.request.user).order_by("-created_at")

    def perform_destroy(self, instance):
        instance.delete()