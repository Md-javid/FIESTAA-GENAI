"""
api/serializers.py — DRF serializers for API models
"""
from rest_framework import serializers
from .models import Patient, CodingHistory, AIQuery, Medicine, PatientDataRequest, InsuranceClaim


class MedicineSerializer(serializers.ModelSerializer):
    prescribed_by_name = serializers.CharField(source='prescribed_by.full_name', read_only=True, default=None)

    class Meta:
        model = Medicine
        fields = [
            'id', 'patient', 'prescribed_by', 'prescribed_by_name',
            'name', 'dosage', 'frequency', 'duration', 'notes',
            'prescribed_date', 'is_active',
        ]
        read_only_fields = ['prescribed_by', 'prescribed_date']


class PatientSerializer(serializers.ModelSerializer):
    medicines = MedicineSerializer(many=True, read_only=True, source='prescribed_medicines')

    class Meta:
        model  = Patient
        fields = [
            'id', 'patient_id', 'name', 'age', 'gender', 'dob',
            'phone', 'email', 'address', 'diagnosis', 'allergies',
            'medications', 'blood_group', 'insurance_id', 'insurance_provider',
            'hospital', 'created_by', 'created_at', 'updated_at', 'medicines',
        ]
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


class PatientDataRequestSerializer(serializers.ModelSerializer):
    requesting_hospital_name = serializers.CharField(source='requesting_hospital.full_name', read_only=True)
    target_hospital_name     = serializers.CharField(source='target_hospital.full_name', read_only=True)

    class Meta:
        model = PatientDataRequest
        fields = [
            'id', 'requesting_hospital', 'requesting_hospital_name',
            'target_hospital', 'target_hospital_name',
            'patient_name', 'patient_id_hint', 'reason',
            'status', 'response_notes', 'created_at', 'updated_at',
        ]
        read_only_fields = ['requesting_hospital', 'status', 'response_notes', 'created_at', 'updated_at']


class InsuranceClaimSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)

    class Meta:
        model = InsuranceClaim
        fields = [
            'id', 'patient', 'patient_name', 'policy_number',
            'provider_name', 'coverage_amount', 'coverage_type',
            'expiry_date', 'status', 'verified_by', 'created_at',
        ]
        read_only_fields = ['verified_by', 'created_at']
