from rest_framework import serializers
from .models import CartItem
from products.serializers import ProductMinimalSerializer


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for CartItem model."""
    product = ProductMinimalSerializer(read_only=True)
    
    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity', 'subtotal', 'added_at']
        read_only_fields = ['id', 'subtotal', 'added_at']


class CartScanSerializer(serializers.Serializer):
    """Serializer for cart scan input (from web frontend)."""
    session_id = serializers.UUIDField()
    barcode = serializers.CharField(max_length=50)


class ESP32ScanSerializer(serializers.Serializer):
    """Serializer for ESP32 device scanning products in trolley."""
    trolley_id = serializers.CharField(max_length=50, help_text="Trolley ID from ESP32 device")
    product_id = serializers.CharField(max_length=50, help_text="Product ID/barcode scanned by ESP32")


class CartRemoveSerializer(serializers.Serializer):
    """Serializer for cart remove input."""
    session_id = serializers.UUIDField()
    barcode = serializers.CharField(max_length=50)


class CartViewSerializer(serializers.Serializer):
    """Serializer for cart view response."""
    session_id = serializers.UUIDField()
    items = CartItemSerializer(many=True)
    total_items = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
