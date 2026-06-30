from rest_framework import serializers
from .models import Invoice, InvoiceItem


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ['id', 'invoice', 'description', 'quantity', 'unit_price', 'total']
        read_only_fields = ['id', 'invoice', 'total']


class InvoiceListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ['id', 'invoice_number', 'customer_name', 'issue_date', 'due_date',
                  'total_amount', 'amount_paid', 'balance_due', 'currency', 'status', 'created_at']


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, required=False)

    class Meta:
        model = Invoice
        fields = ['id', 'user', 'invoice_number', 'customer_name', 'customer_email',
                  'customer_phone', 'customer_address', 'issue_date', 'due_date',
                  'currency', 'subtotal', 'tax_name', 'tax_rate', 'tax_amount',
                  'discount_name', 'discount_amount', 'total_amount', 'amount_paid',
                  'balance_due', 'status', 'notes', 'terms_conditions', 'items',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'invoice_number', 'subtotal', 'tax_amount',
                           'total_amount', 'balance_due', 'created_at', 'updated_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        invoice = Invoice.objects.create(**validated_data)
        for item_data in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item_data)
        invoice.calculate_totals()
        invoice.save()
        return invoice

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                InvoiceItem.objects.create(invoice=instance, **item_data)
            instance.calculate_totals()
            instance.save()
        return instance
