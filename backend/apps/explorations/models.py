from django.db import models
from apps.accounts.models import User
from apps.workers.models import Worker
from apps.medical_visits.models import MedicalVisit


class ExplorationResult(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "En attente"
        COMPLETED = "COMPLETED", "Complété"
        VALIDATED = "VALIDATED", "Validé"
        ABNORMAL = "ABNORMAL", "Anormal"

    worker = models.ForeignKey(Worker, on_delete=models.PROTECT, related_name="explorations")
    medical_visit = models.ForeignKey(MedicalVisit, on_delete=models.SET_NULL, null=True, blank=True, related_name="explorations")
    performed_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="explorations_done")
    performed_date = models.DateField()
    validated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="explorations_validated")
    validated_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    notes = models.TextField(blank=True)
    file_upload = models.FileField(upload_to="explorations/", null=True, blank=True)

    class Meta:
        verbose_name = "Résultat d'exploration"
        ordering = ["-performed_date"]


class ECGResult(models.Model):
    class Interpretation(models.TextChoices):
        NORMAL = "NORMAL", "Normal"
        SINUS_TACHY = "SINUS_TACHY", "Tachycardie sinusale"
        SINUS_BRADY = "SINUS_BRADY", "Bradycardie sinusale"
        AF = "AF", "Fibrillation auriculaire"
        BBB = "BBB", "Bloc de branche"
        LVH = "LVH", "Hypertrophie VG"
        OTHER = "OTHER", "Autre"

    exploration = models.OneToOneField(ExplorationResult, on_delete=models.CASCADE, related_name="ecg")
    heart_rate = models.IntegerField(null=True, blank=True)
    rhythm = models.CharField(max_length=100, blank=True)
    pr_interval_ms = models.IntegerField(null=True, blank=True)
    qrs_duration_ms = models.IntegerField(null=True, blank=True)
    qt_interval_ms = models.IntegerField(null=True, blank=True)
    axis_degrees = models.IntegerField(null=True, blank=True)
    interpretation = models.CharField(max_length=15, choices=Interpretation.choices, default=Interpretation.NORMAL)
    interpretation_text = models.TextField(blank=True)
    machine_used = models.CharField(max_length=100, blank=True)

    class Meta:
        verbose_name = "ECG"


class AudiometryResult(models.Model):
    class Interpretation(models.TextChoices):
        NORMAL = "NORMAL", "Normal"
        MILD = "MILD", "Léger"
        MODERATE = "MODERATE", "Modéré"
        SEVERE = "SEVERE", "Sévère"
        PROFOUND = "PROFOUND", "Profond"

    exploration = models.OneToOneField(ExplorationResult, on_delete=models.CASCADE, related_name="audiometry")
    ear = models.CharField(max_length=10, choices=[("LEFT","Gauche"),("RIGHT","Droite"),("BILATERAL","Bilatéral")], default="BILATERAL")
    thresholds_right = models.JSONField(default=dict, help_text="{500:dB, 1000:dB, 2000:dB, 4000:dB, 8000:dB}")
    thresholds_left = models.JSONField(default=dict)
    interpretation = models.CharField(max_length=15, choices=Interpretation.choices, default=Interpretation.NORMAL)
    scotoma_notch = models.BooleanField(default=False, help_text="Encoche 4kHz (surdité professionnelle)")

    class Meta:
        verbose_name = "Audiométrie"


class VisionTestResult(models.Model):
    exploration = models.OneToOneField(ExplorationResult, on_delete=models.CASCADE, related_name="vision_test")
    right_eye_distance = models.CharField(max_length=20, blank=True)
    left_eye_distance = models.CharField(max_length=20, blank=True)
    right_eye_near = models.CharField(max_length=20, blank=True)
    left_eye_near = models.CharField(max_length=20, blank=True)
    color_vision = models.CharField(max_length=20, choices=[("NORMAL","Normal"),("DALTONISME","Daltonisme"),("OTHER","Autre")], default="NORMAL")
    depth_perception = models.BooleanField(default=True)
    requires_correction = models.BooleanField(default=False)
    correction_type = models.CharField(max_length=20, choices=[("NONE","Aucune"),("GLASSES","Lunettes"),("CONTACTS","Lentilles")], default="NONE")

    class Meta:
        verbose_name = "Visiotest"


class SpirometryResult(models.Model):
    class Interpretation(models.TextChoices):
        NORMAL = "NORMAL", "Normal"
        OBSTRUCTIVE = "OBS", "Obstruction"
        RESTRICTIVE = "REST", "Restriction"
        MIXED = "MIXED", "Mixte"

    exploration = models.OneToOneField(ExplorationResult, on_delete=models.CASCADE, related_name="spirometry")
    fvc_liters = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    fev1_liters = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    fev1_fvc_ratio = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    pef_liters_s = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    pre_bronchodilator = models.BooleanField(default=True)
    interpretation = models.CharField(max_length=10, choices=Interpretation.choices, default=Interpretation.NORMAL)
    severity = models.CharField(max_length=15, choices=[("MILD","Léger"),("MODERATE","Modéré"),("SEVERE","Sévère"),("NA","N/A")], default="NA")

    class Meta:
        verbose_name = "Spirométrie"
