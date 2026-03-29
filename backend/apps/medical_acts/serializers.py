from rest_framework import serializers
from .models import ClinicalEncounter, VitalSigns, Medication, Dressing, RapidDiagnosticTest, Observation


class VitalSignsSerializer(serializers.ModelSerializer):
    class Meta:
        model = VitalSigns
        fields = '__all__'
        read_only_fields = ['encounter', 'recorded_at', 'bmi']


class MedicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medication
        fields = '__all__'
        read_only_fields = ['encounter', 'prescribed_by']


class DressingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dressing
        fields = '__all__'
        read_only_fields = ['encounter', 'performed_by']


class RDTSerializer(serializers.ModelSerializer):
    class Meta:
        model = RapidDiagnosticTest
        fields = '__all__'
        read_only_fields = ['encounter', 'performed_by', 'performed_at']


class ObservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Observation
        fields = '__all__'
        read_only_fields = ['encounter']


class ClinicalEncounterSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source='worker.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    vitals = VitalSignsSerializer(many=True, read_only=True)
    medications = MedicationSerializer(many=True, read_only=True)
    dressings = DressingSerializer(many=True, read_only=True)
    rdts = RDTSerializer(many=True, read_only=True)

    class Meta:
        model = ClinicalEncounter
        fields = '__all__'
