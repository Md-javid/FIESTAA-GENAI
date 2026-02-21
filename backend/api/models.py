"""
api/models.py — Data models for coding history, patients, AI queries,
                 medicines, data requests, and insurance
"""
from django.db import models
from django.conf import settings


class Patient(models.Model):
    """Patient record — linked to the creating user (doctor or hospital)."""
    created_by   = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patients')
    hospital     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='hospital_patients', limit_choices_to={'role': 'hospital'})
    patient_id   = models.CharField(max_length=50, unique=True)
    name         = models.CharField(max_length=255)
    age          = models.PositiveIntegerField()
    gender       = models.CharField(max_length=20, choices=[('M','Male'),('F','Female'),('O','Other')])
    dob          = models.DateField(null=True, blank=True)
    phone        = models.CharField(max_length=20, blank=True)
    email        = models.EmailField(blank=True)
    address      = models.TextField(blank=True)
    diagnosis    = models.TextField(blank=True)
    allergies    = models.TextField(blank=True)
    medications  = models.TextField(blank=True)
    blood_group  = models.CharField(max_length=5, blank=True)
    insurance_id = models.CharField(max_length=100, blank=True)
    insurance_provider = models.CharField(max_length=255, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.patient_id})"


class Medicine(models.Model):
    """Medicines prescribed to a patient."""
    patient      = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='prescribed_medicines')
    prescribed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='prescriptions')
    name         = models.CharField(max_length=255)
    dosage       = models.CharField(max_length=100, blank=True)
    frequency    = models.CharField(max_length=100, blank=True)
    duration     = models.CharField(max_length=100, blank=True)
    notes        = models.TextField(blank=True)
    prescribed_date = models.DateField(auto_now_add=True)
    is_active    = models.BooleanField(default=True)

    class Meta:
        ordering = ['-prescribed_date']

    def __str__(self):
        return f"{self.name} → {self.patient.name}"


class PatientDataRequest(models.Model):
    """Cross-hospital patient data sharing requests."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('fulfilled', 'Fulfilled'),
    ]
    requesting_hospital = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='outgoing_data_requests',
        limit_choices_to={'role__in': ['hospital', 'doctor']}
    )
    target_hospital     = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='incoming_data_requests',
        limit_choices_to={'role': 'hospital'}
    )
    patient_name        = models.CharField(max_length=255)
    patient_id_hint     = models.CharField(max_length=100, blank=True, help_text='Known patient ID or DOB hint')
    reason              = models.TextField()
    status              = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    response_notes      = models.TextField(blank=True)
    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Request from {self.requesting_hospital} for {self.patient_name}"


class InsuranceClaim(models.Model):
    """Insurance policy lookup/claim for a patient."""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('pending', 'Pending Verification'),
        ('claimed', 'Claimed'),
    ]
    patient          = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='insurance_claims')
    policy_number    = models.CharField(max_length=100)
    provider_name    = models.CharField(max_length=255)
    coverage_amount  = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    coverage_type    = models.CharField(max_length=100, blank=True)
    expiry_date      = models.DateField(null=True, blank=True)
    status           = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    verified_by      = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='verified_claims'
    )
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.policy_number} — {self.patient.name}"


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
