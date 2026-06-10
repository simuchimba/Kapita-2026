#!/usr/bin/env python3
import os
import django
from django.utils import timezone
from datetime import datetime, timedelta

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "kapita.settings")
django.setup()

from django.db.models import Sum
from django.contrib.auth import get_user_model
from products.models import Product
from customers.models import Customer
from sales.models import Sale, SaleItem
from expenses.models import Expense
from outgoing_payments.models import OutgoingPayment
from suppliers.models import Supplier

User = get_user_model()

# Get the admin user
user = User.objects.first()
if not user:
    print("Creating test user...")
    user = User.objects.create_user(
        email="admin@kapita.com",
        password="Test1234!",
        first_name="Admin",
        last_name="User"
    )

print(f"Seeding test data for user: {user}")

# Create a supplier
print("\nCreating suppliers...")
supplier, _ = Supplier.objects.get_or_create(
    user=user,
    name="Test Supplier Co.",
    defaults={
        "phone": "+260971234567",
        "email": "supplier@test.com",
        "address": "123 Main St, Lusaka"
    }
)

# Create some products
print("Creating products...")
products = []
product_names = [
    ("Milk", 10.0, 15.0),
    ("Bread", 5.0, 8.0),
    ("Sugar", 20.0, 30.0),
    ("Soap", 8.0, 12.0),
    ("Toothpaste", 12.0, 18.0)
]
for name, buy, sell in product_names:
    p, _ = Product.objects.get_or_create(
        user=user,
        name=name,
        defaults={
            "buying_price": buy,
            "selling_price": sell,
            "quantity": 100,
            "minimum_stock": 20
        }
    )
    products.append(p)
print(f"Created {len(products)} products!")

# Create customer
print("\nCreating customer...")
customer, _ = Customer.objects.get_or_create(
    user=user,
    name="Test Customer",
    defaults={
        "phone": "+260970123456",
        "email": "customer@test.com"
    }
)

# Create some sales
print("\nCreating sales...")
sale_dates = [
    timezone.now() - timedelta(days=1),
    timezone.now() - timedelta(days=2),
    timezone.now() - timedelta(days=3),
    timezone.now() - timedelta(days=5),
    timezone.now() - timedelta(days=7)
]
for i, sale_date in enumerate(sale_dates):
    sale = Sale.objects.create(
        user=user,
        customer=customer,
        payment_type=["cash", "mobile_money"][i % 2],
        created_at=sale_date,
        updated_at=sale_date
    )
    
    # Add sale items
    for product in products[:i+1]:
        qty = i + 2
        sale_item = SaleItem.objects.create(
            sale=sale,
            product=product,
            quantity=qty,
            unit_price=product.selling_price
        )
    
    # Update total amount for the sale
    sale.total_amount = sum(
        item.quantity * item.unit_price 
        for item in sale.saleitem_set.all()
    )
    sale.save()
    print(f"Created sale {i+1} for ZMW {sale.total_amount}")

# Create expenses
print("\nCreating expenses...")
expense_list = [
    ("Rent", 1000, "rent"),
    ("Electricity", 200, "utilities"),
    ("Salaries", 1500, "salaries"),
    ("Stock Purchase", 500, "stock_purchase"),
    ("Marketing", 150, "marketing"),
    ("Transport", 100, "transport")
]
for title, amount, category in expense_list:
    Expense.objects.get_or_create(
        user=user,
        title=title,
        amount=amount,
        category=category,
        date=timezone.now() - timedelta(days=expense_list.index((title, amount, category)))
    )
print(f"Created {len(expense_list)} expenses!")

# Create outgoing payments
print("\nCreating outgoing payments...")
payment_list = [
    ("supplier", 800, "Supplier Payment"),
    ("staff", 500, "Staff Wages"),
    ("rent", 300, "Rent Payment"),
    ("utilities", 150, "Electricity"),
    ("other", 200, "Miscellaneous")
]
for i, (ptype, amount, notes) in enumerate(payment_list):
    OutgoingPayment.objects.get_or_create(
        user=user,
        payment_type=ptype,
        payment_method=["cash", "mobile_money", "bank_transfer"][i % 3],
        amount=amount,
        notes=notes,
        transaction_date=timezone.now() - timedelta(days=i),
        supplier=supplier if ptype == "supplier" else None,
        status="completed"
    )
print(f"Created {len(payment_list)} outgoing payments!")

print("\n✅ Test data seeded successfully!")

print("\n=== Summary ===")
print(f"Total Products: {Product.objects.filter(user=user).count()}")
print(f"Total Sales: {Sale.objects.filter(user=user).count()}")
print(f"Total Expenses: {Expense.objects.filter(user=user).count()}")
print(f"Total Outgoing Payments: {OutgoingPayment.objects.filter(user=user).count()}")

total_revenue = Sale.objects.filter(user=user).aggregate(total=Sum('total_amount'))['total'] or 0
total_expenses = Expense.objects.filter(user=user).aggregate(total=Sum('amount'))['total'] or 0
total_outgoing = OutgoingPayment.objects.filter(user=user, status='completed').aggregate(total=Sum('amount'))['total'] or 0

print(f"\nTotal Revenue: ZMW {total_revenue}")
print(f"Total Expenses: ZMW {total_expenses}")
print(f"Total Outgoing Payments: ZMW {total_outgoing}")
