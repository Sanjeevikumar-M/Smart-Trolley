from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError

from .models import CartItem, Session


def expire_session(session: Session) -> None:
    if not session.is_active:
        return
    session.is_active = False
    session.last_activity = timezone.now()
    session.save(update_fields=['is_active', 'last_activity'])
    CartItem.objects.filter(session=session).delete()
    trolley = session.trolley
    trolley.is_assigned = False
    trolley.last_seen = timezone.now()
    trolley.save(update_fields=['is_assigned', 'last_seen'])


def enforce_session_timeout(session: Session, timeout_seconds: int) -> None:
    now = timezone.now()
    if not session.is_active:
        raise ValidationError('Session is inactive')
    if (now - session.last_activity).total_seconds() > timeout_seconds:
        expire_session(session)
        raise ValidationError('Session expired')


def get_locked_session(session_id, timeout_seconds: int) -> Session:
    with transaction.atomic():
        try:
            session = (
                Session.objects.select_for_update()
                .select_related('trolley', 'user')
                .get(session_id=session_id)
            )
        except Session.DoesNotExist as exc:
            raise NotFound('Session not found') from exc
        enforce_session_timeout(session, timeout_seconds)
        return session


def get_locked_session_by_trolley(trolley_id: str, timeout_seconds: int) -> Session:
    """Get active session for a trolley (used by ESP32 product scans)"""
    with transaction.atomic():
        try:
            session = (
                Session.objects.select_for_update()
                .select_related('trolley', 'user')
                .filter(trolley__trolley_id=trolley_id, is_active=True)
                .order_by('-created_at')
                .first()
            )
        except Session.DoesNotExist as exc:
            raise NotFound('No active session for this trolley') from exc
        
        if not session:
            raise NotFound('No active session for this trolley')
        
        enforce_session_timeout(session, timeout_seconds)
        return session


def calculate_cart_total(session: Session) -> Decimal:
    total = Decimal('0.00')
    for item in session.cart_items.select_related('product'):
        total += item.subtotal
    return total.quantize(Decimal('0.01'))


def refresh_activity(session: Session) -> None:
    session.last_activity = timezone.now()
    session.save(update_fields=['last_activity'])
    trolley = session.trolley
    trolley.last_seen = session.last_activity
    trolley.save(update_fields=['last_seen'])
