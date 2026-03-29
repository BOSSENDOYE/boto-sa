from django.db import models
from apps.accounts.models import User
from apps.workers.models import Worker


class AppointmentType(models.Model):
    name = models.CharField(max_length=100)
    duration_minutes = models.IntegerField(default=30)
    color_hex = models.CharField(max_length=7, default="#3B82F6")
    requires_preparation = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class Appointment(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "En attente"
        CONFIRMED = "CONFIRMED", "Confirme"
        IN_PROGRESS = "IN_PROGRESS", "En cours"
        COMPLETED = "COMPLETED", "Termine"
        CANCELLED = "CANCELLED", "Annule"
        NO_SHOW = "NO_SHOW", "Absent"

    worker = models.ForeignKey(Worker, on_delete=models.PROTECT, related_name="appointments")
    doctor = models.ForeignKey(User, on_delete=models.PROTECT, related_name="appointments")
    appointment_type = models.ForeignKey(AppointmentType, on_delete=models.SET_NULL, null=True)
    scheduled_at = models.DateTimeField()
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="appointments_created")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Rendez-vous"
        ordering = ["scheduled_at"]

    def __str__(self):
        return f"RV {self.worker}  {self.scheduled_at:%d/%m/%Y %H:%M}"
