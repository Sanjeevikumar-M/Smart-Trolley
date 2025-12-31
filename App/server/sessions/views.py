from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from .models import Session
from .serializers import (
    SessionStartSerializer,
    SessionIdSerializer,
    SessionResponseSerializer
)
from trolleys.models import Trolley
from cart.models import CartItem


def validate_session(session_id):
    """
    Validate a session by ID.
    Returns (session, error_response) tuple.
    If session is valid, error_response is None.
    If session is invalid, session is None and error_response contains the error.
    """
    try:
        session = Session.objects.get(session_id=session_id)
    except Session.DoesNotExist:
        return None, Response(
            {'error': 'Session not found', 'session_id': str(session_id)},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if not session.is_active:
        return None, Response(
            {'error': 'Session is no longer active', 'session_id': str(session_id)},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if session.is_expired():
        # Auto-expire the session
        session.end_session()
        # Clear cart items
        CartItem.objects.filter(session=session).delete()
        return None, Response(
            {'error': 'Session has expired due to inactivity', 'session_id': str(session_id)},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    return session, None


class SessionStartView(APIView):
    """
    POST /api/session/start
    Start a new shopping session for a trolley.
    Only one active session per trolley is allowed.
    """
    
    def post(self, request):
        serializer = SessionStartSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        trolley_id = serializer.validated_data['trolley_id']
        
        # Check if trolley exists
        try:
            trolley = Trolley.objects.get(trolley_id=trolley_id)
        except Trolley.DoesNotExist:
            return Response(
                {'error': f'Trolley {trolley_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if trolley is active
        if not trolley.is_active:
            return Response(
                {'error': f'Trolley {trolley_id} is not active'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for existing active sessions (expire old sessions first)
        active_sessions = Session.objects.filter(trolley=trolley, is_active=True)
        for existing_session in active_sessions:
            if existing_session.is_expired():
                existing_session.end_session()
                CartItem.objects.filter(session=existing_session).delete()
            else:
                return Response(
                    {
                        'error': f'Trolley {trolley_id} already has an active session',
                        'existing_session_id': str(existing_session.session_id)
                    },
                    status=status.HTTP_409_CONFLICT
                )
        
        # Create new session
        session = Session.objects.create(trolley=trolley)
        
        # Unlock the trolley
        trolley.is_locked = False
        trolley.save(update_fields=['is_locked', 'last_seen'])
        
        response_data = {
            'session_id': str(session.session_id),
            'trolley_id': trolley.trolley_id,
            'message': 'Session started successfully'
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)


class SessionHeartbeatView(APIView):
    """
    POST /api/session/heartbeat
    Update the heartbeat for an active session.
    """
    
    def post(self, request):
        serializer = SessionIdSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        session_id = serializer.validated_data['session_id']
        session, error_response = validate_session(session_id)
        
        if error_response:
            return error_response
        
        # Update heartbeat
        session.update_heartbeat()
        
        # Update trolley last_seen
        session.trolley.last_seen = timezone.now()
        session.trolley.save(update_fields=['last_seen'])
        
        return Response({
            'session_id': str(session.session_id),
            'last_heartbeat': session.last_heartbeat.isoformat(),
            'message': 'Heartbeat updated successfully'
        })


class SessionEndView(APIView):
    """
    POST /api/session/end
    End a shopping session and clear the cart.
    """
    
    def post(self, request):
        serializer = SessionIdSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        session_id = serializer.validated_data['session_id']
        
        try:
            session = Session.objects.get(session_id=session_id)
        except Session.DoesNotExist:
            return Response(
                {'error': 'Session not found', 'session_id': str(session_id)},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not session.is_active:
            return Response(
                {'error': 'Session is already ended', 'session_id': str(session_id)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Clear cart items
        cart_items_count = CartItem.objects.filter(session=session).count()
        CartItem.objects.filter(session=session).delete()
        
        # End the session
        session.end_session()
        
        # Lock the trolley
        trolley = session.trolley
        trolley.is_locked = True
        trolley.save(update_fields=['is_locked', 'last_seen'])
        
        return Response({
            'session_id': str(session.session_id),
            'trolley_id': trolley.trolley_id,
            'items_cleared': cart_items_count,
            'message': 'Session ended successfully'
        })

