from django.db import models
from decimal import Decimal


class CartItem(models.Model):
    """
    CartItem model representing items in a shopping cart.
    Each cart item is tied to a session and a product.
    """
    session = models.ForeignKey(
        'trolley_sessions.Session',
        on_delete=models.CASCADE,
        related_name='cart_items'
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='cart_items'
    )
    quantity = models.PositiveIntegerField(default=1)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-added_at']
        verbose_name = 'Cart Item'
        verbose_name_plural = 'Cart Items'
        unique_together = ['session', 'product']

    def __str__(self):
        return f"{self.product.name} x {self.quantity} - ₹{self.subtotal}"

    def save(self, *args, **kwargs):
        """Calculate subtotal before saving."""
        self.subtotal = self.product.price * self.quantity
        super().save(*args, **kwargs)

    def update_quantity(self, quantity_change):
        """Update quantity and recalculate subtotal."""
        self.quantity += quantity_change
        if self.quantity <= 0:
            self.delete()
            return None
        self.save()
        return self
