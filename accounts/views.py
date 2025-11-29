from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

from .serializers import RegisterSerializer, UserSerializer
from django.contrib.auth import get_user_model
# Create your views here.

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    print("I am called in Reg View !")
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


    def create(self, request, *args, **kwargs):
        print("I am called in create !")
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            return Response(
                {
                    "success": True,
                    "message": "User Registered Successfully!",
                    "user": UserSerializer(user).data
                },
                status=status.HTTP_201_CREATED
            )
        
        return Response(
            {
                "success" : False,
                "errors": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    

@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):

    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password = password)

    print(user)

    if user is not None:
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "success": True,
                "message": "Welcome to FireMe !",
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            },
            status=status.HTTP_200_OK,
        )
    
    return Response(
        {
            "success": False,
            "error": "Invalid Credentials Provided!"
        },
        status=status.HTTP_401_UNAUTHORIZED
    )
