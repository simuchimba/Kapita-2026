from django.core.management.base import BaseCommand
from products.models import Product
from products.barcode_utils import generate_barcode_image
import random
import string


def generate_code():
    prefix = ''.join(random.choices(string.ascii_uppercase, k=3))
    num = ''.join(random.choices(string.digits, k=5))
    return f'{prefix}-{num}'


class Command(BaseCommand):
    help = 'Generate barcodes for products that do not have one, and verify all barcode images render correctly'

    def add_arguments(self, parser):
        parser.add_argument('--only-missing', action='store_true', help='Only generate barcodes for products without one')
        parser.add_argument('--force', action='store_true', help='Regenerate barcodes for all products')
        parser.add_argument('--dry-run', action='store_true', help='Show what would be done without making changes')

    def handle(self, *args, **options):
        only_missing = options.get('only_missing', False)
        force = options.get('force', False)
        dry_run = options.get('dry_run', False)

        if only_missing:
            products = Product.objects.filter(barcode__isnull=True) | Product.objects.filter(barcode__exact='')
            products = products.distinct()
        elif force:
            products = Product.objects.all()
        else:
            products = Product.objects.filter(barcode__isnull=True) | Product.objects.filter(barcode__exact='')
            products = products.distinct()

        if not products:
            self.stdout.write(self.style.SUCCESS('All products already have barcodes.'))
            return

        self.stdout.write(f'Processing {products.count()} products...')

        used_barcodes = set(
            Product.objects.exclude(barcode__isnull=True).exclude(barcode__exact='')
            .values_list('barcode', flat=True)
        )

        updated = 0
        errors = 0

        for product in products:
            if not product.barcode or force:
                code = generate_code()
                while code in used_barcodes:
                    code = generate_code()
                used_barcodes.add(code)

                if not dry_run:
                    product.barcode = code
                    product.save(update_fields=['barcode'])

                updated += 1
                self.stdout.write(f'  Set barcode for #{product.id} {product.name}: {code}')

            # Verify barcode image renders
            if not dry_run and product.barcode:
                try:
                    buf = generate_barcode_image(product.barcode)
                    self.stdout.write(f'  Barcode image OK for #{product.id} {product.name}')
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'  Barcode image FAILED for #{product.id} {product.name}: {e}'))
                    errors += 1

        if dry_run:
            self.stdout.write(self.style.WARNING(f'Dry run: {updated} products would be updated'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Done. Updated: {updated}, Errors: {errors}'))
