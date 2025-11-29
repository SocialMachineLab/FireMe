# social/services.py
from .models import UserPlatformConnection

def pick_connection(user, platform, need: str, *, scope_requires: str | None = None):
    """
    need: "oauth1a" | "oauth2" | "app"
    scope_requires: optional substring to check in scope
    """
    qs = UserPlatformConnection.objects.filter(
        user=user, platform=platform, oauth_version=need, is_active=True
    ).order_by("-modified_at")  # prefer latest updated

    if scope_requires:
        qs = qs.filter(scope__icontains=scope_requires)

    return qs.first()  # or raise if not found
