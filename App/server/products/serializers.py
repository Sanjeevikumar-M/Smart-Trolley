from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model."""
    
    class Meta:
        model = Product
        fields = ['id', 'barcode', 'name', 'price', 'category', 'is_active']
        read_only_fields = ['id']


class ProductMinimalSerializer(serializers.ModelSerializer):
    """Minimal serializer for Product (used in cart responses)."""
    
    class Meta:
        model = Product
        fields = ['barcode', 'name', 'price', 'category']
