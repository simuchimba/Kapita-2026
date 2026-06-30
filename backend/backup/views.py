import json
import io
import zipfile
from datetime import datetime
from django.apps import apps
from django.core.serializers import serialize, deserialize
from django.http import JsonResponse, FileResponse
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


EXCLUDED_MODELS = {
    'admin.LogEntry', 'auth.Permission', 'auth.Group',
    'sessions.Session', 'contenttypes.ContentType',
    'token_blacklist.BlacklistedToken', 'token_blacklist.OutstandingToken',
}


def _get_user_apps():
    return [
        'accounts', 'products', 'sales', 'customers', 'credits',
        'expenses', 'reinvestments', 'notifications', 'suppliers',
        'purchase_orders', 'outgoing_payments', 'payments', 'quotations',
        'promotions', 'personal_finance', 'currencies', 'invoices',
    ]


def _get_user_models(user):
    data = {}
    for app_label in _get_user_apps():
        try:
            app_config = apps.get_app_config(app_label)
        except LookupError:
            continue
        for model in app_config.get_models():
            label = f"{model._meta.app_label}.{model._meta.model_name}"
            if label in EXCLUDED_MODELS:
                continue
            qs = model.objects.all()
            if hasattr(model, 'user'):
                qs = qs.filter(user=user)
            records = list(qs.values())
            if records:
                data[label] = records
    return data


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_backup(request):
    user = request.user
    data = {
        'exported_at': datetime.utcnow().isoformat(),
        'user_id': user.id,
        'user_email': user.email,
        'data': _get_user_models(user),
    }
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr('backup.json', json.dumps(data, indent=2, default=str))
        if user.logo and hasattr(user.logo, 'path'):
            try:
                with open(user.logo.path, 'rb') as f:
                    zf.writestr('logo.png', f.read())
            except (FileNotFoundError, ValueError):
                pass
    buffer.seek(0)
    filename = f"kapita_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
    return FileResponse(buffer, as_attachment=True, filename=filename,
                        content_type='application/zip')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def restore_backup(request):
    if 'file' not in request.FILES:
        return Response({'error': 'No backup file provided'}, status=400)

    user = request.user
    file_obj = request.FILES['file']

    try:
        with zipfile.ZipFile(file_obj, 'r') as zf:
            if 'backup.json' not in zf.namelist():
                return Response({'error': 'Invalid backup: missing backup.json'}, status=400)
            raw = zf.read('backup.json')
            backup_data = json.loads(raw)
    except (zipfile.BadZipFile, json.JSONDecodeError) as e:
        return Response({'error': f'Invalid backup file: {str(e)}'}, status=400)

    with transaction.atomic():
        for app_label in _get_user_apps():
            try:
                app_config = apps.get_app_config(app_label)
            except LookupError:
                continue
            for model in app_config.get_models():
                label = f"{model._meta.app_label}.{model._meta.model_name}"
                if label in EXCLUDED_MODELS or label not in backup_data['data']:
                    continue
                if hasattr(model, 'user'):
                    model.objects.filter(user=user).delete()
                else:
                    model.objects.all().delete()

        restored_counts = {}
        for label, records in backup_data['data'].items():
            if not records:
                continue
            app_label, model_name = label.split('.')
            model = apps.get_model(app_label, model_name)
            if not model:
                continue
            count = 0
            for record in records:
                pk = record.pop('id', None)
                if hasattr(model, 'user'):
                    record['user_id'] = user.id
                try:
                    if pk:
                        instance = model(id=pk, **record)
                    else:
                        instance = model(**record)
                    instance.save()
                    count += 1
                except Exception as e:
                    pass
            if count:
                restored_counts[label] = count

    return Response({
        'message': 'Restore completed successfully',
        'restored': restored_counts,
    })
