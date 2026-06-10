from django.urls import path
from .views import ChatAssistantView

urlpatterns = [
    path('', ChatAssistantView.as_view(), name='chat'),
]
