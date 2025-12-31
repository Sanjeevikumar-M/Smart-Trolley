from django.db import models


class Product(models.Model):
    """
    Product model representing items available in the store.
    Each product has a unique barcode for scanning.
    """
    barcode = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Product'
        verbose_name_plural = 'Products'

    def __str__(self):
        return f"{self.name} ({self.barcode}) - ₹{self.price}"
