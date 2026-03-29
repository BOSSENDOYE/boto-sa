from django.db import models
from apps.accounts.models import User
from apps.workers.models import Worker, JobPosition


class JobSheet(models.Model):
    job_position = models.ForeignKey(JobPosition, on_delete=models.PROTECT, related_name="job_sheets")
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="job_sheets_created")
    version = models.IntegerField(default=1)
    is_current = models.BooleanField(default=True)
    task_list = models.JSONField(default=list, help_text="List of tasks with frequency and posture")
    tools_equipment = models.TextField(blank=True)
    work_environment = models.TextField(blank=True)
    work_schedule = models.TextField(blank=True)
    physical_risks = models.JSONField(default=list)
    chemical_risks = models.JSONField(default=list)
    biological_risks = models.JSONField(default=list)
    ergonomic_risks = models.JSONField(default=list)
    psychosocial_risks = models.JSONField(default=list)
    overall_risk_level = models.IntegerField(default=1, choices=[(1,"1"),(2,"2"),(3,"3"),(4,"4")])
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="job_sheets_approved")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Fiche de poste"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Fiche {self.job_position.title} v{self.version}"


class WorkRisk(models.Model):
    class RiskType(models.TextChoices):
        NOISE = "NOISE", "Bruit"
        CHEMICAL = "CHEMICAL", "Chimique"
        RADIATION = "RADIATION", "Rayonnement"
        BIOLOGICAL = "BIOLOGICAL", "Biologique"
        DUST = "DUST", "Poussiere"
        ERGONOMIC = "ERGONOMIC", "Ergonomique"
        PHYSICAL = "PHYSICAL", "Physique"
        PSYCHOSOCIAL = "PSYCHOSOCIAL", "Psychosocial"
        OTHER = "OTHER", "Autre"

    job_position = models.ForeignKey(JobPosition, on_delete=models.PROTECT, related_name="work_risks")
    risk_type = models.CharField(max_length=15, choices=RiskType.choices)
    risk_agent = models.CharField(max_length=200)
    risk_level = models.IntegerField(choices=[(1,"Faible"),(2,"Moyen"),(3,"Eleve"),(4,"Tres eleve")], default=1)
    preventive_measures = models.TextField(blank=True)
    ppe_required = models.TextField(blank=True)
    last_assessment_date = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = "Risque professionnel"
        ordering = ["-risk_level"]


class SpecialMedicalSurveillance(models.Model):
    class RiskType(models.TextChoices):
        NOISE = "NOISE", "Bruit"
        CHEMICAL = "CHEMICAL", "Chimique"
        RADIATION = "RADIATION", "Rayonnement"
        BIOLOGICAL = "BIOLOGICAL", "Biologique"
        DUST = "DUST", "Poussiere"
        ERGONOMIC = "ERGONOMIC", "Ergonomique"
        OTHER = "OTHER", "Autre"

    worker = models.ForeignKey(Worker, on_delete=models.PROTECT, related_name="sms_list")
    risk_type = models.CharField(max_length=15, choices=RiskType.choices)
    risk_agent = models.CharField(max_length=200)
    started_date = models.DateField()
    review_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    frequency_months = models.IntegerField(default=12)
    assigned_doctor = models.ForeignKey(User, on_delete=models.PROTECT)
    status = models.CharField(max_length=10, choices=[("ACTIVE","Active"),("SUSPENDED","Suspendue"),("ENDED","Terminee")], default="ACTIVE")
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = "Surveillance medicale speciale"
        ordering = ["review_date"]


class JobVisitReport(models.Model):
    job_position = models.ForeignKey(JobPosition, on_delete=models.PROTECT, related_name="visit_reports")
    visited_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="job_visits_done")
    visit_date = models.DateField()
    workers_present = models.ManyToManyField(Worker, blank=True)
    observations = models.TextField(blank=True)
    identified_risks = models.TextField(blank=True)
    recommendations = models.TextField(blank=True)
    action_items = models.JSONField(default=list)
    follow_up_date = models.DateField(null=True, blank=True)
    pdf_report = models.FileField(upload_to="job_visits/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Rapport de visite de poste"
        ordering = ["-visit_date"]

    def __str__(self):
        return f"Visite {self.job_position.title}  {self.visit_date}"


class MedicalServiceActivity(models.Model):
    class ActivityType(models.TextChoices):
        TEST = "TEST", "Test"
        AWARENESS = "AWARENESS", "Sensibilisation"
        TRAINING = "TRAINING", "Formation"
        JOB_VISIT = "JOB_VISIT", "Visite de poste"
        INSPECTION = "INSPECTION", "Inspection"
        MEDICAL_COVERAGE = "COVERAGE", "Couverture medicale"

    activity_type = models.CharField(max_length=15, choices=ActivityType.choices)
    title = models.CharField(max_length=300)
    activity_date = models.DateField()
    location = models.CharField(max_length=300, blank=True)
    participants_count = models.IntegerField(default=0)
    workers_involved = models.ManyToManyField(Worker, blank=True)
    description = models.TextField(blank=True)
    outcome = models.TextField(blank=True)
    conducted_by = models.ForeignKey(User, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Activite du service medical"
        ordering = ["-activity_date"]
