from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AppointmentViewSet, AppointmentTypeViewSet

router = DefaultRouter()
router.register("appointment-types", AppointmentTypeViewSet, basename="appointment-types")
router.register("appointments", AppointmentViewSet, basename="appointments")
urlpatterns = [path("", include(router.urls))]
