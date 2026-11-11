from django.urls import path

from messaging.consumers import ChatConsumer
from notifications.consumers import ActivityConsumer
from circles.consumers import CircleChatConsumer

websocket_urlpatterns = [
    path("ws/activity/", ActivityConsumer.as_asgi()),
    path("ws/chat/<int:swap_id>/", ChatConsumer.as_asgi()),
    path("ws/circles/<int:circle_id>/", CircleChatConsumer.as_asgi()),
]
