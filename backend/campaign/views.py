from django.db.models import Q
from django.db import transaction
from .permissions import IsOwnerOrReadOnly
from poll.models import PollResult
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Campaign, Query, QueryResults
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import render, get_object_or_404
from .serializers import CampaignSerializer, QuerySerializer, QueryResultSerializer

# Create your views here.

class CampaignViewSet(viewsets.ModelViewSet):

    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return Campaign.objects.filter(user = self.request.user)
    
    def perform_destroy(self, instance):
        instance.delete()

    @action(detail=True, methods=["get"])
    def queries(self, request, pk=None):
        """
        GET /api/campaigns/{id}/queries
        """

        campaign = self.get_object()
        qs = campaign.queries.all()
        page = self.paginate_queryset(qs)
        ser = QuerySerializer(page or qs, many=True, context={"request": request})
        return self.get_paginated_response(ser.data) if page is not None else Response(ser.data)
    

    @action(detail=True, methods=["post"])
    def add_query(self, request, pk=None):
        """
        POST /api/campaigns/{id}/add_query/
        """

        campaign = self.get_object()
        payload = {
            "campaign": campaign.pk,
            "search_term": request.data.get("search_term", "")
        }

        ser = QuerySerializer(data=payload, context={"request": request})
        ser.is_valid(raise_exception=True)
        obj = ser.save()

        return Response({"success": True, "query_id": obj.query_id}, status=status.HTTP_201_CREATED)
    

class QueryViewSet(viewsets.ModelViewSet):
    """
    CRUD for Queries
    """
    serializer_class = QuerySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # join through campaign to enforce ownership
        qs = Query.objects.filter(campaign__user=self.request.user)
        campaign_id = self.request.query_params.get("campaign")

        if campaign_id:
            qs = qs.filter(campaign_id = campaign_id)

        return qs.order_by('-created_at')

    def perform_destroy(self, instance):
        instance.delete()


class QueryResultViewSet(viewsets.ModelViewSet):

    serializer_class = QueryResultSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Scope to owner via Query → Campaign → user
        return (
            QueryResults.objects
            .select_related("query__campaign__user", "plt", "poll_result__poll__query")
            .filter(query__campaign__user=self.request.user)
            .order_by("-created_at")
        )
    
    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])


    #link a PollResult to an existing QueryResults row
    @action(detail=True, methods=["post"])
    def attach_poll_result(self, request, pk=None):
        """
        POST /api/query-results/{qres_id}/attach_poll_result/ 
        data = { "poll_result": <id> }
        """
        qres = get_object_or_404(self.get_queryset(), pk=pk)
        pr_id = request.data.get("poll_result")
        if pr_id is None:
            return Response({"poll_result": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)

        pr = get_object_or_404(
            PollResult.objects.select_related("poll__query"),
            pk=pr_id, is_active=True
        )

        # Validate “same query” rule
        if pr.poll.query_id != qres.query_id:
            return Response(
                {"poll_result": ["PollResult.poll.query must match QueryResults.query."]},
                status=status.HTTP_400_BAD_REQUEST
            )

        qres.poll_result = pr
        qres.full_clean()  # calls your model.clean as well
        qres.save(update_fields=["poll_result", "modified_at"])
        return Response(self.get_serializer(qres).data, status=status.HTTP_200_OK)



    @action(detail=False, methods=["post"])
    def bulk_upsert(self, request):
        """    
        POST /api/query-results/bulk_upsert/
        data like : 
                { "query": 123, "plt": 2, 
                    "items": [ 
                        { "source_id": "...", "user_data": {...}, "firescore": 0.91 }, 
                        ... 
                    ] 
                }
        """
        query_id = request.data.get("query")
        plt_id   = request.data.get("plt")
        items    = request.data.get("items", [])

        if not query_id or not plt_id or not isinstance(items, list):
            return Response({"detail": "query, plt and items[] are required."}, status=status.HTTP_400_BAD_REQUEST)

        # ownership check
        qs = self.get_queryset().filter(query_id=query_id, plt_id=plt_id)

        # Using get_queryset() ensures current user owns the query via campaign
        # If no records exist yet, still need to ensure ownership:
        
        query = get_object_or_404(Query.objects.select_related("campaign"), pk=query_id, is_active=True)
        
        if query.campaign.user_id != self.request.user.id:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        
        if query.campaign.plt_id != plt_id:
            return Response({"plt": ["Platform must match the campaign's platform for this query."]}, 
                            status=status.HTTP_400_BAD_REQUEST)

        # Upsert logic: by (query, plt, source_id, is_active=True)
        created, updated = 0, 0
        from campaign.models import QueryResults as QR
        with transaction.atomic():
            for it in items:
                source_id = (it.get("source_id") or "").strip()
                if not source_id:
                    continue
                defaults = {
                    "user_data": it.get("user_data"),
                    "firescore": it.get("firescore"),
                }
                obj, was_created = QR.objects.update_or_create(
                    query_id=query_id, plt_id=plt_id, source_id=source_id, is_active=True,
                    defaults=defaults
                )
                created += int(was_created)
                updated += int(not was_created)

        return Response({"created": created, "updated": updated}, status=status.HTTP_200_OK)