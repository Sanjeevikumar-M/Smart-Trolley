from django.contrib import admin
from .models import Session


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'trolley', 'is_active', 'last_heartbeat', 'created_at', 'ended_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['session_id', 'trolley__trolley_id']
    ordering = ['-created_at']
    raw_id_fields = ['trolley']
