from django.contrib import admin
from .models import Consultation, WorkAccident

@admin.register(Consultation)
class ConsultationAdmin(admin.ModelAdmin):
    list_display = ["encounter", "chief_complaint", "final_diagnosis"]
    search_fields = ["encounter__worker__last_name", "chief_complaint"]

@admin.register(WorkAccident)
class WorkAccidentAdmin(admin.ModelAdmin):
    list_display = ["worker", "accident_date", "severity", "lost_work_days"]
    list_filter = ["severity", "is_recognized"]
