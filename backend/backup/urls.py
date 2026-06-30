from django.urls import path
from .views import export_backup, restore_backup

urlpatterns = [
    path('export/', export_backup, name='backup-export'),
    path('restore/', restore_backup, name='backup-restore'),
]
