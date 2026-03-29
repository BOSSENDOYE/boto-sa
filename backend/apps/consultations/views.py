from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Consultation, WorkAccident
from .serializers import ConsultationSerializer, WorkAccidentSerializer


class ConsultationViewSet(viewsets.ModelViewSet):
    queryset = Consultation.objects.select_related("encounter__worker", "encounter__doctor").all()
    serializer_class = ConsultationSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["encounter__worker", "referral_needed"]
    search_fields = ["chief_complaint", "final_diagnosis", "encounter__worker__last_name"]
    ordering_fields = ["created_at"]

    @action(detail=True, methods=["post"])
    def validate(self, request, pk=None):
        consultation = self.get_object()
        consultation.encounter.status = "VALIDATED"
        consultation.encounter.save()
        return Response({"detail": "Consultation validee."})


class WorkAccidentViewSet(viewsets.ModelViewSet):
    queryset = WorkAccident.objects.select_related("worker").all()
    serializer_class = WorkAccidentSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["worker", "severity", "is_recognized"]
    search_fields = ["worker__last_name", "worker__matricule", "location"]
    ordering_fields = ["accident_date"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
