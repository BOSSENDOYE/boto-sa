from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from .models import MedicalVisit, UrineExam, PhysicalExamination, AptitudeCertificate
from .serializers import (MedicalVisitSerializer, UrineExamSerializer,
    PhysicalExamSerializer, AptitudeCertificateSerializer)


class MedicalVisitViewSet(viewsets.ModelViewSet):
    queryset = MedicalVisit.objects.select_related("encounter__worker", "encounter__doctor").all()
    serializer_class = MedicalVisitSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["encounter__worker", "visit_type"]
    ordering_fields = ["created_at"]

    @action(detail=True, methods=["get", "post", "put"])
    def urine_exam(self, request, pk=None):
        visit = self.get_object()
        if request.method == "GET":
            try:
                return Response(UrineExamSerializer(visit.urine_exam).data)
            except UrineExam.DoesNotExist:
                return Response({})
        instance = getattr(visit, "urine_exam", None)
        s = UrineExamSerializer(instance, data=request.data, partial=(request.method=="PUT"))
        s.is_valid(raise_exception=True)
        s.save(medical_visit=visit)
        return Response(s.data, status=200 if instance else 201)

    @action(detail=True, methods=["get", "post", "put"])
    def physical_exam(self, request, pk=None):
        visit = self.get_object()
        if request.method == "GET":
            try:
                return Response(PhysicalExamSerializer(visit.physical_exam).data)
            except PhysicalExamination.DoesNotExist:
                return Response({})
        instance = getattr(visit, "physical_exam", None)
        s = PhysicalExamSerializer(instance, data=request.data, partial=(request.method=="PUT"))
        s.is_valid(raise_exception=True)
        s.save(medical_visit=visit)
        return Response(s.data)

    @action(detail=True, methods=["get", "post"])
    def aptitude_certificate(self, request, pk=None):
        visit = self.get_object()
        if request.method == "GET":
            try:
                return Response(AptitudeCertificateSerializer(visit.aptitude_certificate).data)
            except AptitudeCertificate.DoesNotExist:
                return Response({})
        s = AptitudeCertificateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save(medical_visit=visit, signed_by=request.user)
        return Response(s.data, status=201)
