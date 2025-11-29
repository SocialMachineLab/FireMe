from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsOwnerOrReadOnly(BasePermission):
    """
    Allow owners full access; others read-only.
    """
    
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return obj.user_id == request.user.id
        return getattr(obj, "user_id", None) == request.user.id
