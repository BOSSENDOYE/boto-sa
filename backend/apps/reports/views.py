from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Sum
from datetime import date, datetime, timedelta
from apps.medical_acts.models import ClinicalEncounter, RapidDiagnosticTest
from apps.consultations.models import WorkAccident
from apps.workers.models import Worker
from .models import GeneratedReport
from .serializers import GeneratedReportSerializer


class DashboardView(viewsets.ViewSet):
    def list(self, request):
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)

        enc_today = ClinicalEncounter.objects.filter(encounter_date=today, is_deleted=False)
        enc_week = ClinicalEncounter.objects.filter(encounter_date__gte=week_start, is_deleted=False)
        enc_month = ClinicalEncounter.objects.filter(encounter_date__gte=month_start, is_deleted=False)
        today_start = datetime.combine(today, datetime.min.time())
        today_end = today_start + timedelta(days=1)
        rdt_today = RapidDiagnosticTest.objects.filter(performed_at__gte=today_start, performed_at__lt=today_end)
        accidents_month = WorkAccident.objects.filter(accident_date__gte=month_start)

        return Response({
            'today': {
                'total_encounters': enc_today.count(),
                'consultations': enc_today.filter(encounter_type='CONSULTATION').count(),
                'medical_visits': enc_today.filter(encounter_type='MEDICAL_VISIT').count(),
                'emergencies': enc_today.filter(encounter_type='EMERGENCY').count(),
                'rdts': rdt_today.count(),
                'rdt_positive': rdt_today.filter(result='POSITIVE').count(),
            },
            'this_week': {
                'total_encounters': enc_week.count(),
            },
            'this_month': {
                'total_encounters': enc_month.count(),
                'work_accidents': accidents_month.count(),
                'lost_work_days': accidents_month.aggregate(total=Sum('lost_work_days'))['total'] or 0,
                'accidents_with_stop': accidents_month.filter(lost_work_days__gt=0).count(),
                'accidents_without_stop': accidents_month.filter(lost_work_days=0).count(),
                'active_workers': Worker.objects.filter(is_active=True).count(),
            }
        })

    @action(detail=False, methods=['get'], url_path='charts')
    def charts(self, request):
        today = date.today()
        start = request.query_params.get('start', str(today - timedelta(days=30)))
        end = request.query_params.get('end', str(today))
        qs = ClinicalEncounter.objects.filter(encounter_date__gte=start, encounter_date__lte=end, is_deleted=False)
        by_type = list(qs.values('encounter_type').annotate(count=Count('id')).order_by('-count'))
        by_day = list(qs.values('encounter_date').annotate(count=Count('id')).order_by('encounter_date'))
        rdts = RapidDiagnosticTest.objects.filter(performed_at__date__gte=start, performed_at__date__lte=end)
        rdt_by_type = list(rdts.values('test_type', 'result').annotate(count=Count('id')))
        return Response({'by_type': by_type, 'by_day': by_day, 'rdt_stats': rdt_by_type})


class GeneratedReportViewSet(viewsets.ModelViewSet):
    queryset = GeneratedReport.objects.all()
    serializer_class = GeneratedReportSerializer

    def perform_create(self, serializer):
        serializer.save(generated_by=self.request.user)
