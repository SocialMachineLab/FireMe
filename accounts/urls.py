from django.urls import path
from .views import RegisterView,login_view
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),   # POST
    path("login/", login_view, name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/verify", TokenVerifyView.as_view(), name="token_verify")
]