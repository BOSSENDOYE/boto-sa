from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from .models import JobSheet, WorkRisk, SpecialMedicalSurveillance, JobVisitReport, MedicalServiceActivity
from .serializers import (JobSheetSerializer, WorkRiskSerializer, SMSSerializer,
    JobVisitReportSerializer, ActivitySerializer)


class JobSheetViewSet(viewsets.ModelViewSet):
    queryset = JobSheet.objects.select_related("job_position", "created_by").all()
    serializer_class = JobSheetSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["job_position", "is_current", "overall_risk_level"]
    search_fields = ["job_position__title"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        obj = self.get_object()
        obj.approved_by = request.user
        obj.save()
        return Response({"detail": "Fiche approuvee."})


class WorkRiskViewSet(viewsets.ModelViewSet):
    queryset = WorkRisk.objects.select_related("job_position").all()
    serializer_class = WorkRiskSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["job_position", "risk_type", "risk_level"]


class SMSViewSet(viewsets.ModelViewSet):
    queryset = SpecialMedicalSurveillance.objects.select_related("worker", "assigned_doctor").all()
    serializer_class = SMSSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ["worker", "risk_type", "status"]
    search_fields = ["worker__last_name", "risk_agent"]

    @action(detail=False, methods=["get"])
    def due_today(self, request):
        from datetime import date
        today = date.today()
        qs = self.queryset.filter(review_date__lte=today, status="ACTIVE")
        return Response(SMSSerializer(qs, many=True).data)


class JobVisitReportViewSet(viewsets.ModelViewSet):
    queryset = JobVisitReport.objects.select_related("job_position", "visited_by").all()
    serializer_class = JobVisitReportSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["job_position", "visit_date"]
    ordering_fields = ["visit_date", "created_at"]

    def perform_create(self, serializer):
        serializer.save(visited_by=self.request.user)


class ActivityViewSet(viewsets.ModelViewSet):
    queryset = MedicalServiceActivity.objects.all()
    serializer_class = ActivitySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["activity_type", "activity_date"]
    search_fields = ["title", "location"]
    ordering_fields = ["activity_date"]

    def perform_create(self, serializer):
        serializer.save(conducted_by=self.request.user)
