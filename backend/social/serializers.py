from rest_framework import serializers
from .models import Platform, UserPlatformApp, UserPlatformConnection


class PlatformSerializer(serializers.ModelSerializer):
    connected = serializers.SerializerMethodField()

    class Meta:
        model = Platform
        fields = ["plt_id", "name", "logo_url", "webpage", "connected"]

    def get_connected(self, obj):
        user = self.context["request"].user

        if not getattr(user, "is_authenticated", False):
            return False
        
        return obj.connections.filter(user=user, is_active=True).exists()
    


class AppUpsertSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = UserPlatformApp
        fields = ["client_id", "client_secret", "meta"]
        extra_kwargs = {f: {"write_only": True} for f in ["client_id", "client_secret"]}

    def create(self, validated):

        req = self.context["request"]
        platform = self.context["platform"]

        obj, created = UserPlatformApp.all_objects.get_or_create(
            user = req.user,
            platform = platform, 
            defaults={**validated, "is_active": True}
        )

        if not created:

            for k, v in validated.items():
                setattr(obj, k, v)

            obj.is_active = True
            obj.save(update_fields=[*validated.keys(), "is_active", "modified_at"])

        return obj
    

class ConnectionUpsertSerializer(serializers.ModelSerializer):

    class Meta:
        model = UserPlatformConnection
        fields = [
            "external_account_id", "external_username", "oauth_version",
            "bearer_token", "access_token", "refresh_token", "token_secret",
            "token_type", "scope", "expires_at", "meta",
        ]
        
        # Secrets are write_only; we never serialize them back to the client
        extra_kwargs = {f: {"write_only": True} for f in [
            "bearer_token", "access_token", "refresh_token", "token_secret"
        ]}
        extra_kwargs["external_account_id"] = {"required": False, "allow_blank": True}

    def validate(self, data):
        
        oauth = data.get("oauth_version", "oauth2")

        if oauth == "oauth1a":
            if not data.get("external_account_id"):
                raise serializers.ValidationError({"external_account_id": "Required for OAuth1.0a."})
            if not (data.get("access_token") and data.get("token_secret")):
                raise serializers.ValidationError("OAuth1.0a requires access_token and token_secret.")

        elif oauth == "oauth2":
            if not data.get("external_account_id"):
                raise serializers.ValidationError({"external_account_id": "Required for OAuth2 user tokens."})
            if not (data.get("access_token") or data.get("bearer_token")):
                raise serializers.ValidationError("OAuth2 requires access_token or bearer_token.")

        elif oauth == "app":
            if not data.get("bearer_token"):
                raise serializers.ValidationError("App-only requires bearer_token.")
            # normalize: store NULL in DB, not empty string
            data["external_account_id"] = None

        else:
            raise serializers.ValidationError({"oauth_version": "Invalid value."})
        
        return data
    
    def create(self, validated):
        req = self.context["request"]
        platform = self.context["platform"]

        try:
            app = UserPlatformApp.objects.get(user=req.user, platform=platform, is_active=True)
        except UserPlatformApp.DoesNotExist:
            raise serializers.ValidationError("No active app found for this platform. Set client id / secret first!")
        

        obj, created = UserPlatformConnection.all_objects.get_or_create(
            user = req.user,
            platform = platform,
            external_account_id = validated.get("external_account_id"),
            oauth_version = validated.get("oauth_version", "oauth2"),
            defaults={**validated, "app": app, "is_active" : True}
        )

        if not created:
            # Update token fields, re-link to (possibly new) app, mark active
            for k, v in validated.items():
                setattr(obj, k, v)
            obj.app = app
            obj.is_active = True
            obj.save(update_fields=[*validated.keys(), "app", "is_active", "modified_at"])

        return obj
        

class MyConnectionPublicSerializer(serializers.ModelSerializer):

    platform = PlatformSerializer(read_only=True)

    class Meta:
        model = UserPlatformConnection
        fields = [
            "upc_id", "platform", "external_account_id", "external_username",
            "oauth_version", "token_type", "scope", "expires_at", "is_active",
        ]



