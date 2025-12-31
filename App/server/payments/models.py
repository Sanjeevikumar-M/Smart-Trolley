from django.db import models
from decimal import Decimal


class Payment(models.Model):
    """
    Payment model for tracking payment status of shopping sessions.
    Payment is mocked (no real gateway integration).
    """
    PAYMENT_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    ]

    session = models.OneToOneField(
        'trolley_sessions.Session',
        on_delete=models.CASCADE,
        related_name='payment'
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    payment_status = models.CharField(
        max_length=10,
        choices=PAYMENT_STATUS_CHOICES,
        default='PENDING'
    )
    upi_string = models.CharField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'

    def __str__(self):
        return f"Payment for {self.session.session_id} - ₹{self.total_amount} - {self.payment_status}"

    def generate_upi_string(self):
        """Generate a mock UPI payment string."""
        upi_id = "smarttrolley@upi"
        merchant_name = "SmartTrolley"
        self.upi_string = (
            f"upi://pay?pa={upi_id}&pn={merchant_name}"
            f"&am={self.total_amount}&cu=INR"
            f"&tn=Payment_for_session_{self.session.session_id}"
        )
        self.save(update_fields=['upi_string'])
        return self.upi_string

    def mark_success(self):
        """Mark payment as successful."""
        self.payment_status = 'SUCCESS'
        self.save(update_fields=['payment_status', 'updated_at'])

    def mark_failed(self):
        """Mark payment as failed."""
        self.payment_status = 'FAILED'
        self.save(update_fields=['payment_status', 'updated_at'])
