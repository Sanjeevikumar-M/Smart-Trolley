import uuid
from django.db import models
from django.utils import timezone
from django.conf import settings
from datetime import timedelta


class Session(models.Model):
    """
    Session model for tracking active shopping sessions.
    Each session is tied to a trolley and has a UUID as primary key.
    Only ONE active session per trolley is allowed.
    Session expires if heartbeat not received for 30 seconds.
    """
    session_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trolley = models.ForeignKey(
        'trolleys.Trolley',
        on_delete=models.CASCADE,
        related_name='sessions'
    )
    is_active = models.BooleanField(default=True)
    last_heartbeat = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Session'
        verbose_name_plural = 'Sessions'

    def __str__(self):
        status = "Active" if self.is_active else "Ended"
        return f"Session {self.session_id} - {self.trolley.trolley_id} - {status}"

    def is_expired(self):
        """Check if session has expired based on heartbeat timeout."""
        timeout = getattr(settings, 'SESSION_HEARTBEAT_TIMEOUT', 30)
        expiry_time = self.last_heartbeat + timedelta(seconds=timeout)
        return timezone.now() > expiry_time

    def update_heartbeat(self):
        """Update the last heartbeat timestamp."""
        self.last_heartbeat = timezone.now()
        self.save(update_fields=['last_heartbeat'])

    def end_session(self):
        """End the session and record the end time."""
        self.is_active = False
        self.ended_at = timezone.now()
        self.save(update_fields=['is_active', 'ended_at'])
