from rest_framework import serializers
from .models import GeneratedReport

class GeneratedReportSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.CharField(source='generated_by.full_name', read_only=True)
    class Meta:
        model = GeneratedReport
        fields = '__all__'
        read_only_fields = ['generated_by', 'generated_at', 'status', 'data_snapshot']
