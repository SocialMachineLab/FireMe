from django.contrib import admin
from .models import Platform, UserPlatformApp, UserPlatformConnection

@admin.register(Platform)
class PlatformAdmin(admin.ModelAdmin):
    # Columns visible in the list view (safe, non-secret)
    list_display = ("plt_id", "name", "is_active")
    # Enable search by name
    search_fields = ("name",)

@admin.register(UserPlatformApp)
class UserPlatformAppAdmin(admin.ModelAdmin):
    list_display = ("upa_id", "user", "platform", "is_active", "created_at")
    list_filter = ("platform", "is_active")
    search_fields = ("user__username", "platform__name")
    # We intentionally DO NOT add client_id/secret to list_display to avoid exposure

@admin.register(UserPlatformConnection)
class UserPlatformConnectionAdmin(admin.ModelAdmin):
    list_display = (
        "upc_id", "user", "platform", "external_account_id",
        "external_username", "oauth_version", "is_active", "created_at"
    )
    list_filter = ("platform", "oauth_version", "is_active")
    search_fields = ("user__username", "external_account_id", "external_username")
    # Again: never show token fields in admin lists for safety
