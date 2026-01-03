from django.db import models
from django.contrib.auth.models import User
import hashlib
import json


class Trolley(models.Model):
    """
    Trolley model representing physical shopping trolleys.
    Each trolley has a unique ID (e.g., TROLLEY_01, TROLLEY_02).
    QR code on trolley redirects users to web app with trolley_id.
    """
    trolley_id = models.CharField(max_length=50, unique=True, db_index=True)
    qr_code_data = models.CharField(max_length=255, blank=True, help_text="Data encoded in QR code")
    is_active = models.BooleanField(default=True)
    is_locked = models.BooleanField(default=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_trolleys', help_text="User currently using this trolley")
    assigned_at = models.DateTimeField(null=True, blank=True, help_text="When trolley was assigned to user")
    last_seen = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['trolley_id']
        verbose_name = 'Trolley'
        verbose_name_plural = 'Trolleys'

    def __str__(self):
        status = "Active" if self.is_active else "Inactive"
        lock_status = "Locked" if self.is_locked else "Unlocked"
        return f"{self.trolley_id} - {status} - {lock_status}"

    def save(self, *args, **kwargs):
        """Generate QR code data on save if not already set."""
        if not self.qr_code_data:
            self.qr_code_data = self.generate_qr_data()
        super().save(*args, **kwargs)

    def generate_qr_data(self):
        """
        Generate QR code data for this trolley.
        Format: BASE_URL/trolley/{trolley_id}
        This URL will be scanned and open the web app with trolley context.
        """
        from django.conf import settings
        base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        return f"{base_url}/trolley/{self.trolley_id}"

    def get_qr_payload(self):
        """
        Get a JSON payload that can be used to generate QR code on frontend.
        Includes trolley info and verification hash.
        """
        data = {
            'trolley_id': self.trolley_id,
            'url': self.qr_code_data,
            'timestamp': self.created_at.isoformat() if self.created_at else None
        }
        # Generate a simple hash for verification (optional security measure)
        hash_str = f"{self.trolley_id}:{self.created_at}".encode('utf-8')
        data['hash'] = hashlib.md5(hash_str).hexdigest()[:8]
        return data
