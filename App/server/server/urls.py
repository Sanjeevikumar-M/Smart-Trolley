"""
URL configuration for server project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.views import APIView
from rest_framework.response import Response


class HealthCheckView(APIView):
    """API health check endpoint."""
    def get(self, request):
        return Response({
            'status': 'healthy',
            'service': 'Smart Trolley API',
            'version': '1.0.0'
        })


class APIRootView(APIView):
    """API root endpoint with available endpoints."""
    def get(self, request):
        return Response({
            'service': 'Smart Trolley API',
            'version': '1.0.0',
            'endpoints': {
                'health': '/api/health',
                'session': {
                    'start': 'POST /api/session/start',
                    'heartbeat': 'POST /api/session/heartbeat',
                    'end': 'POST /api/session/end',
                },
                'cart': {
                    'scan': 'POST /api/cart/scan',
                    'remove': 'POST /api/cart/remove',
                    'view': 'GET /api/cart/view?session_id=<uuid>',
                },
                'payment': {
                    'create': 'POST /api/payment/create',
                    'confirm': 'POST /api/payment/confirm',
                    'status': 'GET /api/payment/status?session_id=<uuid>',
                },
                'products': {
                    'list': 'GET /api/products/',
                    'detail': 'GET /api/products/<barcode>',
                },
                'trolleys': {
                    'list': 'GET /api/trolleys/',
                    'detail': 'GET /api/trolleys/<trolley_id>',
                },
            }
        })


urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Root
    path('api/', APIRootView.as_view(), name='api-root'),
    path('api/health', HealthCheckView.as_view(), name='health-check'),
    
    # Session APIs
    path('api/session/', include('sessions.urls')),
    
    # Cart APIs
    path('api/cart/', include('cart.urls')),
    
    # Payment APIs
    path('api/payment/', include('payments.urls')),
    
    # Product APIs (for management/lookup)
    path('api/products/', include('products.urls')),
    
    # Trolley APIs (for management/lookup)
    path('api/trolleys/', include('trolleys.urls')),
]
