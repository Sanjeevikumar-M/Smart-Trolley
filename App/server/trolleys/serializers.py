from rest_framework import serializers
from .models import Trolley


class TrolleySerializer(serializers.ModelSerializer):
    """Serializer for Trolley model."""
    
    class Meta:
        model = Trolley
        fields = ['id', 'trolley_id', 'is_active', 'is_locked', 'last_seen']
        read_only_fields = ['id', 'last_seen']


class TrolleyStatusSerializer(serializers.ModelSerializer):
    """Minimal serializer for Trolley status."""
    
    class Meta:
        model = Trolley
        fields = ['trolley_id', 'is_locked']
