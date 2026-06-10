from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='address',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='website',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='tin',
            field=models.CharField(blank=True, max_length=50, null=True, verbose_name='TIN'),
        ),
        migrations.AddField(
            model_name='user',
            name='vat_number',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='business_registration_number',
            field=models.CharField(blank=True, max_length=80, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='receipt_tagline',
            field=models.CharField(blank=True, default='Official proof of purchase', max_length=255),
        ),
        migrations.AddField(
            model_name='user',
            name='receipt_thank_you',
            field=models.TextField(blank=True, default='Thank you for your purchase! We appreciate your business.'),
        ),
        migrations.AddField(
            model_name='user',
            name='receipt_return_policy',
            field=models.TextField(
                blank=True,
                default='Return/Exchange Policy: Items may be returned within 7 days with proof of purchase, subject to inspection.',
            ),
        ),
    ]
