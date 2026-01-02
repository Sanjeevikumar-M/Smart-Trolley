
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Product
from .serializers import ProductSerializer
# Create your views here.

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