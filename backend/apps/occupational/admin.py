from django.contrib import admin
from .models import JobSheet, WorkRisk, SpecialMedicalSurveillance, JobVisitReport, MedicalServiceActivity

@admin.register(JobSheet)
class JobSheetAdmin(admin.ModelAdmin):
    list_display = ["job_position", "version", "is_current", "overall_risk_level", "created_by"]
    list_filter = ["is_current", "overall_risk_level"]

@admin.register(SpecialMedicalSurveillance)
class SMSAdmin(admin.ModelAdmin):
    list_display = ["worker", "risk_type", "risk_agent", "review_date", "status"]
    list_filter = ["risk_type", "status"]
    search_fields = ["worker__last_name", "risk_agent"]

@admin.register(JobVisitReport)
class JobVisitAdmin(admin.ModelAdmin):
    list_display = ["job_position", "visited_by", "visit_date"]
    search_fields = ["job_position__title"]

@admin.register(MedicalServiceActivity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ["title", "activity_type", "activity_date", "participants_count"]
    list_filter = ["activity_type"]
