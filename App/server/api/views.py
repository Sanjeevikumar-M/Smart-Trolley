from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from smarttrolley.settings import SESSION_TIMEOUT_SECONDS

from .models import CartItem, Payment, Product, Session, Trolley, User
from .serializers import (
	CartRemoveSerializer,
	CartScanSerializer,
	CartScanTrolleySerializer,
	CartViewSerializer,
	CartItemSerializer,
	SessionIdSerializer,
	SessionStartSerializer,
	UserSignupSerializer,
)
from .utils import calculate_cart_total, expire_session, get_locked_session, get_locked_session_by_trolley, refresh_activity


class UserSignupView(APIView):
	def post(self, request):
		serializer = UserSignupSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		user = serializer.save()
		return Response({'user_id': user.user_id}, status=status.HTTP_201_CREATED)


class SessionStartView(APIView):
	def post(self, request):
		serializer = SessionStartSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		trolley_id = serializer.validated_data['trolley_id']
		user_id = serializer.validated_data.get('user_id')
		user = User.objects.filter(user_id=user_id).first() if user_id else None

		with transaction.atomic():
			trolley = Trolley.objects.select_for_update().filter(trolley_id=trolley_id).first()
			if not trolley:
				trolley = Trolley.objects.create(trolley_id=trolley_id, last_seen=timezone.now())
			else:
				if not trolley.is_active:
					return Response({'detail': 'Trolley inactive'}, status=status.HTTP_400_BAD_REQUEST)
				if trolley.is_assigned:
					return Response({'detail': 'Trolley already in use'}, status=status.HTTP_400_BAD_REQUEST)

			existing_session = (
				Session.objects.select_for_update()
				.filter(trolley=trolley, is_active=True)
				.order_by('-created_at')
				.first()
			)
			if existing_session:
				time_since_last = (timezone.now() - existing_session.last_activity).total_seconds()
				if time_since_last > SESSION_TIMEOUT_SECONDS:
					expire_session(existing_session)
				else:
					return Response({'detail': 'Trolley already in use'}, status=status.HTTP_400_BAD_REQUEST)

			now = timezone.now()
			session = Session.objects.create(
				trolley=trolley,
				user=user,
				is_active=True,
				last_activity=now,
			)
			trolley.is_assigned = True
			trolley.last_seen = now
			trolley.save(update_fields=['is_assigned', 'last_seen'])

			return Response({'session_id': session.session_id}, status=status.HTTP_201_CREATED)


class SessionHeartbeatView(APIView):
	def post(self, request):
		serializer = SessionIdSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		session_id = serializer.validated_data['session_id']

		with transaction.atomic():
			session = get_locked_session(session_id, SESSION_TIMEOUT_SECONDS)
			refresh_activity(session)
		return Response({'status': 'ok'})


class SessionEndView(APIView):
	def post(self, request):
		serializer = SessionIdSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		session_id = serializer.validated_data['session_id']

		with transaction.atomic():
			try:
				# Try to get active session
				session = get_locked_session(session_id, SESSION_TIMEOUT_SECONDS)
				expire_session(session)
			except ValidationError as e:
				# Session is already inactive, that's fine
				if 'Session is inactive' in str(e):
					# Fetch session without timeout check
					try:
						session = Session.objects.select_for_update().select_related('trolley').get(session_id=session_id)
						# Make sure trolley is freed even if session was already expired
						if session.trolley.is_assigned:
							session.trolley.is_assigned = False
							session.trolley.last_seen = timezone.now()
							session.trolley.save(update_fields=['is_assigned', 'last_seen'])
					except Session.DoesNotExist:
						pass
				else:
					raise
		return Response({'status': 'ended'})


