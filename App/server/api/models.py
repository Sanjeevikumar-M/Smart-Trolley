import uuid

from django.db import models
from django.db.models import Q


class User(models.Model):
	user_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	name = models.CharField(max_length=255)
	phone_number = models.CharField(max_length=20, unique=True)
	email = models.EmailField(blank=True, null=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		db_table = 'billing_user'
		ordering = ['-created_at']

	def __str__(self):
		return f"{self.name} ({self.phone_number})"


class Product(models.Model):
	barcode = models.CharField(max_length=64, unique=True)
	name = models.CharField(max_length=255)
	price = models.DecimalField(max_digits=10, decimal_places=2)
	category = models.CharField(max_length=100)
	is_active = models.BooleanField(default=True)

	class Meta:
		ordering = ['name']

	def __str__(self):
		return f"{self.name} ({self.barcode})"


class Trolley(models.Model):
	trolley_id = models.CharField(max_length=50, unique=True)
	is_assigned = models.BooleanField(default=False)
	is_active = models.BooleanField(default=True)
	last_seen = models.DateTimeField(blank=True, null=True)

	class Meta:
		ordering = ['trolley_id']

	def __str__(self):
		return self.trolley_id


class Session(models.Model):
	session_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	trolley = models.ForeignKey(Trolley, on_delete=models.PROTECT, related_name='sessions')
	user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='sessions')
	is_active = models.BooleanField(default=True)
	last_activity = models.DateTimeField()
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-created_at']
		constraints = [
			models.UniqueConstraint(
				fields=['trolley'],
				condition=Q(is_active=True),
				name='unique_active_session_per_trolley',
			),
		]

	def __str__(self):
		return str(self.session_id)


class CartItem(models.Model):
	session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='cart_items')
	product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='cart_items')
	quantity = models.PositiveIntegerField(default=1)
	subtotal = models.DecimalField(max_digits=12, decimal_places=2)

	class Meta:
		ordering = ['product__name']
		constraints = [
			models.UniqueConstraint(fields=['session', 'product'], name='unique_product_per_session'),
		]

	def __str__(self):
		return f"{self.product.name} x {self.quantity}"


class Payment(models.Model):
	class PaymentStatus(models.TextChoices):
		PENDING = 'PENDING', 'Pending'
		SUCCESS = 'SUCCESS', 'Success'
		FAILED = 'FAILED', 'Failed'

	session = models.ForeignKey(Session, on_delete=models.PROTECT, related_name='payments')
	user = models.ForeignKey(User, on_delete=models.PROTECT, related_name='payments')
	total_amount = models.DecimalField(max_digits=12, decimal_places=2)
	payment_status = models.CharField(max_length=10, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-created_at']

	def __str__(self):
		return f"Payment {self.pk} - {self.payment_status}"
