"""
api/admin.py — Register API models in Django admin
"""
from django.contrib import admin
from .models import Patient, CodingHistory, AIQuery


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display  = ['patient_id', 'name', 'age', 'gender', 'created_by', 'created_at']
    list_filter   = ['gender', 'created_at']
    search_fields = ['name', 'patient_id', 'diagnosis']
    ordering      = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(CodingHistory)
class CodingHistoryAdmin(admin.ModelAdmin):
    list_display  = ['user', 'patient', 'status', 'processing_ms', 'created_at']
    list_filter   = ['status', 'created_at']
    search_fields = ['user__email', 'clinical_note']
    ordering      = ['-created_at']
    readonly_fields = ['created_at']


@admin.register(AIQuery)
class AIQueryAdmin(admin.ModelAdmin):
    list_display  = ['user', 'query_type', 'created_at']
    list_filter   = ['query_type', 'created_at']
    search_fields = ['user__email', 'prompt']
    ordering      = ['-created_at']
    readonly_fields = ['created_at']
