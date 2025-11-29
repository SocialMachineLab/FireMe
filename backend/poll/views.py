from django.shortcuts import render
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from campaign.permissions import IsOwnerOrReadOnly
from .models import Poll, PollResult
from django.db.models import Count
from django.db import transaction
from .serializers import PollSerializer, PollResultSerializer
from .utils import user_scoped_poll_queryset

# Create your views here.
class PollViewSet(viewsets.ModelViewSet):

    serializer_class = PollSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        qs = Poll.objects.order_by("-created_at")

        campaign_id = self.request.query_params.get('campaign')
        query_id = self.request.query_params.get('query')

        if campaign_id:
            qs = qs.filter(query__campaign_id = campaign_id)

        if query_id:
            qs = qs.filter(query_id = query_id)

        return user_scoped_poll_queryset(self.request.user, qs)
    
    def perform_create(self, serializer):
        # enforce ownership: the posted query must belong to this user
        query = serializer.validated_data["query"]
        if query.campaign.user != self.request.user:
            raise PermissionError("You do not own this query.")
        serializer.save()

    def perform_update(self, serializer):
        # same ownership guard on update (query may change)
        query = serializer.validated_data.get("query", serializer.instance.query)
        if query.campaign.user != self.request.user:
            raise PermissionError("You do not own this query.")
        serializer.save()

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])

    @action(detail=False, methods=['get'])
    def live(self, request):
        """
        GET /api/polls/live
        """
        qs = user_scoped_poll_queryset(request.user, Poll.objects.live()).order_by("-starts_at")
        ser = self.get_serializer(qs, many=True)
        return Response(ser.data)
    
    @action(detail=False, methods=["get"])
    def upcoming(self, request):
        """
        GET /api/polls/upcoming
        """
        qs = user_scoped_poll_queryset(request.user, Poll.objects.upcoming()).order_by("starts_at")
        ser = self.get_serializer(qs, many=True)
        return Response(ser.data)
    
    @action(detail=False, methods=["get"])
    def finished(self, request):
        """
        GET /api/polls/finished
        """
        qs = user_scoped_poll_queryset(request.user, Poll.objects.finished()).order_by("-ends_at")
        ser = self.get_serializer(qs, many=True)
        return Response(ser.data)
    
    @action(detail=True, methods=["post"])
    def add_result(self, request, pk=None):
        """
        POST /api/polls/{id}/add_result
        """
        poll = get_object_or_404(self.get_queryset(), pk=pk)
        payload = {
            "poll": poll.poll_id,
            "answer": request.data.get("answer"),  # may be null/blank 
            "user_identifier": (request.data.get("user_identifier") or "").strip(),
        }
        ser = PollResultSerializer(data=payload, context={"request": request})
        ser.is_valid(raise_exception=True)

        # Replace behavior: deactivate old, then create new (atomic to satisfy the unique constraint)
        with transaction.atomic():
            # lock current active rows for this user in this poll to avoid race conditions
            existing_qs = (
                PollResult.objects.select_for_update()
                .filter(poll=poll, user_identifier=ser.validated_data["user_identifier"], is_active=True)
            )
            if existing_qs.exists():
                existing_qs.update(is_active=False)

            obj = PollResult.objects.create(**ser.validated_data)

        return Response(PollResultSerializer(obj).data, status=status.HTTP_201_CREATED)
    
    
    @action(detail=True, methods=["get"])
    def results(self, request, pk=None):
        """
        GET /api/polls/{id}/results/
        """
        poll = get_object_or_404(self.get_queryset(), pk=pk)
        qs = poll.results.select_related("answer").order_by("-created_at")
        ser = PollResultSerializer(qs, many=True)
        return Response(ser.data)
    

    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        """
        GET /api/polls/{id}/summary
        """
        poll = get_object_or_404(self.get_queryset(), pk = pk)
        counts = (
            PollResult.objects
            .filter(poll=poll)
            .values("answer")
            .annotate(count=Count("pr_id"))
            .order_by("-count")
        )

        # Attach answer text efficiently
        answers = {a.answer_id: a.answer for a in poll.question.answers.filter(is_active=True)}
        data = [
            {"answer": row["answer"], "count": row["count"], "answer_text": answers.get(row["answer"])}
            for row in counts
        ]
        return Response(data)
    

class PollResultViewSet(viewsets.ModelViewSet):
    serializer_class = PollResultSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        # scope by poll -> query.campaign.user
        qs = (
            PollResult.objects
            .select_related("poll__query__campaign", "answer", "poll__question")
            .order_by("-created_at")
        )
        return qs.filter(poll__query__campaign__user=self.request.user)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])


    # Use POST for editing as well
    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        poll = ser.validated_data["poll"]
        # ownership check
        if poll.query.campaign.user != request.user:
            return Response({"detail": "Forbidden."}, status=403)

        with transaction.atomic():
            PollResult.objects.select_for_update().filter(
                poll=poll,
                user_identifier=ser.validated_data["user_identifier"],
                is_active=True,
            ).update(is_active=False)
            obj = PollResult.objects.create(**ser.validated_data)

        out = self.get_serializer(obj).data
        return Response(out, status=status.HTTP_201_CREATED)