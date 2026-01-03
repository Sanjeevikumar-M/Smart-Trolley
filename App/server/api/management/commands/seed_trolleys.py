from django.core.management.base import BaseCommand
from django.utils import timezone

from api.models import Trolley


class Command(BaseCommand):
    help = 'Seed the database with sample trolleys'

    def handle(self, *args, **options):
        trolleys_data = [
            'TROLLEY_01',
            'TROLLEY_02',
            'TROLLEY_03',
            'TROLLEY_04',
            'TROLLEY_05',
            'TROLLEY_06',
            'TROLLEY_07',
            'TROLLEY_08',
            'TROLLEY_09',
            'TROLLEY_10',
        ]

        created_count = 0
        for trolley_id in trolleys_data:
            trolley, created = Trolley.objects.get_or_create(
                trolley_id=trolley_id,
                defaults={
                    'is_assigned': False,
                    'is_active': True,
                    'last_seen': timezone.now(),
                },
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'✓ Created: {trolley.trolley_id}'))
            else:
                self.stdout.write(self.style.WARNING(f'⊗ Exists: {trolley.trolley_id}'))

        self.stdout.write(
            self.style.SUCCESS(f'\n✓ Seed complete! {created_count} new trolleys added.')
        )
