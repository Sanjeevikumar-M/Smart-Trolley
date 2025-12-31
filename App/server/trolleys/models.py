from django.db import models


class Trolley(models.Model):
    """
    Trolley model representing physical shopping trolleys.
    Each trolley has a unique ID (e.g., TROLLEY_01, TROLLEY_02).
    """
    trolley_id = models.CharField(max_length=50, unique=True, db_index=True)
    is_active = models.BooleanField(default=True)
    is_locked = models.BooleanField(default=True)
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
