from decimal import Decimal

from django.core.management.base import BaseCommand

from api.models import Product


class Command(BaseCommand):
    help = 'Seed the database with sample products'

    def handle(self, *args, **options):
        products_data = [
            # Dairy & Beverages
            {'barcode': '8901234000001', 'name': 'Amul Milk 500ml', 'price': Decimal('35.00'), 'category': 'Dairy'},
            {'barcode': '8901234000002', 'name': 'Yogurt Plain 400g', 'price': Decimal('45.00'), 'category': 'Dairy'},
            {'barcode': '8901234000003', 'name': 'Paneer 200g', 'price': Decimal('85.00'), 'category': 'Dairy'},
            {'barcode': '8901234000004', 'name': 'Orange Juice 1L', 'price': Decimal('65.00'), 'category': 'Beverages'},
            {'barcode': '8901234000005', 'name': 'Coffee Powder 100g', 'price': Decimal('95.00'), 'category': 'Beverages'},
            {'barcode': '8901234000006', 'name': 'Tea Bags 25 pcs', 'price': Decimal('45.00'), 'category': 'Beverages'},
            
            # Grains & Cereals
            {'barcode': '8901234000007', 'name': 'Basmati Rice 1kg', 'price': Decimal('120.00'), 'category': 'Grains'},
            {'barcode': '8901234000008', 'name': 'Wheat Flour 1kg', 'price': Decimal('35.00'), 'category': 'Grains'},
            {'barcode': '8901234000009', 'name': 'Cornflakes 250g', 'price': Decimal('55.00'), 'category': 'Cereals'},
            {'barcode': '8901234000010', 'name': 'Oats 500g', 'price': Decimal('75.00'), 'category': 'Cereals'},
            
            # Vegetables
            {'barcode': '8901234000011', 'name': 'Tomato 1kg', 'price': Decimal('25.00'), 'category': 'Vegetables'},
            {'barcode': '8901234000012', 'name': 'Onion 1kg', 'price': Decimal('30.00'), 'category': 'Vegetables'},
            {'barcode': '8901234000013', 'name': 'Potato 1kg', 'price': Decimal('20.00'), 'category': 'Vegetables'},
            {'barcode': '8901234000014', 'name': 'Carrot 500g', 'price': Decimal('25.00'), 'category': 'Vegetables'},
            {'barcode': '8901234000015', 'name': 'Spinach 250g', 'price': Decimal('20.00'), 'category': 'Vegetables'},
            
            # Fruits
            {'barcode': '8901234000016', 'name': 'Apple Red 1kg', 'price': Decimal('120.00'), 'category': 'Fruits'},
            {'barcode': '8901234000017', 'name': 'Banana 1kg', 'price': Decimal('40.00'), 'category': 'Fruits'},
            {'barcode': '8901234000018', 'name': 'Orange 1kg', 'price': Decimal('60.00'), 'category': 'Fruits'},
            {'barcode': '8901234000019', 'name': 'Mango 1kg', 'price': Decimal('100.00'), 'category': 'Fruits'},
            
            # Snacks & Sweets
            {'barcode': '8901234000020', 'name': 'Chips Lay\'s 50g', 'price': Decimal('15.00'), 'category': 'Snacks'},
            {'barcode': '8901234000021', 'name': 'Biscuits Parle 200g', 'price': Decimal('30.00'), 'category': 'Snacks'},
            {'barcode': '8901234000022', 'name': 'Chocolate Amul 50g', 'price': Decimal('20.00'), 'category': 'Sweets'},
            {'barcode': '8901234000023', 'name': 'Candy Mix 100g', 'price': Decimal('25.00'), 'category': 'Sweets'},
            
            # Personal Care
            {'barcode': '8901234000024', 'name': 'Soap Dove 75g', 'price': Decimal('30.00'), 'category': 'Personal Care'},
            {'barcode': '8901234000025', 'name': 'Toothpaste Colgate 100ml', 'price': Decimal('35.00'), 'category': 'Personal Care'},
            {'barcode': '8901234000026', 'name': 'Shampoo 200ml', 'price': Decimal('80.00'), 'category': 'Personal Care'},
            {'barcode': '8901234000027', 'name': 'Deodorant 200ml', 'price': Decimal('120.00'), 'category': 'Personal Care'},
            
            # Household Items
            {'barcode': '8901234000028', 'name': 'Detergent Powder 1kg', 'price': Decimal('95.00'), 'category': 'Household'},
            {'barcode': '8901234000029', 'name': 'Dish Wash 500ml', 'price': Decimal('40.00'), 'category': 'Household'},
            {'barcode': '8901234000030', 'name': 'Tissue Roll Pack 4', 'price': Decimal('55.00'), 'category': 'Household'},
        ]

        created_count = 0
        for product_data in products_data:
            product, created = Product.objects.get_or_create(
                barcode=product_data['barcode'],
                defaults={
                    'name': product_data['name'],
                    'price': product_data['price'],
                    'category': product_data['category'],
                    'is_active': True,
                },
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'✓ Created: {product.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'⊗ Exists: {product.name}'))

        self.stdout.write(
            self.style.SUCCESS(f'\n✓ Seed complete! {created_count} new products added.')
        )
