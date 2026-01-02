from django.urls import path
from .views import CartScanView, CartRemoveView, CartViewView, ESP32ScanView

app_name = 'cart'

urlpatterns = [
    path('scan', CartScanView.as_view(), name='cart-scan'),
    path('esp32-scan', ESP32ScanView.as_view(), name='esp32-scan'),
    path('remove', CartRemoveView.as_view(), name='cart-remove'),
    path('view', CartViewView.as_view(), name='cart-view'),
]
