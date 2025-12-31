from django.urls import path
from .views import PaymentCreateView, PaymentConfirmView, PaymentStatusView

app_name = 'payments'

urlpatterns = [
    path('create', PaymentCreateView.as_view(), name='payment-create'),
    path('confirm', PaymentConfirmView.as_view(), name='payment-confirm'),
    path('status', PaymentStatusView.as_view(), name='payment-status'),
]
