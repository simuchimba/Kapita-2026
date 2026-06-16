from django.urls import path
from .views import ChatAssistantView, ChatAssistantStreamView, TextToSpeechView, SpeechToTextView

urlpatterns = [
    path('', ChatAssistantView.as_view(), name='chat'),
    path('stream/', ChatAssistantStreamView.as_view(), name='chat-stream'),
    path('tts/', TextToSpeechView.as_view(), name='chat-tts'),
    path('stt/', SpeechToTextView.as_view(), name='chat-stt'),
]
