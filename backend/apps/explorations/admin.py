from django.contrib import admin
from .models import ExplorationResult, ECGResult, AudiometryResult, VisionTestResult, SpirometryResult

@admin.register(ExplorationResult)
class ExplorationAdmin(admin.ModelAdmin):
    list_display = ["worker", "performed_date", "status", "performed_by"]
    list_filter = ["status"]
    search_fields = ["worker__last_name", "worker__matricule"]
