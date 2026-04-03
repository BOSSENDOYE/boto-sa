from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/', include('apps.workers.urls')),
    path('api/v1/', include('apps.appointments.urls')),
    path('api/v1/', include('apps.medical_acts.urls')),
    path('api/v1/', include('apps.consultations.urls')),
    path('api/v1/', include('apps.medical_visits.urls')),
    path('api/v1/', include('apps.explorations.urls')),
    path('api/v1/', include('apps.occupational.urls')),
    path('api/v1/', include('apps.reports.urls')),
    path('api/v1/', include('apps.notifications.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

admin.site.site_header = "Boto SA — Administration ERP Santé"
admin.site.site_title = "Boto SA Health ERP"
admin.site.index_title = "Tableau de bord administrateur"