class CartScanView(APIView):
	def post(self, request):
		# Support both session_id (frontend) and trolley_id (ESP32)
		has_session_id = 'session_id' in request.data
		has_trolley_id = 'trolley_id' in request.data
		
		if has_session_id:
			serializer = CartScanSerializer(data=request.data)
		elif has_trolley_id:
			serializer = CartScanTrolleySerializer(data=request.data)
		else:
			return Response(
				{'detail': 'Either session_id or trolley_id is required'},
				status=status.HTTP_400_BAD_REQUEST
			)
		
		serializer.is_valid(raise_exception=True)
		barcode = serializer.validated_data['barcode']

		with transaction.atomic():
			if has_session_id:
				session_id = serializer.validated_data['session_id']
				session = get_locked_session(session_id, SESSION_TIMEOUT_SECONDS)
			else:
				trolley_id = serializer.validated_data['trolley_id']
				session = get_locked_session_by_trolley(trolley_id, SESSION_TIMEOUT_SECONDS)
			try:
				product = Product.objects.get(barcode=barcode, is_active=True)
			except Product.DoesNotExist:
				return Response({'detail': 'Product not found or inactive'}, status=status.HTTP_404_NOT_FOUND)

			cart_item = (
				CartItem.objects.select_for_update()
				.filter(session=session, product=product)
				.first()
			)
			if cart_item:
				cart_item.quantity += 1
				cart_item.subtotal = (product.price * cart_item.quantity).quantize(Decimal('0.01'))
				cart_item.save(update_fields=['quantity', 'subtotal'])
			else:
				cart_item = CartItem.objects.create(
					session=session,
					product=product,
					quantity=1,
					subtotal=product.price.quantize(Decimal('0.01')),
				)

			refresh_activity(session)
			total = calculate_cart_total(session)

		cart_items = CartItemSerializer(session.cart_items.select_related('product'), many=True)
		return Response({'items': cart_items.data, 'total': str(total)})


class CartRemoveView(APIView):
	def post(self, request):
		serializer = CartRemoveSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		session_id = serializer.validated_data['session_id']
		barcode = serializer.validated_data['barcode']

		with transaction.atomic():
			session = get_locked_session(session_id, SESSION_TIMEOUT_SECONDS)
			try:
				product = Product.objects.get(barcode=barcode)
			except Product.DoesNotExist:
				return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

			cart_item = (
				CartItem.objects.select_for_update()
				.filter(session=session, product=product)
				.first()
			)
			if not cart_item:
				return Response({'detail': 'Item not in cart'}, status=status.HTTP_404_NOT_FOUND)

			# Decrease quantity by 1, or remove if quantity becomes 0
			if cart_item.quantity > 1:
				cart_item.quantity -= 1
				cart_item.subtotal = (product.price * cart_item.quantity).quantize(Decimal('0.01'))
				cart_item.save(update_fields=['quantity', 'subtotal'])
			else:
				cart_item.delete()
				
			refresh_activity(session)
			total = calculate_cart_total(session)

		cart_items = CartItemSerializer(session.cart_items.select_related('product'), many=True)
		return Response({'items': cart_items.data, 'total': str(total)})


class CartView(APIView):
	def get(self, request):
		serializer = CartViewSerializer(data=request.query_params)
		serializer.is_valid(raise_exception=True)
		session_id = serializer.validated_data['session_id']

		session = get_locked_session(session_id, SESSION_TIMEOUT_SECONDS)
		total = calculate_cart_total(session)
		cart_items = CartItemSerializer(session.cart_items.select_related('product'), many=True)
		return Response({'items': cart_items.data, 'total': str(total)})


class PaymentCreateView(APIView):
	def post(self, request):
		serializer = SessionIdSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		session_id = serializer.validated_data['session_id']

		with transaction.atomic():
			session = get_locked_session(session_id, SESSION_TIMEOUT_SECONDS)
			
			# Create a user if session doesn't have one
			if not session.user:
				user = User.objects.create(
					name='Guest User',
					phone_number='0000000000',
				)
				session.user = user
				session.save(update_fields=['user'])

			total = calculate_cart_total(session)
			payment = Payment.objects.create(
				session=session,
				user=session.user,
				total_amount=total,
			)

		qr_string = f"upi://pay?pa=smarttrolley@upi&pn=SmartTrolley&am={total}&cu=INR&tn=Smart%20Trolley"
		return Response(
			{
				'session_id': str(session.session_id),
				'payment_id': payment.id,
				'total_amount': str(total),
				'upi_qr': qr_string,
				'status': payment.payment_status,
			},
			status=status.HTTP_201_CREATED,
		)


class PaymentConfirmView(APIView):
	def post(self, request):
		serializer = SessionIdSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		session_id = serializer.validated_data['session_id']

		with transaction.atomic():
			session = get_locked_session(session_id, SESSION_TIMEOUT_SECONDS)
			payment = session.payments.order_by('-created_at').first()
			if not payment:
				return Response({'detail': 'No payment found for session'}, status=status.HTTP_404_NOT_FOUND)

			payment.payment_status = Payment.PaymentStatus.SUCCESS
			payment.save(update_fields=['payment_status'])
			expire_session(session)

		return Response({'status': 'payment_success'})
