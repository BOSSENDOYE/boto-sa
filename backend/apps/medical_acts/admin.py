from django.contrib import admin
from .models import ClinicalEncounter, VitalSigns, Medication, Dressing, RapidDiagnosticTest, Observation

class VitalsInline(admin.TabularInline):
    model = VitalSigns
    extra = 0

class MedInline(admin.TabularInline):
    model = Medication
    extra = 0

@admin.register(ClinicalEncounter)
class ClinicalEncounterAdmin(admin.ModelAdmin):
    list_display = ['worker', 'doctor', 'encounter_type', 'encounter_date', 'status']
    list_filter = ['encounter_type', 'status', 'encounter_date']
    search_fields = ['worker__matricule', 'worker__last_name']
    inlines = [VitalsInline, MedInline]
