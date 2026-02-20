"""
api/models.py — Data models for coding history, patients, AI queries
"""
from django.db import models
from django.conf import settings


class Patient(models.Model):
    """Patient record — linked to the creating user (doctor or hospital)."""
    created_by   = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patients')
    patient_id   = models.CharField(max_length=50, unique=True)
    name         = models.CharField(max_length=255)
    age          = models.PositiveIntegerField()
    gender       = models.CharField(max_length=20, choices=[('M','Male'),('F','Female'),('O','Other')])
    dob          = models.DateField(null=True, blank=True)
    diagnosis    = models.TextField(blank=True)
    allergies    = models.TextField(blank=True)
    medications  = models.TextField(blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.patient_id})"


class CodingHistory(models.Model):
    """Record of each AI medical-code generation."""
    STATUS_CHOICES = [('success','Success'), ('error','Error'), ('partial','Partial')]

    user           = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='coding_history')
    patient        = models.ForeignKey(Patient, on_delete=models.SET_NULL, null=True, blank=True, related_name='coding_history')
    clinical_note  = models.TextField()
    generated_codes= models.JSONField(default=dict)
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default='success')
    tokens_used    = models.PositiveIntegerField(default=0)
    processing_ms  = models.PositiveIntegerField(default=0)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Coding History Entry'
        verbose_name_plural = 'Coding History'

    def __str__(self):
        return f"{self.user.full_name} — {self.created_at.strftime('%Y-%m-%d %H:%M')}"


class AIQuery(models.Model):
    """Log of general AI assistant queries."""
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ai_queries')
    query_type = models.CharField(max_length=50, default='general')
    prompt     = models.TextField()
    response   = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.full_name} — {self.query_type} — {self.created_at.strftime('%Y-%m-%d')}"
