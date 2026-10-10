from django.urls import path

from chatbot.views import ChatView

urlpatterns = [
    path('', ChatView.as_view()),
]
