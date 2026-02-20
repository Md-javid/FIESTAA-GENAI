"""
api/serializers.py — DRF serializers for API models
"""
from rest_framework import serializers
from .models import Patient, CodingHistory, AIQuery


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Patient
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class CodingHistorySerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True, default=None)

    class Meta:
        model  = CodingHistory
        fields = [
            'id', 'patient', 'patient_name', 'clinical_note',
            'generated_codes', 'status', 'tokens_used', 'processing_ms', 'created_at',
        ]
        read_only_fields = ['user', 'created_at']


class AIQuerySerializer(serializers.ModelSerializer):
    class Meta:
        model  = AIQuery
        fields = ['id', 'query_type', 'prompt', 'response', 'created_at']
        read_only_fields = ['user', 'created_at']
