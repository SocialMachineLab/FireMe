from django.db import models
from django.db.models import Q
from django.conf import settings
from django.utils import timezone
from core.models import SoftDeleteModel
from django.db.models.functions import Lower
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator, URLValidator

# Create your models here.
class Platform(SoftDeleteModel):

    plt_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=50)
    logo_url = models.URLField(max_length=500, blank=True, validators=[URLValidator()])
    webpage = models.URLField(max_length=500, blank=True, validators=[URLValidator()])
    

    class Meta:

        ordering = ["name"]
        indexes = [
            models.Index(fields=["is_active", "name"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["name"],
                condition=Q(is_active = True),
                name="uq_active_platform_name"
            )
        ]

    def __str__(self) -> str:
        return self.name

class UserPlatformApp(SoftDeleteModel):

    upa_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete = models.CASCADE, related_name="platform_apps"
    )
    platform = models.ForeignKey(
        "social.Platform", on_delete = models.CASCADE, related_name="user_apps"
    )

    client_id = models.TextField()
    client_secret = models.TextField()
    meta = models.JSONField(blank=True, null=True)


    class Meta:
        indexes = [models.Index(fields=["user", "platform","is_active"])]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "platform"],
                condition=Q(is_active = True),
                name="uq_active_app_per_user_platform"
            )
        ]

    def __str__(self):
        return f"App[{self.pk}] u={self.user_id} p={self.platform_id}"
    



class UserPlatformConnection(SoftDeleteModel):
    upc_id = models.BigAutoField(primary_key=True)
    user=models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="platform_connections"
    )
    platform = models.ForeignKey(
        "social.platform", on_delete = models.CASCADE, related_name="connections"
    )
    app = models.ForeignKey(
        UserPlatformApp, on_delete=models.PROTECT, related_name="connections"
    )

    external_account_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    external_username = models.CharField(max_length=255, blank=True)

    OAUTH_CHOICES = (("oauth2", "OAuth2"), ("oauth1a", "OAuth1a"), ("app", "AppOnly"))
    oauth_version = models.CharField(max_length=8, choices=OAUTH_CHOICES, default="oauth2")

    bearer_token = models.TextField(blank=True, null=True)
    access_token = models.TextField(blank=True, null=True)
    refresh_token = models.TextField(blank=True, null=True)
    token_secret = models.TextField(blank=True, null=True)

    token_type = models.CharField(max_length=32, blank=True)
    scope = models.TextField(blank=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    meta = models.JSONField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "platform", "is_active"]),
            models.Index(fields=["platform", "oauth_version", "is_active"]),
            models.Index(fields=["platform", "external_account_id", "is_active"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "platform", "external_account_id", "oauth_version"],
                condition=Q(is_active=True),
                name="uq_active_connection_per_user_platform_account_auth",
            ),
        ]

    def __str__(self):
        return f"Conn[{self.pk}] u={self.user_id} p={self.platform_id} acct={self.external_account_id}"

    def clean(self):
        # app must belong to same user+platform
        if self.app.user_id != self.user_id or self.app.platform_id != self.platform_id:
            raise ValidationError("App must belong to the same user and platform.")

        # token shape matches oauth_version
        if self.oauth_version == "oauth1a":
            if not (self.access_token and self.token_secret):
                raise ValidationError("OAuth1.0a requires access_token and token_secret.")
        elif self.oauth_version == "oauth2":
            if not (self.access_token or self.bearer_token):
                raise ValidationError("OAuth2 requires access_token or bearer_token.")
        elif self.oauth_version == "app":
            if not self.bearer_token:
                raise ValidationError("App-only requires bearer_token.")

        # normalize
        if self.external_account_id:
            self.external_account_id = self.external_account_id.strip()
        if self.external_username:
            self.external_username = self.external_username.strip()    


    @property
    def is_expired(self):
        return bool(self.expires_at and timezone.now() >= self.expires_at)