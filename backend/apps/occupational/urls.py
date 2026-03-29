from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobSheetViewSet, WorkRiskViewSet, SMSViewSet, JobVisitReportViewSet, ActivityViewSet

router = DefaultRouter()
router.register("job-sheets", JobSheetViewSet, basename="job-sheets")
router.register("work-risks", WorkRiskViewSet, basename="work-risks")
router.register("sms", SMSViewSet, basename="sms")
router.register("job-visits", JobVisitReportViewSet, basename="job-visits")
router.register("activities", ActivityViewSet, basename="activities")
urlpatterns = [path("", include(router.urls))]
