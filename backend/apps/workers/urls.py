from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, JobPositionViewSet, WorkerViewSet

router = DefaultRouter()
router.register("departments", DepartmentViewSet, basename="departments")
router.register("job-positions", JobPositionViewSet, basename="job-positions")
router.register("workers", WorkerViewSet, basename="workers")

urlpatterns = [path("", include(router.urls))]
