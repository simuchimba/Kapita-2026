import django.db.models.deletion
from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0005_user_bank_account_name_user_bank_account_number_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="user",
            name="email_verification_token",
        ),
        migrations.RemoveField(
            model_name="user",
            name="email_verification_token_expires_at",
        ),
        migrations.AddField(
            model_name="user",
            name="email_verification_code",
            field=models.CharField(blank=True, max_length=6, null=True),
        ),
        migrations.AddField(
            model_name="user",
            name="email_verification_code_expires_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]

