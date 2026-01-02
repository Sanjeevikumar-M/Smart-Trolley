from rest_framework import serializers
from .models import Session
from trolleys.serializers import TrolleyStatusSerializer


class SessionSerializer(serializers.ModelSerializer):
    """Serializer for Session model."""
    trolley = TrolleyStatusSerializer(read_only=True)
    
    class Meta:
        model = Session
        fields = ['session_id', 'trolley', 'is_active', 'last_heartbeat', 'created_at', 'ended_at']
        read_only_fields = ['session_id', 'created_at', 'ended_at']


class SessionStartSerializer(serializers.Serializer):
    """Serializer for starting a new session."""
    trolley_id = serializers.CharField(max_length=50)


class SessionIdSerializer(serializers.Serializer):
    """Serializer for session_id input."""
    session_id = serializers.UUIDField()


class SessionResponseSerializer(serializers.Serializer):
    """Serializer for session start response."""
    session_id = serializers.UUIDField()
    trolley_id = serializers.CharField()
    message = serializers.CharField()


class QRScanResponseSerializer(serializers.Serializer):
    """Serializer for QR code scan response to frontend."""
    session_id = serializers.UUIDField()
    trolley_id = serializers.CharField()
    trolley_locked = serializers.BooleanField()
    is_new_session = serializers.BooleanField()
    message = serializers.CharField()
    cart_items_count = serializers.IntegerField()
