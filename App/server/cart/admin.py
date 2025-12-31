from django.contrib import admin
from .models import CartItem


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['session', 'product', 'quantity', 'subtotal', 'added_at']
    list_filter = ['added_at']
    search_fields = ['session__session_id', 'product__name', 'product__barcode']
    ordering = ['-added_at']
    raw_id_fields = ['session', 'product']
