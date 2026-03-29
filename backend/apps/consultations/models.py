from django.db import models
from apps.accounts.models import User
from apps.workers.models import Worker
from apps.medical_acts.models import ClinicalEncounter, VitalSigns


class Consultation(models.Model):
    encounter = models.OneToOneField(ClinicalEncounter, on_delete=models.CASCADE, related_name="consultation")
    chief_complaint = models.TextField()
    disease_history = models.TextField(blank=True)
    family_history = models.TextField(blank=True)
    personal_history = models.TextField(blank=True)
    vital_signs = models.ForeignKey(VitalSigns, on_delete=models.SET_NULL, null=True, blank=True)
    physical_exam_findings = models.TextField(blank=True)
    systems_review = models.JSONField(default=dict, blank=True)
    working_diagnosis = models.TextField(blank=True)
    final_diagnosis = models.TextField(blank=True)
    icd10_code = models.CharField(max_length=20, blank=True)
    treatment_plan = models.TextField(blank=True)
    referral_needed = models.BooleanField(default=False)
    referral_note = models.TextField(blank=True)
    follow_up_date = models.DateField(null=True, blank=True)
    sick_leave_days = models.IntegerField(null=True, blank=True)
    work_restriction = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Consultation"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Consultation --- {self.encounter.worker}"


class WorkAccident(models.Model):
    class Severity(models.TextChoices):
        MINOR = "MINOR", "Benin"
        MODERATE = "MODERATE", "Modere"
        SEVERE = "SEVERE", "Grave"
        FATAL = "FATAL", "Fatal"

    worker = models.ForeignKey(Worker, on_delete=models.PROTECT, related_name="work_accidents")
    consultation = models.ForeignKey(Consultation, on_delete=models.SET_NULL, null=True, blank=True)
    accident_date = models.DateField()
    declaration_date = models.DateField(auto_now_add=True)
    location = models.CharField(max_length=300)
    circumstance = models.TextField()
    body_part_injured = models.CharField(max_length=200)
    injury_type = models.CharField(max_length=200)
    severity = models.CharField(max_length=10, choices=Severity.choices, default=Severity.MINOR)
    lost_work_days = models.IntegerField(default=0)
    return_to_work_date = models.DateField(null=True, blank=True)
    is_recognized = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Accident de travail"
        ordering = ["-accident_date"]

    def __str__(self):
        return f"AT --- {self.worker} --- {self.accident_date}"
