#!/usr/bin/env python3
import os
import django
from django.utils import timezone
from datetime import datetime, timedelta
import random

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "kapita.settings")
django.setup()

from django.db.models import Sum
from django.contrib.auth import get_user_model
from products.models import Product
from customers.models import Customer
from sales.models import Sale
from expenses.models import Expense
from outgoing_payments.models import OutgoingPayment
from suppliers.models import Supplier
from credits.models import Credit, Payment as CreditPayment
from reinvestments.models import Reinvestment
from notifications.models import Notification
from promotions.models import Promotion
from purchase_orders.models import PurchaseOrder, PurchaseOrderItem
from personal_finance.models import PersonalTransaction

User = get_user_model()

# Get testuser
user = User.objects.get(username='testuser')
print(f"Seeding test data for user: {user}")

# Delete existing test data for this user to avoid conflicts
print("\n" + "="*50)
print("CLEARING EXISTING TEST DATA")
print("="*50)
PersonalTransaction.objects.filter(user=user).delete()
PurchaseOrder.objects.filter(user=user).delete()
Promotion.objects.filter(user=user).delete()
Notification.objects.filter(user=user).delete()
Reinvestment.objects.filter(user=user).delete()
Credit.objects.filter(user=user).delete()
OutgoingPayment.objects.filter(user=user).delete()
Expense.objects.filter(user=user).delete()
Sale.objects.filter(user=user).delete()
Customer.objects.filter(user=user).delete()
Product.objects.filter(user=user).delete()
Supplier.objects.filter(user=user).delete()
print("Cleared existing test data!")

print("\n" + "="*50)
print("CREATING SUPPLIERS")
print("="*50)
suppliers_data = [
    {"name": "Zambezi Wholesale", "phone": "+260971111111", "email": "zambezi@wholesale.com", "address": "456 Independence Ave, Lusaka"},
    {"name": "Southern Distributors", "phone": "+260972222222", "email": "sales@southerndist.com", "address": "789 Cairo Rd, Lusaka"},
    {"name": "East African Imports", "phone": "+260973333333", "email": "info@eastafricanimports.com", "address": "321 Church Rd, Lusaka"},
    {"name": "Local Farmers Co-op", "phone": "+260974444444", "email": "coop@farmers.co.zm", "address": "101 Kafue Rd, Kafue"},
]
suppliers = []
for data in suppliers_data:
    s, _ = Supplier.objects.get_or_create(user=user, name=data["name"], defaults=data)
    suppliers.append(s)
print(f"Created {len(suppliers)} suppliers!")

print("\n" + "="*50)
print("CREATING PRODUCTS")
print("="*50)
product_categories = [
    ("Dairy", ["Milk 1L", "Cheese 250g", "Yoghurt 1L"]),
    ("Bakery", ["Bread Loaf", "Buns Pack", "Cake Slice"]),
    ("Groceries", ["Sugar 1kg", "Salt 500g", "Rice 2kg", "Cooking Oil 1L", "Maize Meal 5kg"]),
    ("Personal Care", ["Soap Bar", "Toothpaste", "Detergent 1kg", "Toilet Paper", "Diapers Pack"]),
    ("Beverages", ["Tea Bags", "Coffee 250g", "Soft Drink 500ml", "Juice 1L", "Water 2L"]),
    ("Snacks", ["Biscuits Pack", "Chocolate Bar", "Chips Pack"]),
    ("Meat & Fish", ["Chicken 1kg", "Beef 1kg", "Fish 1kg", "Eggs Tray"]),
    ("Fruits & Vegetables", ["Tomatoes 1kg", "Onions 1kg", "Potatoes 5kg", "Cabbage", "Carrots 1kg", "Bananas Bunch"]),
]
products = []
sku_counter = 1001
for category, product_names in product_categories:
    for name in product_names:
        buy_price = round(random.uniform(5.0, 40.0), 2)
        sell_price = round(buy_price * 1.5, 2)
        qty = random.randint(20, 200)
        min_stock = random.randint(5, 30)
        sku = f"PROD-{sku_counter}"
        sku_counter += 1
        
        p = Product.objects.create(
            user=user,
            name=name,
            category=category,
            sku=sku,
            buying_price=buy_price,
            selling_price=sell_price,
            quantity=qty,
            minimum_stock=min_stock,
            description=f"High quality {name.lower()} for your business.",
            supplier=random.choice(suppliers).name if random.random() > 0.3 else None
        )
        products.append(p)
print(f"Created {len(products)} products!")

