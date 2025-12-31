from django.core.management.base import BaseCommand
from products.models import Product
from trolleys.models import Trolley


class Command(BaseCommand):
    help = 'Seed the database with sample products and trolleys'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')
        
        # Create sample products
        products_data = [
            {'barcode': '8901234567890', 'name': 'Milk (1L)', 'price': '65.00', 'category': 'Dairy'},
            {'barcode': '8901234567891', 'name': 'Bread (White)', 'price': '45.00', 'category': 'Bakery'},
            {'barcode': '8901234567892', 'name': 'Rice (5kg)', 'price': '350.00', 'category': 'Grains'},
            {'barcode': '8901234567893', 'name': 'Cooking Oil (1L)', 'price': '180.00', 'category': 'Cooking'},
            {'barcode': '8901234567894', 'name': 'Sugar (1kg)', 'price': '55.00', 'category': 'Grains'},
            {'barcode': '8901234567895', 'name': 'Tea (250g)', 'price': '150.00', 'category': 'Beverages'},
            {'barcode': '8901234567896', 'name': 'Coffee (200g)', 'price': '280.00', 'category': 'Beverages'},
            {'barcode': '8901234567897', 'name': 'Biscuits', 'price': '35.00', 'category': 'Snacks'},
            {'barcode': '8901234567898', 'name': 'Chips', 'price': '25.00', 'category': 'Snacks'},
            {'barcode': '8901234567899', 'name': 'Butter (100g)', 'price': '85.00', 'category': 'Dairy'},
            {'barcode': '8901234567900', 'name': 'Cheese (200g)', 'price': '180.00', 'category': 'Dairy'},
            {'barcode': '8901234567901', 'name': 'Eggs (12 pcs)', 'price': '90.00', 'category': 'Dairy'},
            {'barcode': '8901234567902', 'name': 'Apple (1kg)', 'price': '180.00', 'category': 'Fruits'},
            {'barcode': '8901234567903', 'name': 'Banana (1dozen)', 'price': '60.00', 'category': 'Fruits'},
            {'barcode': '8901234567904', 'name': 'Tomato (1kg)', 'price': '40.00', 'category': 'Vegetables'},
            {'barcode': '8901234567905', 'name': 'Potato (1kg)', 'price': '35.00', 'category': 'Vegetables'},
            {'barcode': '8901234567906', 'name': 'Onion (1kg)', 'price': '45.00', 'category': 'Vegetables'},
            {'barcode': '8901234567907', 'name': 'Soap Bar', 'price': '45.00', 'category': 'Personal Care'},
            {'barcode': '8901234567908', 'name': 'Shampoo (200ml)', 'price': '180.00', 'category': 'Personal Care'},
            {'barcode': '8901234567909', 'name': 'Toothpaste', 'price': '95.00', 'category': 'Personal Care'},
        ]
        
        products_created = 0
        for product_data in products_data:
            product, created = Product.objects.get_or_create(
                barcode=product_data['barcode'],
                defaults={
                    'name': product_data['name'],
                    'price': product_data['price'],
                    'category': product_data['category'],
                    'is_active': True
                }
            )
            if created:
                products_created += 1
        
        self.stdout.write(f'Created {products_created} products')
        
        # Create sample trolleys
        trolleys_created = 0
        for i in range(1, 11):  # Create 10 trolleys
            trolley_id = f'TROLLEY_{str(i).zfill(2)}'
            trolley, created = Trolley.objects.get_or_create(
                trolley_id=trolley_id,
                defaults={
                    'is_active': True,
                    'is_locked': True
                }
            )
            if created:
                trolleys_created += 1
        
        self.stdout.write(f'Created {trolleys_created} trolleys')
        
        self.stdout.write(self.style.SUCCESS('Database seeding completed!'))
        self.stdout.write(f'Total products: {Product.objects.count()}')
        self.stdout.write(f'Total trolleys: {Trolley.objects.count()}')
