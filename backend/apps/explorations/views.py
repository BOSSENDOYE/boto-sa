from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from django.utils import timezone
from .models import ExplorationResult, ECGResult, AudiometryResult, VisionTestResult, SpirometryResult
from .serializers import (ExplorationResultSerializer, ECGSerializer,
    AudiometrySerializer, VisionTestSerializer, SpirometrySerializer)


class ExplorationResultViewSet(viewsets.ModelViewSet):
    queryset = ExplorationResult.objects.select_related("worker", "performed_by").all()
    serializer_class = ExplorationResultSerializer

    def perform_create(self, serializer):
        serializer.save(performed_by=self.request.user)

    @action(detail=True, methods=["post"])
    def validate(self, request, pk=None):
        obj = self.get_object()
        obj.validated_by = request.user
        obj.validated_at = timezone.now()
        obj.status = "VALIDATED"
        obj.save()
        return Response({"detail": "Exploration validee."})

    @action(detail=True, methods=["post"], parser_classes=[MultiPartParser])
    def upload(self, request, pk=None):
        obj = self.get_object()
        obj.file_upload = request.FILES.get("file")
        obj.save()
        return Response({"detail": "Fichier enregistre."})


def make_sub_viewset(SubModel, SubSerializer):
    class SubViewSet(viewsets.ModelViewSet):
        queryset = SubModel.objects.select_related("exploration__worker").all()
        serializer_class = SubSerializer
    return SubViewSet

ECGViewSet = make_sub_viewset(ECGResult, ECGSerializer)
AudiometryViewSet = make_sub_viewset(AudiometryResult, AudiometrySerializer)
VisionTestViewSet = make_sub_viewset(VisionTestResult, VisionTestSerializer)
SpirometryViewSet = make_sub_viewset(SpirometryResult, SpirometrySerializer)
