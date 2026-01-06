import uuid

from rest_framework import serializers

from .models import CartItem, Payment, Product, Session, Trolley, User


class UserSignupSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'name', 'phone_number', 'email']
        read_only_fields = ['user_id']


class SessionStartSerializer(serializers.Serializer):
    trolley_id = serializers.CharField(max_length=50)
    user_id = serializers.UUIDField(required=False)

    def validate_user_id(self, value):
        if not User.objects.filter(user_id=value).exists():
            raise serializers.ValidationError('User not found')
        return value


class SessionIdSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()


class CartScanSerializer(SessionIdSerializer):
    barcode = serializers.CharField(max_length=64)


class CartScanTrolleySerializer(serializers.Serializer):
    """Serializer for ESP32 product scans using trolley_id instead of session_id"""
    trolley_id = serializers.CharField(max_length=50)
    barcode = serializers.CharField(max_length=64)


class CartRemoveSerializer(SessionIdSerializer):
    barcode = serializers.CharField(max_length=64)


class PaymentCreateSerializer(SessionIdSerializer):
    pass


class PaymentConfirmSerializer(SessionIdSerializer):
    pass


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['barcode', 'name', 'price', 'category', 'is_active']


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer()

    class Meta:
        model = CartItem
        fields = ['product', 'quantity', 'subtotal']


class CartViewSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()

    def validate_session_id(self, value):
        if not Session.objects.filter(session_id=value).exists():
            raise serializers.ValidationError('Session not found')
        return value


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['session', 'user', 'total_amount', 'payment_status', 'created_at']
        read_only_fields = fields


class TrolleySerializer(serializers.ModelSerializer):
    class Meta:
        model = Trolley
        fields = ['trolley_id', 'is_assigned', 'is_active', 'last_seen']
        read_only_fields = fields
