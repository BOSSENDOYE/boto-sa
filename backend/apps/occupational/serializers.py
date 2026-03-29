from rest_framework import serializers
from .models import JobSheet, WorkRisk, SpecialMedicalSurveillance, JobVisitReport, MedicalServiceActivity


class JobSheetSerializer(serializers.ModelSerializer):
    job_position_title = serializers.CharField(source="job_position.title", read_only=True)
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)
    class Meta:
        model = JobSheet
        fields = "__all__"
        read_only_fields = ["created_by", "approved_by"]


class WorkRiskSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkRisk
        fields = "__all__"


class SMSSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source="worker.full_name", read_only=True)
    worker_matricule = serializers.CharField(source="worker.matricule", read_only=True)
    doctor_name = serializers.CharField(source="assigned_doctor.full_name", read_only=True)
    class Meta:
        model = SpecialMedicalSurveillance
        fields = "__all__"


class JobVisitReportSerializer(serializers.ModelSerializer):
    job_position_title = serializers.CharField(source="job_position.title", read_only=True)
    visited_by_name = serializers.CharField(source="visited_by.full_name", read_only=True)
    class Meta:
        model = JobVisitReport
        fields = "__all__"
        read_only_fields = ["visited_by"]


class ActivitySerializer(serializers.ModelSerializer):
    conducted_by_name = serializers.CharField(source="conducted_by.full_name", read_only=True)
    class Meta:
        model = MedicalServiceActivity
        fields = "__all__"
        read_only_fields = ["conducted_by"]
