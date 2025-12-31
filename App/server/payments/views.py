from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum
from decimal import Decimal

from .models import Payment
from .serializers import (
    PaymentCreateSerializer,
    PaymentConfirmSerializer
)
from cart.models import CartItem
from sessions.views import validate_session


class PaymentCreateView(APIView):
    """
    POST /api/payment/create
    Create a payment for the session.
    Calculate total from cart and return mock UPI QR string.
    """
    
    def post(self, request):
        serializer = PaymentCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        session_id = serializer.validated_data['session_id']
        
        # Validate session
        session, error_response = validate_session(session_id)
        if error_response:
            return error_response
        
        # Check if cart is empty
        cart_items = CartItem.objects.filter(session=session)
        if not cart_items.exists():
            return Response(
                {'error': 'Cart is empty. Add items before creating payment.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate total amount
        total_amount = cart_items.aggregate(total=Sum('subtotal'))['total'] or Decimal('0.00')
        
        # Check if payment already exists
        payment, created = Payment.objects.get_or_create(
            session=session,
            defaults={'total_amount': total_amount}
        )
        
        if not created:
            # Update existing payment
            if payment.payment_status == 'SUCCESS':
                return Response(
                    {'error': 'Payment already completed for this session'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            payment.total_amount = total_amount
            payment.payment_status = 'PENDING'
            payment.save()
        
        # Generate UPI string
        upi_string = payment.generate_upi_string()
        
        return Response({
            'session_id': str(session.session_id),
            'total_amount': str(payment.total_amount),
            'upi_string': upi_string,
            'payment_status': payment.payment_status,
            'message': 'Payment created. Scan QR code to pay.'
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class PaymentConfirmView(APIView):
    """
    POST /api/payment/confirm
    Confirm payment (mock).
    Mark payment as SUCCESS, unlock trolley, and close session.
    """
    
    def post(self, request):
        serializer = PaymentConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        session_id = serializer.validated_data['session_id']
        
        # Validate session
        session, error_response = validate_session(session_id)
        if error_response:
            return error_response
        
        # Check if payment exists
        try:
            payment = Payment.objects.get(session=session)
        except Payment.DoesNotExist:
            return Response(
                {'error': 'No payment found for this session. Create payment first.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if already paid
        if payment.payment_status == 'SUCCESS':
            return Response(
                {'error': 'Payment already confirmed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mark payment as success (mock payment confirmation)
        payment.mark_success()
        
        # Unlock trolley
        trolley = session.trolley
        trolley.is_locked = False
        trolley.save(update_fields=['is_locked', 'last_seen'])
        
        # Clear cart items
        CartItem.objects.filter(session=session).delete()
        
        # End session
        session.end_session()
        
        # Lock trolley after session ends (ready for next customer)
        trolley.is_locked = True
        trolley.save(update_fields=['is_locked'])
        
        return Response({
            'session_id': str(session.session_id),
            'payment_status': 'SUCCESS',
            'total_paid': str(payment.total_amount),
            'trolley_unlocked': True,
            'session_ended': True,
            'message': 'Payment successful! Thank you for shopping.'
        })


class PaymentStatusView(APIView):
    """
    GET /api/payment/status
    Get the current payment status for a session.
    """
    
    def get(self, request):
        session_id = request.query_params.get('session_id')
        
        if not session_id:
            return Response(
                {'error': 'session_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Try to find session (don't validate since we want status even for ended sessions)
        from sessions.models import Session
        try:
            session = Session.objects.get(session_id=session_id)
        except Session.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if payment exists
        try:
            payment = Payment.objects.get(session=session)
            return Response({
                'session_id': str(session.session_id),
                'payment_status': payment.payment_status,
                'total_amount': str(payment.total_amount),
                'session_active': session.is_active,
                'created_at': payment.created_at.isoformat()
            })
        except Payment.DoesNotExist:
            return Response({
                'session_id': str(session.session_id),
                'payment_status': 'NOT_CREATED',
                'session_active': session.is_active,
                'message': 'No payment created for this session'
            })