print("\n" + "="*50)
print("CREATING CUSTOMERS")
print("="*50)
customers_data = [
    ("John Phiri", "+260970123456", "john.phiri@email.com"),
    ("Mary Banda", "+260971234567", "mary.banda@email.com"),
    ("Peter Mwale", "+260972345678", "peter.mwale@email.com"),
    ("Sarah Zulu", "+260973456789", "sarah.zulu@email.com"),
    ("David Tembo", "+260974567890", "david.tembo@email.com"),
    ("Linda Chanda", "+260975678901", "linda.chanda@email.com"),
    ("James Musonda", "+260976789012", "james.musonda@email.com"),
    ("Patricia Chipeta", "+260977890123", "patricia.chipeta@email.com"),
    ("Michael Sinkala", "+260978901234", "michael.sinkala@email.com"),
    ("Elizabeth Ngoma", "+260979012345", "elizabeth.ngoma@email.com"),
    ("Walk-in Customer", "+260970000000", None),
]
customers = []
for name, phone, email in customers_data:
    c, _ = Customer.objects.get_or_create(
        user=user,
        name=name,
        defaults={
            "phone": phone,
            "email": email,
            "address": f"{random.choice(['123', '456', '789', '101', '202'])} {random.choice(['Main', 'Cairo', 'Church', 'Independence', 'Freedom'])} St, Lusaka"
        }
    )
    customers.append(c)
print(f"Created {len(customers)} customers!")

print("\n" + "="*50)
print("CREATING SALES")
print("="*50)
sales = []
# Create sales for the last 30 days
for day_offset in range(30):
    sale_date = timezone.now() - timedelta(days=day_offset)
    num_sales_today = random.randint(5, 15)
    for _ in range(num_sales_today):
        customer = random.choice(customers) if random.random() > 0.3 else None
        payment_type = random.choice(["cash", "mobile_money", "credit"])
        product = random.choice(products)
        qty = random.randint(1, 10)
        discount_type = random.choice(["none", "percentage", "fixed"])
        discount_value = random.randint(5, 20) if discount_type != "none" else 0
        
        sale = Sale.objects.create(
            user=user,
            customer=customer,
            product=product,
            quantity=qty,
            unit_price=product.selling_price,
            payment_type=payment_type,
            discount_type=discount_type,
            discount_value=discount_value,
            created_at=sale_date,
            updated_at=sale_date
        )
        sales.append(sale)
print(f"Created {len(sales)} sales!")

print("\n" + "="*50)
print("CREATING EXPENSES")
print("="*50)
expense_categories = [
    ("Rent", "rent"),
    ("Electricity Bill", "utilities"),
    ("Water Bill", "utilities"),
    ("Salaries", "salaries"),
    ("Stock Purchase", "stock_purchase"),
    ("Marketing", "marketing"),
    ("Transport", "transport"),
    ("Repairs", "other"),
    ("Insurance", "other"),
    ("Stationery", "other"),
    ("Internet", "utilities"),
    ("Security", "other"),
]
expenses = []
for i, (title, category) in enumerate(expense_categories * 3):
    date = timezone.now() - timedelta(days=i)
    amount = random.randint(50, 3000)
    e, _ = Expense.objects.get_or_create(
        user=user,
        title=f"{title} {date.strftime('%b %Y')}",
        defaults={
            "amount": amount,
            "category": category,
            "date": date,
            "notes": f"Monthly {title.lower()} expense for the business."
        }
    )
    expenses.append(e)
print(f"Created {len(expenses)} expenses!")

print("\n" + "="*50)
print("CREATING OUTGOING PAYMENTS")
print("="*50)
outgoing_payments = []
# Create supplier payments
for supplier in suppliers:
    for i in range(2):
        date = timezone.now() - timedelta(days=random.randint(0, 20))
        amount = random.randint(500, 3000)
        op = OutgoingPayment.objects.create(
            user=user,
            supplier=supplier,
            payment_type="supplier",
            amount=amount,
            payment_method=random.choice(["cash", "mobile_money", "bank_transfer"]),
            reference=f"PO-REF-{random.randint(1000, 9999)}",
            notes=f"Payment to {supplier.name}",
            status="completed",
            transaction_date=date
        )
        outgoing_payments.append(op)
# Create other payments
other_payment_types = ["staff", "utilities", "rent", "other"]
for p_type in other_payment_types:
    for i in range(2):
        date = timezone.now() - timedelta(days=random.randint(0, 20))
        amount = random.randint(200, 2000)
        op = OutgoingPayment.objects.create(
            user=user,
            payment_type=p_type,
            amount=amount,
            payment_method=random.choice(["cash", "mobile_money", "bank_transfer"]),
            reference=f"REF-{random.randint(1000, 9999)}",
            notes=f"{p_type.title()} payment",
            status="completed",
            transaction_date=date
        )
        outgoing_payments.append(op)
