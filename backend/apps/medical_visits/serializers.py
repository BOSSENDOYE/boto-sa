from rest_framework import serializers
from .models import MedicalVisit, UrineExam, PhysicalExamination, AptitudeCertificate


class UrineExamSerializer(serializers.ModelSerializer):
    class Meta:
        model = UrineExam
        fields = "__all__"
        read_only_fields = ["medical_visit"]


class PhysicalExamSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhysicalExamination
        fields = "__all__"
        read_only_fields = ["medical_visit"]


class AptitudeCertificateSerializer(serializers.ModelSerializer):
    signed_by_name = serializers.CharField(source="signed_by.full_name", read_only=True)
    class Meta:
        model = AptitudeCertificate
        fields = "__all__"
        read_only_fields = ["medical_visit", "signed_by", "certificate_number"]


class MedicalVisitSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source="encounter.worker.full_name", read_only=True)
    worker_matricule = serializers.CharField(source="encounter.worker.matricule", read_only=True)
    urine_exam = UrineExamSerializer(read_only=True)
    physical_exam = PhysicalExamSerializer(read_only=True)
    aptitude_certificate = AptitudeCertificateSerializer(read_only=True)

    class Meta:
        model = MedicalVisit
        fields = "__all__"
