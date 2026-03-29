from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from .models import Appointment, AppointmentType
from .serializers import AppointmentSerializer, AppointmentTypeSerializer


class AppointmentTypeViewSet(viewsets.ModelViewSet):
    queryset = AppointmentType.objects.all()
    serializer_class = AppointmentTypeSerializer


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.select_related("worker", "doctor").all()
    serializer_class = AppointmentSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["worker", "doctor", "status", "appointment_type"]
    ordering_fields = ["scheduled_at"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        obj = self.get_object()
        obj.status = "CONFIRMED"
        obj.save()
        return Response({"detail": "RV confirme."})

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        obj = self.get_object()
        obj.status = "CANCELLED"
        obj.save()
        return Response({"detail": "RV annule."})

    @action(detail=True, methods=["post"])
    def start(self, request, pk=None):
        obj = self.get_object()
        obj.status = "IN_PROGRESS"
        obj.save()
        return Response({"detail": "RV commence."})
