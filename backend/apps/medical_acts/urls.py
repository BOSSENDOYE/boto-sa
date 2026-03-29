from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClinicalEncounterViewSet

router = DefaultRouter()
router.register('encounters', ClinicalEncounterViewSet, basename='encounters')
urlpatterns = [path('', include(router.urls))]
