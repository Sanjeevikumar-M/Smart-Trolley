from rest_framework import serializers
from .models import Trolley


class TrolleySerializer(serializers.ModelSerializer):
    """Serializer for Trolley model."""
    qr_payload = serializers.SerializerMethodField()
    
    class Meta:
        model = Trolley
        fields = ['id', 'trolley_id', 'qr_code_data', 'qr_payload', 'is_active', 'is_locked', 'last_seen', 'created_at']
        read_only_fields = ['id', 'qr_code_data', 'qr_payload', 'last_seen', 'created_at']

    def get_qr_payload(self, obj):
        """Get QR code payload for frontend rendering."""
        return obj.get_qr_payload()


class TrolleyStatusSerializer(serializers.ModelSerializer):
    """Minimal serializer for Trolley status."""
    
    class Meta:
        model = Trolley
        fields = ['trolley_id', 'is_locked']


class TrolleyQRSerializer(serializers.Serializer):
    """Serializer for QR code scan input from user."""
    trolley_id = serializers.CharField(max_length=50)
