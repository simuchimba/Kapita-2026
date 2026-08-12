from django.urls import path
from .views import VoiceParseView

urlpatterns = [
    path('parse/', VoiceParseView.as_view(), name='voice-parse'),
]
