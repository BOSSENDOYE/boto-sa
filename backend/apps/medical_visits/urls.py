from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MedicalVisitViewSet

router = DefaultRouter()
router.register("medical-visits", MedicalVisitViewSet, basename="medical-visits")
urlpatterns = [path("", include(router.urls))]