print(f"Created {len(outgoing_payments)} outgoing payments!")

print("\n" + "="*50)
print("CREATING CREDITS AND CREDIT PAYMENTS")
print("="*50)
credits = []
for customer in customers[:5]:
    for i in range(2):
        borrow_date = timezone.now().date() - timedelta(days=random.randint(5, 30))
        due_date = borrow_date + timedelta(days=random.randint(7, 21))
        amount_owed = random.randint(100, 1500)
        amount_paid = random.randint(0, amount_owed) if random.random() > 0.4 else 0
        credit = Credit.objects.create(
            user=user,
            customer=customer,
            amount_owed=amount_owed,
            amount_paid=amount_paid,
            borrow_date=borrow_date,
            due_date=due_date,
            notes=f"Credit for {customer.name} for purchase of goods."
        )
        credits.append(credit)
        # Add some payments to some credits
        if amount_paid > 0:
            num_payments = random.randint(1, 3)
            remaining = amount_paid
            for p in range(num_payments):
                pay_amount = random.randint(50, remaining) if p < num_payments -1 else remaining
                remaining -= pay_amount
                CreditPayment.objects.create(
                    credit=credit,
                    amount=pay_amount,
                    payment_date=borrow_date + timedelta(days=random.randint(1, (due_date - borrow_date).days)),
                    notes=f"Partial payment by {customer.name}"
                )
print(f"Created {len(credits)} credits with payments!")

print("\n" + "="*50)
print("CREATING REINVESTMENTS")
print("="*50)
reinvestment_data = [
    ("New Stock Purchase", "new_stock", 5000, 15.0),
    ("New Freezer", "equipment", 8000, 20.0),
    ("Marketing Campaign", "marketing", 2000, 25.0),
    ("Shop Expansion", "expansion", 15000, 30.0),
    ("Additional Shelving", "equipment", 3000, 12.0),
    ("Delivery Bike", "equipment", 6000, 18.0),
]
reinvestments = []
for i, (purpose_title, purpose, amount, margin) in enumerate(reinvestment_data):
    date = timezone.now() - timedelta(days=i*5)
    r = Reinvestment.objects.create(
        user=user,
        amount=amount,
        purpose=purpose,
        date=date,
        expected_margin=margin,
        notes=f"{purpose_title} to grow the business."
    )
    reinvestments.append(r)
print(f"Created {len(reinvestments)} reinvestments!")

print("\n" + "="*50)
print("CREATING NOTIFICATIONS")
print("="*50)
notification_data = [
    ("Low Stock Alert", "Some products are running low on stock. Please reorder soon.", "low_stock"),
    ("Overdue Debt Reminder", "A customer's credit payment is overdue. Follow up immediately.", "overdue_debt"),
    ("Payment Reminder", "Don't forget to pay your suppliers this week.", "payment_reminder"),
    ("Monthly Report Ready", "Your monthly business report is ready for viewing.", "info"),
    ("Welcome to Kapita!", "Thank you for using Kapita. Start tracking your business today!", "info"),
    ("Sales Milestone", "Great job! You've hit a new sales record this week!", "info"),
]
notifications = []
for title, message, ntype in notification_data:
    n, _ = Notification.objects.get_or_create(
        user=user,
        title=title,
        defaults={
            "message": message,
            "type": ntype,
            "is_read": random.choice([True, False])
        }
    )
    notifications.append(n)
print(f"Created {len(notifications)} notifications!")

print("\n" + "="*50)
print("CREATING PROMOTIONS")
print("="*50)
promotion_data = [
    ("Summer Sale 2024", "percentage", 10.0, True, timezone.now().date() - timedelta(days=10), timezone.now().date() + timedelta(days=20)),
    ("Weekend Discount", "percentage", 15.0, False, timezone.now().date() - timedelta(days=2), timezone.now().date() + timedelta(days=5)),
    ("Fixed Price Cut", "fixed", 5.0, False, timezone.now().date(), timezone.now().date() + timedelta(days=14)),
]
promotions = []
for name, dtype, value, apply_all, start, end in promotion_data:
    promo, _ = Promotion.objects.get_or_create(
        user=user,
        name=name,
        defaults={
            "description": f"Special {name.lower()} for all valued customers!",
            "discount_type": dtype,
            "discount_value": value,
            "apply_to_all_products": apply_all,
            "start_date": start,
            "end_date": end,
            "status": "active",
            "times_used": random.randint(0, 50)
        }
    )
    if not apply_all:
        promo.products.add(*random.sample(products, k=min(5, len(products))))
    promotions.append(promo)
