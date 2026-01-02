from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum
from decimal import Decimal

from .models import CartItem
from .serializers import (
    CartScanSerializer,
    CartRemoveSerializer,
    CartItemSerializer,
    ESP32ScanSerializer
)
from products.models import Product
from sessions.models import Session
from sessions.views import validate_session
from trolleys.models import Trolley


class CartScanView(APIView):  
    """
    POST /api/cart/scan
    Scan a product barcode to add it to the cart.
    If product already exists in cart, increment quantity.
    """
    
    def post(self, request):
        serializer = CartScanSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        session_id = serializer.validated_data['session_id']
        barcode = serializer.validated_data['barcode']
        
        # Validate session
        session, error_response = validate_session(session_id)
        if error_response:
            return error_response
        
        # Find product by barcode
        try:
            product = Product.objects.get(barcode=barcode, is_active=True)
        except Product.DoesNotExist:
            return Response(
                {'error': f'Product with barcode {barcode} not found or inactive'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if item already in cart
        cart_item, created = CartItem.objects.get_or_create(
            session=session,
            product=product,
            defaults={'quantity': 1}
        )
        
        if not created:
            # Item already exists, increment quantity
            cart_item.quantity += 1
            cart_item.save()
        
        return Response({
            'session_id': str(session.session_id),
            'product': {
                'barcode': product.barcode,
                'name': product.name,
                'price': str(product.price),
                'category': product.category
            },
            'quantity': cart_item.quantity,
            'subtotal': str(cart_item.subtotal),
            'action': 'added' if created else 'quantity_updated',
            'message': f'{product.name} {"added to" if created else "updated in"} cart'
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class CartRemoveView(APIView):
    """
    POST /api/cart/remove
    Remove a product from the cart or decrement quantity.
    """
    
    def post(self, request):
        serializer = CartRemoveSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        session_id = serializer.validated_data['session_id']
        barcode = serializer.validated_data['barcode']
        
        # Validate session
        session, error_response = validate_session(session_id)
        if error_response:
            return error_response
        
        # Find product by barcode
        try:
            product = Product.objects.get(barcode=barcode)
        except Product.DoesNotExist:
            return Response(
                {'error': f'Product with barcode {barcode} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Find cart item
        try:
            cart_item = CartItem.objects.get(session=session, product=product)
        except CartItem.DoesNotExist:
            return Response(
                {'error': f'Product {product.name} not in cart'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        product_name = product.name
        
        if cart_item.quantity > 1:
            # Decrement quantity
            cart_item.quantity -= 1
            cart_item.save()
            return Response({
                'session_id': str(session.session_id),
                'product': {
                    'barcode': product.barcode,
                    'name': product.name,
                    'price': str(product.price)
                },
                'quantity': cart_item.quantity,
                'subtotal': str(cart_item.subtotal),
                'action': 'quantity_decremented',
                'message': f'{product_name} quantity decremented'
            })
        else:
            # Remove item completely
            cart_item.delete()
            return Response({
                'session_id': str(session.session_id),
                'product': {
                    'barcode': product.barcode,
                    'name': product.name
                },
                'action': 'removed',
                'message': f'{product_name} removed from cart'
            })


class CartViewView(APIView):
    """
    GET /api/cart/view
    View all items in the cart for a session.
    """
    
    def get(self, request):
        session_id = request.query_params.get('session_id')
        
        if not session_id:
            return Response(
                {'error': 'session_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate session
        session, error_response = validate_session(session_id)
        if error_response:
            return error_response
        
        # Get cart items
        cart_items = CartItem.objects.filter(session=session).select_related('product')
        
        # Calculate totals
        total_items = cart_items.aggregate(total=Sum('quantity'))['total'] or 0
        total_amount = cart_items.aggregate(total=Sum('subtotal'))['total'] or Decimal('0.00')
        
        # Serialize cart items
        items_serializer = CartItemSerializer(cart_items, many=True)
        
        return Response({
            'session_id': str(session.session_id),
            'trolley_id': session.trolley.trolley_id,
            'items': items_serializer.data,
            'total_items': total_items,
            'total_amount': str(total_amount)
        })


class ESP32ScanView(APIView):
    """
    POST /api/cart/esp32-scan
    Handle product scan from ESP32 device in the trolley.
    ESP32 sends trolley_id and product_id (barcode).
    Backend resolves the active session and adds product to cart.
    """
    
    def post(self, request):
        serializer = ESP32ScanSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        trolley_id = serializer.validated_data['trolley_id']
        product_id = serializer.validated_data['product_id']
        
        # Find trolley
        try:
            trolley = Trolley.objects.get(trolley_id=trolley_id)
        except Trolley.DoesNotExist:
            return Response(
                {'error': f'Trolley {trolley_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Find active session for this trolley
        try:
            session = Session.objects.get(trolley=trolley, is_active=True)
        except Session.DoesNotExist:
            return Response(
                {
                    'error': f'No active session found for trolley {trolley_id}',
                    'message': 'Please scan the trolley QR code first to start a session'
                },
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if session is expired
        if session.is_expired():
            session.end_session()
            CartItem.objects.filter(session=session).delete()
            return Response(
                {
                    'error': 'Session has expired',
                    'message': 'Please scan the trolley QR code again to start a new session'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find product by product_id (barcode)
        try:
            product = Product.objects.get(barcode=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response(
                {'error': f'Product with ID {product_id} not found or inactive'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update session heartbeat
        session.update_heartbeat()
        
        # Add or update product in cart
        cart_item, created = CartItem.objects.get_or_create(
            session=session,
            product=product,
            defaults={'quantity': 1}
        )
        
        if not created:
            # Item already exists, increment quantity
            cart_item.quantity += 1
            cart_item.save()
        
        # Get cart summary
        total_items = CartItem.objects.filter(session=session).aggregate(
            total=Sum('quantity')
        )['total'] or 0
        
        total_amount = CartItem.objects.filter(session=session).aggregate(
            total=Sum('subtotal')
        )['total'] or Decimal('0.00')
        
        return Response({
            'session_id': str(session.session_id),
            'trolley_id': trolley_id,
            'product': {
                'product_id': product.barcode,
                'name': product.name,
                'price': str(product.price),
                'category': product.category,
                'image_url': product.image_url if hasattr(product, 'image_url') else None
            },
            'cart_item': {
                'quantity': cart_item.quantity,
                'subtotal': str(cart_item.subtotal)
            },
            'cart_summary': {
                'total_items': total_items,
                'total_amount': str(total_amount)
            },
            'action': 'added' if created else 'quantity_updated',
            'message': f'{product.name} {"added to" if created else "updated in"} cart'
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

