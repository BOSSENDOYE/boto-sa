from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DashboardView, GeneratedReportViewSet

router = DefaultRouter()
router.register('dashboard', DashboardView, basename='dashboard')
router.register('reports', GeneratedReportViewSet, basename='reports')
urlpatterns = [path('', include(router.urls))]
