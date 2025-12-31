from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model."""
    session_id = serializers.UUIDField(source='session.session_id', read_only=True)
    
    class Meta:
        model = Payment
        fields = ['id', 'session_id', 'total_amount', 'payment_status', 'upi_string', 'created_at']
        read_only_fields = ['id', 'created_at']


class PaymentCreateSerializer(serializers.Serializer):
    """Serializer for payment create input."""
    session_id = serializers.UUIDField()


class PaymentResponseSerializer(serializers.Serializer):
    """Serializer for payment create response."""
    session_id = serializers.UUIDField()
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    upi_string = serializers.CharField()
    payment_status = serializers.CharField()
    message = serializers.CharField()


class PaymentConfirmSerializer(serializers.Serializer):
    """Serializer for payment confirm input."""
    session_id = serializers.UUIDField()


class PaymentConfirmResponseSerializer(serializers.Serializer):
    """Serializer for payment confirm response."""
    session_id = serializers.UUIDField()
    payment_status = serializers.CharField()
    trolley_unlocked = serializers.BooleanField()
    message = serializers.CharField()
