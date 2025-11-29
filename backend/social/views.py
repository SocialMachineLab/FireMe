from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from .models import Platform, UserPlatformApp, UserPlatformConnection
from .serializers import (
    PlatformSerializer, AppUpsertSerializer, ConnectionUpsertSerializer,
    MyConnectionPublicSerializer
)

# Create your views here.
# We are creating class based Viewsets here that will link
# multiple endpoints for a similar resource at one place.
# This makes the boilerplat non repetitve and easy to 
# follow code. 

class PlatformViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = Platform.objects.alive()
    serializer_class = PlatformSerializer
    permission_classes = [IsAuthenticated]

    # Default urls - list / retrieve
    # GET /api/platforms/ -> PlatformViewSet.list
    # GET /api/platforms/{id} -> retrieve

    @action(detail=True, methods=["post"])
    def app(self, request, pk=None):
        '''
        POST /api/platforms/{id}/app
        detail = True means we are working on a specific
        row in the table and the Pk for that row is in the URL
        '''

        platform = self.get_object()
        ser = AppUpsertSerializer(data = request.data, context={"request": request, "platform":platform})
        ser.is_valid(raise_exception=True)
        ser.save()

        return Response({"success": True}, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=["get"])
    def app_info(self, request, pk=None):
        """
        GET /api/platforms/{id}/app_info/
        """
        platform = self.get_object()

        try:
            app = UserPlatformApp.objects.get(user = request.user, platform=platform, is_active=True)
            return Response({"exists": True, "meta": app.meta or {}, "masked": True})
        except UserPlatformApp.DoesNotExist:
            return Response({"exists": False})
        

    @action(detail=True, methods=["post"])
    def connect_credentials(self, request, pk=None):
        """
        POST /api/platforms/{id}/connect_credentials/
        """
        platform = self.get_object()
        print(request.data)
        ser = ConnectionUpsertSerializer(data=request.data, 
                                         context={"request":request, "platform":platform})
        
        ser.is_valid(raise_exception=True)
        obj = ser.save()
        return Response({"success": True, "upc_id": obj.upc_id, "expires_at": obj.expires_at}, status=status.HTTP_201_CREATED)


    @action(detail=True, methods=["post"])
    def disconnect(self, request, pk=None):
        """
        POST /api/platforms/{id}/disconnect/
        """

        platform = self.get_object()

        qs = UserPlatformConnection.all_objects.filter(user=request.user, platform=platform, is_active=True)

        ext_id = request.data.get("external_account_id")
        oauth = request.data.get("oauth_version")

        if ext_id:
            qs = qs.filter(external_account_id = ext_id)

        if oauth:
            qs = qs.filter(oauth_version=oauth)
        
        n = qs.count()
        qs.delete()
        
        return Response({"success": True, "count": n}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["get"])
    def connections(self, request):
        """
        GET /api/platforms/connections/
        """
        qs = UserPlatformConnection.objects.filter(user=request.user)
        data = MyConnectionPublicSerializer(qs, many=True, context={"request": request}).data
        return Response({"results": data})