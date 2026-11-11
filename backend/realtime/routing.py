from django.urls import re_path

from .consumers import ActivityConsumer, DirectChatConsumer, CircleChatConsumer

websocket_urlpatterns = [
    re_path(r"^ws/activity/$", ActivityConsumer.as_asgi()),
    re_path(r"^ws/chat/(?P<swap_id>\d+)/$", DirectChatConsumer.as_asgi()),
    re_path(r"^ws/circles/(?P<circle_id>\d+)/$", CircleChatConsumer.as_asgi()),
]
