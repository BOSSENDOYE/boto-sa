from django.db import models
from apps.accounts.models import User
from apps.workers.models import Worker
from apps.medical_acts.models import ClinicalEncounter, VitalSigns


class MedicalVisit(models.Model):
    class VisitType(models.TextChoices):
        EMBAUCHE = "EMBAUCHE", "A l'embauche"
        PERIODIQUE = "PERIODIQUE", "Periodique"
        REPRISE = "REPRISE", "Reprise de travail"
        SPONTANEE = "SPONTANEE", "Spontanee"
        DEPART = "DEPART", "Depart"

    encounter = models.OneToOneField(ClinicalEncounter, on_delete=models.CASCADE, related_name="medical_visit")
    visit_type = models.CharField(max_length=15, choices=VisitType.choices)
    vital_signs = models.ForeignKey(VitalSigns, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Visite medicale"
        ordering = ["-created_at"]

    def __str__(self):
        return f"VM {self.get_visit_type_display()} - {self.encounter.worker}"


class UrineExam(models.Model):
    class Quantity(models.TextChoices):
        ABSENT = "ABSENT", "Absent"
        TRACES = "TRACES", "Traces"
        PLUS1 = "+", "+"
        PLUS2 = "++", "++"
        PLUS3 = "+++", "+++"

    medical_visit = models.OneToOneField(MedicalVisit, on_delete=models.CASCADE, related_name="urine_exam")
    glucose = models.CharField(max_length=10, choices=Quantity.choices, default="ABSENT")
    proteins = models.CharField(max_length=10, choices=Quantity.choices, default="ABSENT")
    blood = models.CharField(max_length=10, choices=Quantity.choices, default="ABSENT")
    leukocytes = models.CharField(max_length=10, choices=Quantity.choices, default="ABSENT")
    nitrites = models.CharField(max_length=5, choices=[("POS","Positif"),("NEG","Negatif")], default="NEG")
    ph = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    specific_gravity = models.CharField(max_length=10, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = "Examen des urines"


class PhysicalExamination(models.Model):
    medical_visit = models.OneToOneField(MedicalVisit, on_delete=models.CASCADE, related_name="physical_exam")
    cardiovascular = models.TextField(blank=True)
    respiratory = models.TextField(blank=True)
    abdominal = models.TextField(blank=True)
    neurological = models.TextField(blank=True)
    musculoskeletal = models.TextField(blank=True)
    skin_examination = models.TextField(blank=True)
    ent_examination = models.TextField(blank=True)
    ophthalmological = models.TextField(blank=True)
    dental_notes = models.TextField(blank=True)
    other_findings = models.TextField(blank=True)

    class Meta:
        verbose_name = "Examen physique"


class AptitudeCertificate(models.Model):
    class Aptitude(models.TextChoices):
        APT = "APT", "Apte"
        APT_RESTRICTED = "APT_R", "Apte avec restrictions"
        TEMP_INAPT = "TEMP_INAPT", "Inapte temporaire"
        INAPT = "INAPT", "Inapte"

    medical_visit = models.OneToOneField(MedicalVisit, on_delete=models.CASCADE, related_name="aptitude_certificate")
    aptitude = models.CharField(max_length=15, choices=Aptitude.choices)
    restrictions = models.TextField(blank=True)
    next_visit_date = models.DateField(null=True, blank=True)
    valid_until = models.DateField(null=True, blank=True)
    certificate_number = models.CharField(max_length=50, unique=True)
    signed_by = models.ForeignKey(User, on_delete=models.PROTECT)
    signed_at = models.DateTimeField(auto_now_add=True)
    pdf_file = models.FileField(upload_to="certificates/", null=True, blank=True)

    class Meta:
        verbose_name = "Bulletin d'aptitude"
        ordering = ["-signed_at"]

    def save(self, *args, **kwargs):
        if not self.certificate_number:
            import uuid
            self.certificate_number = f"APT-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)
