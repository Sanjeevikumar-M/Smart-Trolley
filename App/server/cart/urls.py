from django.urls import path
from .views import CartScanView, CartRemoveView, CartViewView

app_name = 'cart'

urlpatterns = [
    path('scan', CartScanView.as_view(), name='cart-scan'),
    path('remove', CartRemoveView.as_view(), name='cart-remove'),
    path('view', CartViewView.as_view(), name='cart-view'),
]
