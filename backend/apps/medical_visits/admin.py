from django.contrib import admin
from .models import MedicalVisit, UrineExam, PhysicalExamination, AptitudeCertificate

class UrineInline(admin.StackedInline):
    model = UrineExam
    extra = 0

class PhysicalInline(admin.StackedInline):
    model = PhysicalExamination
    extra = 0

class AptitudeInline(admin.StackedInline):
    model = AptitudeCertificate
    extra = 0

@admin.register(MedicalVisit)
class MedicalVisitAdmin(admin.ModelAdmin):
    list_display = ["encounter", "visit_type", "created_at"]
    list_filter = ["visit_type"]
    inlines = [UrineInline, PhysicalInline, AptitudeInline]
