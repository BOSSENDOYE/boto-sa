from rest_framework import serializers
from .models import Consultation, WorkAccident


class ConsultationSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source="encounter.worker.full_name", read_only=True)
    worker_matricule = serializers.CharField(source="encounter.worker.matricule", read_only=True)
    encounter_date = serializers.DateField(source="encounter.encounter_date", read_only=True)
    doctor_name = serializers.CharField(source="encounter.doctor.full_name", read_only=True)

    class Meta:
        model = Consultation
        fields = "__all__"


class WorkAccidentSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source="worker.full_name", read_only=True)
    worker_matricule = serializers.CharField(source="worker.matricule", read_only=True)

    class Meta:
        model = WorkAccident
        fields = "__all__"
        read_only_fields = ["created_by", "declaration_date"]
