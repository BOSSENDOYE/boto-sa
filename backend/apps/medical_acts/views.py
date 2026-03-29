from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from .models import ClinicalEncounter, VitalSigns, Medication, Dressing, RapidDiagnosticTest
from .serializers import (ClinicalEncounterSerializer, VitalSignsSerializer,
    MedicationSerializer, DressingSerializer, RDTSerializer)


class ClinicalEncounterViewSet(viewsets.ModelViewSet):
    queryset = ClinicalEncounter.objects.filter(is_deleted=False).select_related('worker', 'doctor')
    serializer_class = ClinicalEncounterSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['worker', 'encounter_type', 'status', 'encounter_date']
    ordering_fields = ['encounter_date', 'created_at']

    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user)

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        obj.is_deleted = True
        obj.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post', 'get'])
    def vitals(self, request, pk=None):
        encounter = self.get_object()
        if request.method == 'GET':
            return Response(VitalSignsSerializer(encounter.vitals.all(), many=True).data)
        s = VitalSignsSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save(encounter=encounter)
        return Response(s.data, status=201)

    @action(detail=True, methods=['post', 'get'])
    def medications(self, request, pk=None):
        encounter = self.get_object()
        if request.method == 'GET':
            return Response(MedicationSerializer(encounter.medications.all(), many=True).data)
        s = MedicationSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save(encounter=encounter, prescribed_by=request.user)
        return Response(s.data, status=201)

    @action(detail=True, methods=['post', 'get'])
    def dressings(self, request, pk=None):
        encounter = self.get_object()
        if request.method == 'GET':
            return Response(DressingSerializer(encounter.dressings.all(), many=True).data)
        s = DressingSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save(encounter=encounter, performed_by=request.user)
        return Response(s.data, status=201)

    @action(detail=True, methods=['post', 'get'])
    def rdts(self, request, pk=None):
        encounter = self.get_object()
        if request.method == 'GET':
            return Response(RDTSerializer(encounter.rdts.all(), many=True).data)
        s = RDTSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save(encounter=encounter, performed_by=request.user)
        return Response(s.data, status=201)
