from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['session', 'total_amount', 'payment_status', 'created_at']
    list_filter = ['payment_status', 'created_at']
    search_fields = ['session__session_id']
    ordering = ['-created_at']
    raw_id_fields = ['session']
