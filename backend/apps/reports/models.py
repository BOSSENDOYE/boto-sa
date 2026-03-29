from django.db import models
from apps.accounts.models import User


class GeneratedReport(models.Model):
    class ReportType(models.TextChoices):
        DAILY = 'DAILY', 'Quotidien'
        WEEKLY = 'WEEKLY', 'Hebdomadaire'
        MONTHLY = 'MONTHLY', 'Mensuel'
        CUSTOM = 'CUSTOM', 'Personnalise'

    name = models.CharField(max_length=200)
    report_type = models.CharField(max_length=10, choices=ReportType.choices)
    period_start = models.DateField()
    period_end = models.DateField()
    file = models.FileField(upload_to='reports/', null=True, blank=True)
    format = models.CharField(max_length=5, choices=[('PDF','PDF'),('EXCEL','Excel')], default='PDF')
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    data_snapshot = models.JSONField(default=dict)
    status = models.CharField(max_length=15, default='PENDING',
        choices=[('PENDING','En attente'),('GENERATING','Generation'),('READY','Pret'),('FAILED','Echec')])

    class Meta:
        verbose_name = 'Rapport genere'
        ordering = ['-generated_at']
