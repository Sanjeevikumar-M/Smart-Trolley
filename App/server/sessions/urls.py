from django.urls import path
from .views import SessionStartView, SessionHeartbeatView, SessionEndView

app_name = 'sessions'

urlpatterns = [
    path('start', SessionStartView.as_view(), name='session-start'),
    path('heartbeat', SessionHeartbeatView.as_view(), name='session-heartbeat'),
    path('end', SessionEndView.as_view(), name='session-end'),
]
