from django.contrib import admin
from .models import Appointment, AppointmentType

@admin.register(AppointmentType)
class AppointmentTypeAdmin(admin.ModelAdmin):
    list_display = ["name", "duration_minutes", "color_hex"]

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ["worker", "doctor", "scheduled_at", "status"]
    list_filter = ["status", "appointment_type"]
    search_fields = ["worker__last_name", "worker__matricule"]
