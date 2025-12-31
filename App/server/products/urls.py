from django.urls import path
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Product
from .serializers import ProductSerializer

app_name = 'products'


class ProductListView(APIView):
    """List all active products."""
    def get(self, request):
        products = Product.objects.filter(is_active=True)
        serializer = ProductSerializer(products, many=True)
        return Response({
            'count': products.count(),
            'products': serializer.data
        })


class ProductDetailView(APIView):
    """Get a single product by barcode."""
    def get(self, request, barcode):
        try:
            product = Product.objects.get(barcode=barcode)
            serializer = ProductSerializer(product)
            return Response(serializer.data)
        except Product.DoesNotExist:
            return Response(
                {'error': f'Product with barcode {barcode} not found'},
                status=404
            )


urlpatterns = [
    path('', ProductListView.as_view(), name='product-list'),
    path('<str:barcode>', ProductDetailView.as_view(), name='product-detail'),
]
