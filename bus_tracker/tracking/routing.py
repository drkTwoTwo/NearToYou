from django.urls import path
from .consumers import BusLocationConsumer

websocket_urlpatterns = [
    path('ws/bus/', BusLocationConsumer.as_asgi()),
]

