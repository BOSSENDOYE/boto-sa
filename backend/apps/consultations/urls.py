from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConsultationViewSet, WorkAccidentViewSet

router = DefaultRouter()
router.register("consultations", ConsultationViewSet, basename="consultations")
router.register("work-accidents", WorkAccidentViewSet, basename="work-accidents")
urlpatterns = [path("", include(router.urls))]
