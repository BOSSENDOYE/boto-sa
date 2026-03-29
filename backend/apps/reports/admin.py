from django.contrib import admin
from .models import GeneratedReport

@admin.register(GeneratedReport)
class GeneratedReportAdmin(admin.ModelAdmin):
    list_display = ['name', 'report_type', 'period_start', 'period_end', 'status']
    list_filter = ['report_type', 'status']
