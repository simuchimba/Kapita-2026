from django.core.management.base import BaseCommand
from products.models import Product
import random


def generate_ean13():
    """Generate a valid EAN-13 barcode"""
    digits = [random.randint(0, 9) for _ in range(12)]
    digits[0] = 2  # Start with 2 for in-store marking
    odd_sum = sum(digits[i] for i in range(0, 12, 2))
    even_sum = sum(digits[i] for i in range(1, 12, 2))
    check = (10 - ((odd_sum + even_sum * 3) % 10)) % 10
    digits.append(check)
    return ''.join(str(d) for d in digits)


def generate_code128(text):
    """Generate a Code-128B barcode string from text"""
    cleaned = ''.join(c for c in text.upper() if c.isalnum() or c in '-_.')
    if len(cleaned) > 12:
        cleaned = cleaned[:12]
    if len(cleaned) < 4:
        cleaned = cleaned.zfill(4)
    return cleaned


class Command(BaseCommand):
    help = 'Generate barcodes for products that do not have one'

    def add_arguments(self, parser):
        parser.add_argument(
            '--format',
            type=str,
            choices=['ean13', 'code128'],
            default='code128',
            help='Barcode format to generate (default: code128)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )

    def handle(self, *args, **options):
        fmt = options['format']
        dry_run = options['dry_run']

        products = Product.objects.filter(barcode__isnull=True) | Product.objects.filter(barcode__exact='')
        total = products.count()

        if total == 0:
            self.stdout.write(self.style.SUCCESS('All products already have barcodes.'))
            return

        self.stdout.write(f'Found {total} products without barcodes')

        used_barcodes = set(Product.objects.exclude(barcode__isnull=True).exclude(barcode__exact='').values_list('barcode', flat=True))

        updated = 0
        skipped = 0

        for product in products:
            if fmt == 'ean13':
                code = generate_ean13()
                while code in used_barcodes:
                    code = generate_ean13()
            else:
                code = generate_code128(f"{product.sku}-{product.id}")
                while code in used_barcodes:
                    code = generate_code128(f"{product.sku}-{product.id}-{random.randint(10, 99)}")

            used_barcodes.add(code)

            if dry_run:
                self.stdout.write(f'  Would set barcode for #{product.id} {product.name}: {code}')
            else:
                product.barcode = code
                product.save(update_fields=['barcode'])

            updated += 1

        if dry_run:
            self.stdout.write(self.style.WARNING(f'Dry run: {updated} products would be updated'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Successfully set barcodes for {updated} products'))
