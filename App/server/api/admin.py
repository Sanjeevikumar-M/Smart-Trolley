from django.contrib import admin

from .models import CartItem, Payment, Product, Session, Trolley, User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
	list_display = ('name', 'phone_number', 'email', 'created_at')
	search_fields = ('name', 'phone_number', 'email')


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
	list_display = ('name', 'barcode', 'price', 'category', 'is_active')
	list_filter = ('is_active', 'category')
	search_fields = ('name', 'barcode')


@admin.register(Trolley)
class TrolleyAdmin(admin.ModelAdmin):
	list_display = ('trolley_id', 'is_assigned', 'is_active', 'last_seen')
	list_filter = ('is_assigned', 'is_active')
	search_fields = ('trolley_id',)


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
	list_display = ('session_id', 'trolley', 'user', 'is_active', 'created_at', 'last_activity')
	list_filter = ('is_active',)
	search_fields = ('session_id', 'trolley__trolley_id', 'user__phone_number')


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
	list_display = ('session', 'product', 'quantity', 'subtotal')
	search_fields = ('session__session_id', 'product__name', 'product__barcode')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
	list_display = ('id', 'session', 'user', 'total_amount', 'payment_status', 'created_at')
	list_filter = ('payment_status',)
	search_fields = ('session__session_id', 'user__phone_number')
