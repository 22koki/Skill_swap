from django.urls import path
from .views import ConversationListView, SwapConversationView

urlpatterns = [
    path("conversations/", ConversationListView.as_view(), name="conversation-list"),
    path("swaps/<int:swap_id>/", SwapConversationView.as_view(), name="swap-conversation"),
]
