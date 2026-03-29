from django.contrib import admin
from .models import Department, JobPosition, Worker, CurriculumLaboris, WorkerImportLog

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'manager_name']
    search_fields = ['name', 'code']

@admin.register(JobPosition)
class JobPositionAdmin(admin.ModelAdmin):
    list_display = ['code', 'title', 'department', 'risk_level']
    list_filter = ['department', 'risk_level']

class CurriculumInline(admin.TabularInline):
    model = CurriculumLaboris
    extra = 0

@admin.register(Worker)
class WorkerAdmin(admin.ModelAdmin):
    list_display = ['matricule', 'full_name', 'department', 'job_position', 'is_active']
    list_filter = ['department', 'contract_type', 'is_active']
    search_fields = ['matricule', 'first_name', 'last_name']
    inlines = [CurriculumInline]

@admin.register(WorkerImportLog)
class WorkerImportLogAdmin(admin.ModelAdmin):
    list_display = ['file_name', 'imported_by', 'success_count', 'error_count', 'status']
    readonly_fields = ['imported_at', 'errors']
