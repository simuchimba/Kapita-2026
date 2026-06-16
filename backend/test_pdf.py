import os
import django

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "kapita.settings")
django.setup()

from accounts.models import User
from customers.models import Customer
from quotations.models import Quotation, QuotationItem
from django.test import RequestFactory
from quotations.views import QuotationViewSet


def test_pdf_generation():
    print("🧪 Testing Quotation PDF generation...")

    # Clean up test data
    QuotationItem.objects.all().delete()
    Quotation.objects.all().delete()
    Customer.objects.filter(name="Test Customer").delete()

    # Get/create test user
    user, _ = User.objects.get_or_create(
        username="admin",
        defaults={
            "email": "admin@kapita.com",
            "is_staff": True,
            "is_superuser": True
        }
    )
    if not user.has_usable_password():
        user.set_password("admin123")
        user.save()

    # Create customer and quotation
    customer = Customer.objects.create(
        user=user,
        name="Test Customer",
        phone="1234567890"
    )

    quotation = Quotation.objects.create(
        user=user,
        customer=customer,
        subject="Test Quotation for PDF",
        vat_percentage=16,
        delivery_period="7 business days",
        payment_terms="NET30",
        warranty="1 year",
        validity_period="30 days"
    )

    # Add items
    QuotationItem.objects.create(
        quotation=quotation,
        description="Product 1",
        quantity=2,
        unit_price=50
    )
    QuotationItem.objects.create(
        quotation=quotation,
        description="Product 2",
        quantity=1,
        unit_price=200
    )

    # Calculate totals
    quotation.refresh_from_db()
    quotation.calculate_totals()
    quotation.save()

    # Simulate PDF generation
    factory = RequestFactory()
    request = factory.get(f"/api/quotations/{quotation.id}/pdf/")
    request.user = user

    viewset = QuotationViewSet()
    viewset.request = request
    viewset.format_kwarg = None
    response = viewset.pdf(request, pk=quotation.id)

    print("\n✅ Quotation created!")
    print(f"   - ID: {quotation.id}")
    print(f"   - Number: {quotation.quotation_number}")
    print(f"   - Subtotal: {quotation.subtotal}")
    print(f"   - VAT: {quotation.vat_amount}")
    print(f"   - Total: {quotation.total_amount}")
    print(f"\n✅ PDF generation status: {response.status_code}")

    if response.status_code == 200:
        print("✅ PDF generation successful!")
        return True
    else:
        print("❌ PDF generation failed!")
        return False


if __name__ == "__main__":
    test_pdf_generation()