from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['barcode', 'name', 'price', 'category', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['barcode', 'name', 'category']
    ordering = ['name']
