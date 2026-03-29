from rest_framework import serializers
from .models import ExplorationResult, ECGResult, AudiometryResult, VisionTestResult, SpirometryResult


class ExplorationResultSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source="worker.full_name", read_only=True)
    class Meta:
        model = ExplorationResult
        fields = "__all__"
        read_only_fields = ["performed_by", "validated_by", "validated_at"]


class ECGSerializer(serializers.ModelSerializer):
    exploration = ExplorationResultSerializer(read_only=True)
    class Meta:
        model = ECGResult
        fields = "__all__"


class AudiometrySerializer(serializers.ModelSerializer):
    exploration = ExplorationResultSerializer(read_only=True)
    class Meta:
        model = AudiometryResult
        fields = "__all__"


class VisionTestSerializer(serializers.ModelSerializer):
    exploration = ExplorationResultSerializer(read_only=True)
    class Meta:
        model = VisionTestResult
        fields = "__all__"


class SpirometrySerializer(serializers.ModelSerializer):
    exploration = ExplorationResultSerializer(read_only=True)
    class Meta:
        model = SpirometryResult
        fields = "__all__"
