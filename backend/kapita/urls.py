"""
URL configuration for kapita project.
"""
from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static


def api_root(request):
    return JsonResponse({
        'name': 'Kapita API',
        'status': 'ok',
        'api_base': '/api/',
        'docs_hint': 'Use /api/auth/login/, /api/products/, etc.',
    })


urlpatterns = [
    path('', api_root),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/products/', include('products.urls')),
    path('api/sales/', include('sales.urls')),
    path('api/customers/', include('customers.urls')),
    path('api/credits/', include('credits.urls')),
    path('api/expenses/', include('expenses.urls')),
    path('api/reinvestments/', include('reinvestments.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/billing/', include('billing.urls')),
    path('api/personal/', include('personal_finance.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/promotions/', include('promotions.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/suppliers/', include('suppliers.urls')),
    path('api/purchase-orders/', include('purchase_orders.urls')),
    path('api/outgoing-payments/', include('outgoing_payments.urls')),
    path('api/quotations/', include('quotations.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
