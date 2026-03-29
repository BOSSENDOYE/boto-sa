from rest_framework import serializers
from .models import Appointment, AppointmentType


class AppointmentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppointmentType
        fields = "__all__"


class AppointmentSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source="worker.full_name", read_only=True)
    doctor_name = serializers.CharField(source="doctor.full_name", read_only=True)
    appointment_type_name = serializers.CharField(source="appointment_type.name", read_only=True)
    class Meta:
        model = Appointment
        fields = "__all__"
        read_only_fields = ["created_by"]
