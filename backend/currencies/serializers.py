from rest_framework import serializers
from .models import Currency, ExchangeRate


class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = '__all__'


class ExchangeRateSerializer(serializers.ModelSerializer):
    base_currency_name = serializers.CharField(source='base_currency.name', read_only=True)
    base_currency_symbol = serializers.CharField(source='base_currency.symbol', read_only=True)
    target_currency_name = serializers.CharField(source='target_currency.name', read_only=True)
    target_currency_symbol = serializers.CharField(source='target_currency.symbol', read_only=True)

    class Meta:
        model = ExchangeRate
        fields = ['id', 'user', 'base_currency', 'target_currency', 'rate',
                  'base_currency_name', 'base_currency_symbol',
                  'target_currency_name', 'target_currency_symbol', 'updated_at']
        read_only_fields = ['user', 'updated_at']

    def validate(self, data):
        if data['base_currency'] == data['target_currency']:
            raise serializers.ValidationError("Base and target currencies must be different")
        return data
