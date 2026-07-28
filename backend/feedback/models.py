from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Feedback(models.Model):
    CATEGORY_CHOICES = [
        ('bug', 'Bug Report'),
        ('feature', 'Feature Request'),
        ('ux', 'User Experience'),
        ('performance', 'Performance'),
        ('general', 'General'),
    ]

    RATING_CHOICES = [
        (1, '1 - Very Poor'),
        (2, '2 - Poor'),
        (3, '3 - Average'),
        (4, '4 - Good'),
        (5, '5 - Excellent'),
    ]

    STATUS_NEW = 'new'
    STATUS_REVIEWED = 'reviewed'
    STATUS_RESOLVED = 'resolved'
    STATUS_CHOICES = [
        (STATUS_NEW, 'New'),
        (STATUS_REVIEWED, 'Reviewed'),
        (STATUS_RESOLVED, 'Resolved'),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='feedback_submissions'
    )
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES, null=True, blank=True)
    title = models.CharField(max_length=150)
    message = models.TextField()
    page = models.CharField(
        max_length=255, blank=True,
        help_text='The page/section the user was on when submitting feedback'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_NEW)
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'feedback'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f'[{self.get_category_display()}] {self.title} — {self.user.username}'
