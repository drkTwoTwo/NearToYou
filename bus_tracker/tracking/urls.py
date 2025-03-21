from django.urls import path
from .views import create_driver, login_view

urlpatterns = [
    path('register/', create_driver, name='create_driver'),
    path('login/', login_view, name='login'),
]
