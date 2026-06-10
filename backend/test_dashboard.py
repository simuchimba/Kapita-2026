#!/usr/bin/env python3
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "kapita.settings")
django.setup()

from django.db.models import Sum
from django.contrib.auth import get_user_model
from sales.models import Sale
from expenses.models import Expense
from outgoing_payments.models import OutgoingPayment
from products.models import Product
from customers.models import Customer
from credits.models import Credit
from reinvestments.models import Reinvestment

User = get_user_model()

# Get the first user
user = User.objects.first()
if user:
    print(f"User found: {user} (ID: {user.id})")
    print("\n=== Dashboard Data ===")
    print(f"Total Sales: {Sale.objects.filter(user=user).count()}")
    total_revenue = Sale.objects.filter(user=user).aggregate(total=Sum('total_amount'))['total'] or 0
    print(f"Total Revenue: ZMW {total_revenue}")
    
    print(f"\nTotal Expenses: {Expense.objects.filter(user=user).count()}")
    total_expenses = Expense.objects.filter(user=user).aggregate(total=Sum('amount'))['total'] or 0
    print(f"Total Expenses: ZMW {total_expenses}")
    
    print(f"\nTotal Outgoing Payments: {OutgoingPayment.objects.filter(user=user).count()}")
    total_outgoing = OutgoingPayment.objects.filter(user=user, status='completed').aggregate(total=Sum('amount'))['total'] or 0
    print(f"Total Outgoing Payments: ZMW {total_outgoing}")
    
    print(f"\nTotal Products: {Product.objects.filter(user=user).count()}")
    print(f"Total Customers: {Customer.objects.filter(user=user).count()}")
    print(f"Total Credits: {Credit.objects.filter(user=user).count()}")
    print(f"Total Reinvestments: {Reinvestment.objects.filter(user=user).count()}")
    
    # Show some sample data
    print("\n=== Sample Sales ===")
    for sale in Sale.objects.filter(user=user)[:3]:
        print(f"  - ZMW {sale.total_amount} | {sale.created_at}")
        
    print("\n=== Sample Expenses ===")
    for exp in Expense.objects.filter(user=user)[:3]:
        print(f"  - {exp.title}: ZMW {exp.amount} | {exp.date}")
        
    print("\n=== Sample Outgoing Payments ===")
    for op in OutgoingPayment.objects.filter(user=user)[:3]:
        print(f"  - ZMW {op.amount} | {op.payment_type} | {op.transaction_date}")
else:
    print("No user found!")
