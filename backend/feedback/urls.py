from django.urls import path
from .views import (
    FeedbackSubmitView,
    MyFeedbackListView,
    AdminFeedbackListView,
    AdminFeedbackDetailView,
    admin_feedback_export_csv,
    admin_feedback_stats,
)

urlpatterns = [
    # User-facing
    path('', FeedbackSubmitView.as_view(), name='feedback-submit'),
    path('mine/', MyFeedbackListView.as_view(), name='feedback-mine'),

    # Admin-facing
    path('admin/', AdminFeedbackListView.as_view(), name='feedback-admin-list'),
    path('admin/stats/', admin_feedback_stats, name='feedback-admin-stats'),
    path('admin/export/csv/', admin_feedback_export_csv, name='feedback-admin-csv'),
    path('admin/<int:pk>/', AdminFeedbackDetailView.as_view(), name='feedback-admin-detail'),
]
