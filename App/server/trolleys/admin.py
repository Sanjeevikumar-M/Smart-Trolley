from django.contrib import admin
from .models import Trolley


@admin.register(Trolley)
class TrolleyAdmin(admin.ModelAdmin):
    list_display = ['trolley_id', 'is_active', 'is_locked', 'last_seen']
    list_filter = ['is_active', 'is_locked']
    search_fields = ['trolley_id']
    ordering = ['trolley_id']
