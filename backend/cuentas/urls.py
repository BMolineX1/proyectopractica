from django.urls import path
from .views import *
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', UsuarioRegisterAPIView.as_view(), name='register-user'),
    path('login/', UsuarioLoginAPIView.as_view(), name='login-user'),
    path('logout/', UsuarioLogoutAPIView.as_view(), name='profile-user'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user/', UserInfoAPIView.as_view(), name='user-info'),  # Nueva ruta para obtener información del usuario
]