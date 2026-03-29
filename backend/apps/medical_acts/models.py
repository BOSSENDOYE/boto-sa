from django.db import models
from apps.accounts.models import User
from apps.workers.models import Worker


class ClinicalEncounter(models.Model):
    class EncounterType(models.TextChoices):
        CONSULTATION = 'CONSULTATION', 'Consultation'
        MEDICAL_VISIT = 'MEDICAL_VISIT', 'Visite médicale'
        OBSERVATION = 'OBSERVATION', 'Mise en observation'
        EMERGENCY = 'EMERGENCY', 'Urgence'
        ACT = 'ACT', 'Acte infirmier'

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Brouillon'
        COMPLETED = 'COMPLETED', 'Complété'
        VALIDATED = 'VALIDATED', 'Validé'
        CANCELLED = 'CANCELLED', 'Annulé'

    worker = models.ForeignKey(Worker, on_delete=models.PROTECT, related_name='encounters')
    doctor = models.ForeignKey(User, on_delete=models.PROTECT, related_name='encounters_as_doctor')
    nurse = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='encounters_as_nurse')
    encounter_date = models.DateField(db_index=True)
    encounter_time = models.TimeField()
    encounter_type = models.CharField(max_length=20, choices=EncounterType.choices, db_index=True)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.DRAFT)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Rencontre clinique'
        ordering = ['-encounter_date', '-encounter_time']
        indexes = [models.Index(fields=['worker', 'encounter_date'])]

    def __str__(self):
        return f"{self.worker} — {self.get_encounter_type_display()} — {self.encounter_date}"


class VitalSigns(models.Model):
    encounter = models.ForeignKey(ClinicalEncounter, on_delete=models.CASCADE, related_name='vitals')
    recorded_at = models.DateTimeField(auto_now_add=True)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    height_cm = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    bmi = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    bp_systolic = models.IntegerField(null=True, blank=True)
    bp_diastolic = models.IntegerField(null=True, blank=True)
    heart_rate = models.IntegerField(null=True, blank=True)
    respiratory_rate = models.IntegerField(null=True, blank=True)
    temperature = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    oxygen_saturation = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Constantes'
        ordering = ['-recorded_at']

    def save(self, *args, **kwargs):
        if self.weight_kg and self.height_cm and self.height_cm > 0:
            h_m = float(self.height_cm) / 100
            self.bmi = round(float(self.weight_kg) / (h_m ** 2), 1)
        super().save(*args, **kwargs)


class Medication(models.Model):
    encounter = models.ForeignKey(ClinicalEncounter, on_delete=models.CASCADE, related_name='medications')
    drug_name = models.CharField(max_length=200)
    dosage = models.CharField(max_length=100)
    route = models.CharField(max_length=50)
    frequency = models.CharField(max_length=100)
    duration_days = models.IntegerField(null=True, blank=True)
    instructions = models.TextField(blank=True)
    prescribed_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='prescriptions')
    dispensed_at = models.DateTimeField(null=True, blank=True)
    dispensed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='dispensed_medications')

    class Meta:
        verbose_name = 'Médicament'
        ordering = ['drug_name']


class Dressing(models.Model):
    encounter = models.ForeignKey(ClinicalEncounter, on_delete=models.CASCADE, related_name='dressings')
    wound_location = models.CharField(max_length=200)
    wound_type = models.CharField(max_length=100)
    wound_size_cm = models.CharField(max_length=50, blank=True)
    dressing_type = models.CharField(max_length=100)
    products_used = models.TextField(blank=True)
    performed_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='dressings_performed')
    next_dressing_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Pansement'


class RapidDiagnosticTest(models.Model):
    class TestType(models.TextChoices):
        MALARIA = 'MALARIA', 'Paludisme'
        HIV = 'HIV', 'VIH'
        HEPATITIS_B = 'HEP_B', 'Hépatite B'
        HEPATITIS_C = 'HEP_C', 'Hépatite C'
        SYPHILIS = 'SYPHILIS', 'Syphilis'
        GLYCEMIA = 'GLYCEMIA', 'Glycémie'
        OTHER = 'OTHER', 'Autre'

    class Result(models.TextChoices):
        POSITIVE = 'POSITIVE', 'Positif'
        NEGATIVE = 'NEGATIVE', 'Négatif'
        INVALID = 'INVALID', 'Invalide'
        PENDING = 'PENDING', 'En attente'

    encounter = models.ForeignKey(ClinicalEncounter, on_delete=models.CASCADE, related_name='rdts')
    test_type = models.CharField(max_length=15, choices=TestType.choices)
    test_name = models.CharField(max_length=200, blank=True)
    result = models.CharField(max_length=10, choices=Result.choices, default=Result.PENDING)
    performed_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='rdts_performed')
    performed_at = models.DateTimeField(auto_now_add=True)
    lot_number = models.CharField(max_length=50, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'TDR'
        verbose_name_plural = 'Tests de diagnostic rapide'


class Observation(models.Model):
    class Outcome(models.TextChoices):
        DISCHARGED = 'DISCHARGED', 'Sorti'
        REFERRED = 'REFERRED', 'Référé'
        HOSPITALIZED = 'HOSPITALIZED', 'Hospitalisé'

    encounter = models.OneToOneField(ClinicalEncounter, on_delete=models.CASCADE, related_name='observation')
    reason = models.TextField()
    clinical_notes = models.TextField(blank=True)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField(null=True, blank=True)
    outcome = models.CharField(max_length=15, choices=Outcome.choices, null=True, blank=True)
    referred_to = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Observation'
