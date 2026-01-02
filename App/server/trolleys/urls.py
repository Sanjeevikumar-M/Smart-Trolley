from django.urls import path
from .views import TrolleyListView, TrolleyDetailView, TrolleyQRCodeView

app_name = 'trolleys'

urlpatterns = [
    path('', TrolleyListView.as_view(), name='trolley-list'),
    path('<str:trolley_id>', TrolleyDetailView.as_view(), name='trolley-detail'),
    path('<str:trolley_id>/qr', TrolleyQRCodeView.as_view(), name='trolley-qr'),
]
