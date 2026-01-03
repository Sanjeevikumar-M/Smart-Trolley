from django.urls import path
from . import views

urlpatterns = [
    path('user/signup', views.UserSignupView.as_view(), name='user-signup'),
    path('session/start', views.SessionStartView.as_view(), name='session-start'),
    path('session/heartbeat', views.SessionHeartbeatView.as_view(), name='session-heartbeat'),
    path('session/end', views.SessionEndView.as_view(), name='session-end'),
    path('cart/scan', views.CartScanView.as_view(), name='cart-scan'),
    path('cart/remove', views.CartRemoveView.as_view(), name='cart-remove'),
    path('cart/view', views.CartView.as_view(), name='cart-view'),
    path('payment/create', views.PaymentCreateView.as_view(), name='payment-create'),
    path('payment/confirm', views.PaymentConfirmView.as_view(), name='payment-confirm'),
]
