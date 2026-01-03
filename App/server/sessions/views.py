from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from .models import Session
from .serializers import (
    SessionStartSerializer,
    SessionIdSerializer,
    SessionResponseSerializer,
    QRScanResponseSerializer
)
from trolleys.models import Trolley
from trolleys.serializers import TrolleyQRSerializer
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
    Unassigns trolley from user (assigned_to = None) after payment.
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
        
        # Lock the trolley and unassign from user
        trolley = session.trolley
        trolley.is_locked = True
        trolley.assigned_to = None
        trolley.assigned_at = None
        trolley.save(update_fields=['is_locked', 'last_seen', 'assigned_to', 'assigned_at'])
        
        response_data = {
            'session_id': str(session.session_id),
            'trolley_id': trolley.trolley_id,
            'items_cleared': cart_items_count,
            'trolley_unassigned': True,
            'message': 'Session ended successfully and trolley unassigned'
        }
        
        return Response(response_data)


class SessionQRScanView(APIView):
    """
    POST /api/session/qr-scan
    Handle QR code scan from user device.
    Creates a new session or returns existing active session for the trolley.
    This is the entry point when user scans trolley QR code.
    Prevents usage if trolley is already assigned to another user.
    """
    
    def post(self, request):
        serializer = TrolleyQRSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        trolley_id = serializer.validated_data['trolley_id']
        user_id = request.query_params.get('user_id') or request.data.get('user_id')
        
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
                {'error': f'Trolley {trolley_id} is not available for use'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if trolley is already assigned to another user
        if trolley.assigned_to is not None:
            # Trolley is assigned to someone else
            if user_id and str(trolley.assigned_to.id) == str(user_id):
                # Same user can continue their session
                pass
            else:
                # Different user or no user trying to access an assigned trolley
                return Response(
                    {
                        'error': 'Trolley is already in use',
                        'message': f'This trolley is currently assigned to another user ({trolley.assigned_to.username}). Please use a different trolley or wait until the current session is completed.',
                        'trolley_id': trolley_id,
                        'assigned_to': trolley.assigned_to.username,
                        'assigned_at': trolley.assigned_at.isoformat() if trolley.assigned_at else None
                    },
                    status=status.HTTP_409_CONFLICT
                )
        
        # Check for existing active session
        existing_session = Session.objects.filter(
            trolley=trolley, 
            is_active=True
        ).first()
        
        is_new_session = False
        
        if existing_session:
            # Check if expired
            if existing_session.is_expired():
                # Clear old cart and end session
                CartItem.objects.filter(session=existing_session).delete()
                existing_session.end_session()
                # Unassign the trolley from previous user
                trolley.assigned_to = None
                trolley.assigned_at = None
                # Create new session
                session = Session.objects.create(trolley=trolley)
                is_new_session = True
            else:
                # Return existing active session
                session = existing_session
                # Update heartbeat
                session.update_heartbeat()
        else:
            # Create new session
            session = Session.objects.create(trolley=trolley)
            is_new_session = True
        
        # Assign trolley to user if user_id provided
        if user_id and is_new_session:
            from django.contrib.auth.models import User
            try:
                user = User.objects.get(id=user_id)
                trolley.assigned_to = user
                trolley.assigned_at = timezone.now()
                session.user = user
                session.save()
            except User.DoesNotExist:
                pass  # User ID not found, continue without assignment
        
        # Unlock the trolley
        if trolley.is_locked:
            trolley.is_locked = False
            trolley.save(update_fields=['is_locked', 'last_seen', 'assigned_to', 'assigned_at'])
        else:
            trolley.save(update_fields=['last_seen', 'assigned_to', 'assigned_at'])
        
        # Get cart items count
        cart_items_count = CartItem.objects.filter(session=session).count()
        
        response_data = {
            'session_id': str(session.session_id),
            'trolley_id': trolley.trolley_id,
            'trolley_locked': trolley.is_locked,
            'is_new_session': is_new_session,
            'is_assigned': trolley.assigned_to is not None,
            'assigned_to': trolley.assigned_to.username if trolley.assigned_to else None,
            'assigned_at': trolley.assigned_at.isoformat() if trolley.assigned_at else None,
            'cart_items_count': cart_items_count,
            'message': 'Session started successfully' if is_new_session else 'Continuing existing session'
        }
        
        return Response(
            response_data, 
            status=status.HTTP_201_CREATED if is_new_session else status.HTTP_200_OK
        )