print(f"Created {len(promotions)} promotions!")

print("\n" + "="*50)
print("CREATING PURCHASE ORDERS")
print("="*50)
purchase_orders = []
for supplier in suppliers[:3]:
    for i in range(2):
        po_date = timezone.now() - timedelta(days=random.randint(3, 15))
        po = PurchaseOrder.objects.create(
            user=user,
            supplier=supplier,
            order_date=po_date,
            expected_delivery_date=po_date + timedelta(days=random.randint(2, 7)),
            status=random.choice(["pending", "ordered", "received"]),
            notes=f"Stock order from {supplier.name}"
        )
        num_items = random.randint(2, 5)
        for ___ in range(num_items):
            product = random.choice(products)
            qty = random.randint(10, 100)
            PurchaseOrderItem.objects.create(
                purchase_order=po,
                product=product,
                quantity=qty,
                unit_price=product.buying_price
            )
        purchase_orders.append(po)
print(f"Created {len(purchase_orders)} purchase orders!")

print("\n" + "="*50)
print("CREATING PERSONAL TRANSACTIONS")
print("="*50)
personal_transactions = []
# Create income transactions
income_titles = ["Side Income", "Freelance Work", "Gift from Family", "Salary", "Refund"]
for title in income_titles:
    for i in range(2):
        date = timezone.now() - timedelta(days=random.randint(0, 20))
        amount = random.randint(200, 2000)
        pt = PersonalTransaction.objects.create(
            user=user,
            title=title,
            amount=amount,
            transaction_type="income",
            category=random.choice(["side_income", "salary", "freelance", "gift", "refund"]),
            date=date,
            notes=f"{title} received on {date.strftime('%Y-%m-%d')}"
        )
        personal_transactions.append(pt)
# Create expense transactions
expense_titles = ["Groceries", "Transport", "Airtime", "Entertainment", "Clothing", "Savings"]
expense_categories = ["food", "transport", "airtime", "entertainment", "clothing", "savings"]
for title, category in zip(expense_titles, expense_categories):
    for i in range(3):
        date = timezone.now() - timedelta(days=random.randint(0, 20))
        amount = random.randint(50, 800)
        pt = PersonalTransaction.objects.create(
            user=user,
            title=title,
            amount=amount,
            transaction_type="expense",
            category=category,
            date=date,
            notes=f"{title} expense on {date.strftime('%Y-%m-%d')}"
        )
        personal_transactions.append(pt)
print(f"Created {len(personal_transactions)} personal transactions!")

print("\n" + "="*50)
print("TEST DATA SEEDED SUCCESSFULLY!")
print("="*50)

print("\n=== DATA SUMMARY ===")
print(f"Suppliers:            {Supplier.objects.filter(user=user).count()}")
print(f"Products:             {Product.objects.filter(user=user).count()}")
print(f"Customers:            {Customer.objects.filter(user=user).count()}")
print(f"Sales:                {Sale.objects.filter(user=user).count()}")
print(f"Expenses:             {Expense.objects.filter(user=user).count()}")
print(f"Outgoing Payments:    {OutgoingPayment.objects.filter(user=user).count()}")
print(f"Credits:              {Credit.objects.filter(user=user).count()}")
print(f"Reinvestments:        {Reinvestment.objects.filter(user=user).count()}")
print(f"Notifications:        {Notification.objects.filter(user=user).count()}")
print(f"Promotions:           {Promotion.objects.filter(user=user).count()}")
print(f"Purchase Orders:      {PurchaseOrder.objects.filter(user=user).count()}")
print(f"Personal Transactions:{PersonalTransaction.objects.filter(user=user).count()}")

total_revenue = Sale.objects.filter(user=user).aggregate(total=Sum('total_amount'))['total'] or 0
total_expenses = Expense.objects.filter(user=user).aggregate(total=Sum('amount'))['total'] or 0
total_outgoing = OutgoingPayment.objects.filter(user=user, status='completed').aggregate(total=Sum('amount'))['total'] or 0

print(f"\nTotal Revenue:        ZMW {total_revenue:,.2f}")
print(f"Total Expenses:       ZMW {total_expenses:,.2f}")
print(f"Total Outgoing:       ZMW {total_outgoing:,.2f}")
