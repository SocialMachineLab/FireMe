from rest_framework import serializers
from .models import Campaign, Query, QueryResults
from django.core.exceptions import ValidationError


class CampaignSerializer(serializers.ModelSerializer):

    class Meta:
        model = Campaign
        fields = ["campaign_id", "plt", "name", "created_at", "modified_at"]

    def validate(self, data):

        if not data.get('plt'):
            raise serializers.ValidationError({"plt": "Platform is required for a Campaign !"})
        
        return data
    
    def create(self, validated_data):
        user = self.context['request'].user
        return Campaign.objects.create(user=user, **validated_data)

class QuerySerializer(serializers.ModelSerializer):

    class Meta:
        model = Query
        fields = ["query_id", "campaign", "search_term", "created_at", "modified_at"]
        read_only_fields = ["created_at", "modified_at"]

    def validate(self, attrs):
        # ---- search_term: required + non-blank after trim
        search_term = attrs.get("search_term", getattr(self.instance, "search_term", None))
        if not search_term or not str(search_term).strip():
            raise serializers.ValidationError({"search_term": "Search term cannot be blank !"})

        # ---- ownership check on campaign (create or update)
        request = self.context.get("request")
        if request is None or not hasattr(request, "user"):
            # If this ever hits, your view didn't pass context; ModelViewSet normally does.
            return attrs

        # For PATCH where campaign may be omitted, fall back to instance.campaign
        campaign = attrs.get("campaign", getattr(self.instance, "campaign", None))
        if campaign is not None:
            # Compare the foreign key id to the current user id
            if campaign.user_id != getattr(request.user, "id", None):
                raise serializers.ValidationError({"campaign": "You do not own this campaign!"})

        # Normalize the trimmed search_term back into attrs (so DB stores trimmed)
        attrs["search_term"] = str(search_term).strip()
        return attrs
    
    def create(self, validated_data):
        return Query.objects.create(**validated_data)
    

class QueryResultSerializer(serializers.ModelSerializer):

    class Meta:
        model = QueryResults
        fields = ["qres_id", "query", "plt", "poll_result", "user_data",
                  "source_id", "firescore", "is_active"]
        
    
    def validate(self, data):
        query = data.get("query", getattr(self.instance, "query", None))
        plt = data.get("plt", getattr(self.instance, "plt", None))
        pr = data.get("poll_result", getattr(self.instance, None))

        if query and plt and query.campaign.plt_id != plt.pk:
            raise serializers.ValidationError({"plt": "Platform must match the Campaign's Platform for this query"})
        

        if pr and query and pr.poll.query_id != query.pk:
            raise serializers.ValidationError({"poll_result": "Poll Result's poll's query should match this query"})
        
        return data
    
    