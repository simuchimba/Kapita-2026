import csv
import io

from django.http import HttpResponse
from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from .models import Feedback
from .serializers import FeedbackSubmitSerializer, FeedbackAdminSerializer


# ---------------------------------------------------------------------------
# User-facing endpoints
# ---------------------------------------------------------------------------

class FeedbackSubmitView(generics.CreateAPIView):
    """POST /api/feedback/ — authenticated user submits feedback."""
    serializer_class = FeedbackSubmitSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {'detail': 'Thank you! Your feedback has been submitted.'},
            status=status.HTTP_201_CREATED,
        )


class MyFeedbackListView(generics.ListAPIView):
    """GET /api/feedback/mine/ — list the current user's own submissions."""
    serializer_class = FeedbackSubmitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Feedback.objects.filter(user=self.request.user)


# ---------------------------------------------------------------------------
# Admin-facing endpoints
# ---------------------------------------------------------------------------

class AdminFeedbackListView(generics.ListAPIView):
    """GET /api/feedback/admin/ — list all feedback (admin only).

    Query params:
      - status: new | reviewed | resolved
      - category: bug | feature | ux | performance | general
      - search: searches title, message, username, email
    """
    serializer_class = FeedbackAdminSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'status', 'rating', 'category']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Feedback.objects.select_related('user').all()
        status_filter = self.request.query_params.get('status')
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search', '').strip()

        if status_filter:
            qs = qs.filter(status=status_filter)
        if category:
            qs = qs.filter(category=category)
        if search:
            qs = qs.filter(
                title__icontains=search
            ) | qs.filter(
                message__icontains=search
            ) | qs.filter(
                user__username__icontains=search
            ) | qs.filter(
                user__email__icontains=search
            )
        return qs


class AdminFeedbackDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/feedback/admin/<id>/ — admin manages a single entry."""
    serializer_class = FeedbackAdminSerializer
    permission_classes = [IsAdminUser]
    queryset = Feedback.objects.select_related('user').all()
    http_method_names = ['get', 'patch', 'delete']


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_feedback_export_csv(request):
    """GET /api/feedback/admin/export/csv/ — export all feedback as CSV."""
    qs = Feedback.objects.select_related('user').all().order_by('-created_at')

    status_filter = request.query_params.get('status')
    category = request.query_params.get('category')
    if status_filter:
        qs = qs.filter(status=status_filter)
    if category:
        qs = qs.filter(category=category)

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="kapita_feedback.csv"'

    writer = csv.writer(response)
    writer.writerow([
        'ID', 'Date', 'Username', 'Email', 'Business',
        'Category', 'Rating', 'Title', 'Message', 'Page', 'Status', 'Admin Notes',
    ])
    for fb in qs:
        writer.writerow([
            fb.id,
            fb.created_at.strftime('%Y-%m-%d %H:%M'),
            fb.user.username,
            fb.user.email,
            fb.user.business_name or '',
            fb.get_category_display(),
            fb.rating or '',
            fb.title,
            fb.message,
            fb.page or '',
            fb.get_status_display(),
            fb.admin_notes or '',
        ])
    return response


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_feedback_stats(request):
    """GET /api/feedback/admin/stats/ — summary counts for the admin dashboard."""
    total = Feedback.objects.count()
    by_status = {
        s: Feedback.objects.filter(status=s).count()
        for s, _ in Feedback.STATUS_CHOICES
    }
    by_category = {
        c: Feedback.objects.filter(category=c).count()
        for c, _ in Feedback.CATEGORY_CHOICES
    }
    return Response({
        'total': total,
        'by_status': by_status,
        'by_category': by_category,
    })
