from django.db import models
from apps.accounts.models import User


class Department(models.Model):
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=20, unique=True)
    manager_name = models.CharField(max_length=150, blank=True)
    site_location = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Département'
        ordering = ['name']

    def __str__(self):
        return f"{self.code} — {self.name}"


class JobPosition(models.Model):
    class RiskLevel(models.TextChoices):
        LOW = 'LOW', 'Faible'
        MEDIUM = 'MEDIUM', 'Moyen'
        HIGH = 'HIGH', 'Élevé'
        VERY_HIGH = 'VERY_HIGH', 'Très élevé'

    title = models.CharField(max_length=200)
    code = models.CharField(max_length=30, unique=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='positions')
    description = models.TextField(blank=True)
    risk_level = models.CharField(max_length=10, choices=RiskLevel.choices, default=RiskLevel.LOW)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Poste de travail'
        ordering = ['title']

    def __str__(self):
        return f"{self.code} — {self.title}"


class Worker(models.Model):
    class Gender(models.TextChoices):
        M = 'M', 'Masculin'
        F = 'F', 'Féminin'

    class ContractType(models.TextChoices):
        CDI = 'CDI', 'CDI'
        CDD = 'CDD', 'CDD'
        INTERN = 'INTERN', 'Stagiaire'
        CONTRACTOR = 'CONTRACTOR', 'Sous-traitant'

    class BloodType(models.TextChoices):
        A_POS = 'A+', 'A+'
        A_NEG = 'A-', 'A-'
        B_POS = 'B+', 'B+'
        B_NEG = 'B-', 'B-'
        AB_POS = 'AB+', 'AB+'
        AB_NEG = 'AB-', 'AB-'
        O_POS = 'O+', 'O+'
        O_NEG = 'O-', 'O-'
        UNKNOWN = 'UNKNOWN', 'Inconnu'

    matricule = models.CharField(max_length=50, unique=True, db_index=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=Gender.choices)
    hire_date = models.DateField(null=True, blank=True)
    contract_type = models.CharField(max_length=15, choices=ContractType.choices, default=ContractType.CDI)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='workers')
    job_position = models.ForeignKey(JobPosition, on_delete=models.SET_NULL, null=True, related_name='workers')
    phone = models.CharField(max_length=20, blank=True)
    emergency_contact = models.CharField(max_length=150, blank=True)
    emergency_phone = models.CharField(max_length=20, blank=True)
    blood_type = models.CharField(max_length=10, choices=BloodType.choices, default=BloodType.UNKNOWN)
    known_allergies = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    photo = models.ImageField(upload_to='workers/', null=True, blank=True)
    imported_from_hr = models.BooleanField(default=False)
    hr_employee_id = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Travailleur'
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.matricule} — {self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class CurriculumLaboris(models.Model):
    worker = models.ForeignKey(Worker, on_delete=models.CASCADE, related_name='curriculum_laboris')
    employer_name = models.CharField(max_length=200)
    job_title = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    exposures = models.TextField(blank=True, help_text='Expositions: chimiques, physiques, biologiques')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Curriculum Laboris'
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.worker} — {self.job_title} @ {self.employer_name}"


class WorkerImportLog(models.Model):
    imported_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    file_name = models.CharField(max_length=255)
    row_count = models.IntegerField(default=0)
    success_count = models.IntegerField(default=0)
    error_count = models.IntegerField(default=0)
    errors = models.JSONField(default=list)
    imported_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='PENDING',
        choices=[('PENDING','En attente'),('PROCESSING','En cours'),('DONE','Terminé'),('FAILED','Échoué')])

    class Meta:
        verbose_name = "Import RH"
        ordering = ['-imported_at']
