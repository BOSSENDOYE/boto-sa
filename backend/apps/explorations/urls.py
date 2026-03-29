from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExplorationResultViewSet, ECGViewSet, AudiometryViewSet, VisionTestViewSet, SpirometryViewSet

router = DefaultRouter()
router.register("explorations", ExplorationResultViewSet, basename="explorations")
router.register("explorations/ecg", ECGViewSet, basename="ecg")
router.register("explorations/audiometry", AudiometryViewSet, basename="audiometry")
router.register("explorations/vision", VisionTestViewSet, basename="vision")
router.register("explorations/spirometry", SpirometryViewSet, basename="spirometry")
urlpatterns = [path("", include(router.urls))]
