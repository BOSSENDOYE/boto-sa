from rest_framework import serializers
from .models import Department, JobPosition, Worker, CurriculumLaboris, WorkerImportLog


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class JobPositionSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = JobPosition
        fields = '__all__'


class CurriculumLaborisSerializer(serializers.ModelSerializer):
    class Meta:
        model = CurriculumLaboris
        fields = '__all__'
        read_only_fields = ['worker']


class WorkerListSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    job_position_title = serializers.CharField(source='job_position.title', read_only=True)
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Worker
        fields = ['id', 'matricule', 'full_name', 'first_name', 'last_name',
                  'gender', 'department_name', 'job_position_title',
                  'contract_type', 'is_active', 'photo']


class WorkerDetailSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    job_position_title = serializers.CharField(source='job_position.title', read_only=True)
    full_name = serializers.ReadOnlyField()
    curriculum_laboris = CurriculumLaborisSerializer(many=True, read_only=True)

    class Meta:
        model = Worker
        fields = '__all__'


class WorkerImportLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerImportLog
        fields = '__all__'
        read_only_fields = ['imported_by', 'imported_at']
