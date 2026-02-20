"""
accounts/models.py — Custom User model with DOCTOR / HOSPITAL roles
"""
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.ADMIN)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    DOCTOR = 'doctor'
    HOSPITAL = 'hospital'
    ADMIN = 'admin'

    ROLE_CHOICES = [
        (DOCTOR,   'Doctor'),
        (HOSPITAL, 'Hospital System'),
        (ADMIN,    'Administrator'),
    ]

    # ── core fields ──────────────────────────────────────────────────────────
    email      = models.EmailField(unique=True)
    full_name  = models.CharField(max_length=255)
    role       = models.CharField(max_length=20, choices=ROLE_CHOICES, default=DOCTOR)

    # ── doctor-specific ───────────────────────────────────────────────────────
    specialty        = models.CharField(max_length=100, blank=True)
    license_number   = models.CharField(max_length=50, blank=True)
    registration_id  = models.CharField(max_length=50, blank=True)  # ABDM

    # ── hospital-specific ─────────────────────────────────────────────────────
    hospital_name    = models.CharField(max_length=255, blank=True)
    hospital_type    = models.CharField(max_length=100, blank=True)
    facility_id      = models.CharField(max_length=100, blank=True)

    # ── shared profile ────────────────────────────────────────────────────────
    phone            = models.CharField(max_length=20, blank=True)
    city             = models.CharField(max_length=100, blank=True)
    state            = models.CharField(max_length=100, blank=True)
    avatar_url       = models.URLField(blank=True)
    is_verified      = models.BooleanField(default=False)

    # ── Django internals ─────────────────────────────────────────────────────
    is_active        = models.BooleanField(default=True)
    is_staff         = models.BooleanField(default=False)
    date_joined      = models.DateTimeField(default=timezone.now)
    last_login       = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['full_name', 'role']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.full_name} ({self.role}) — {self.email}"

    @property
    def is_doctor(self):
        return self.role == self.DOCTOR

    @property
    def is_hospital(self):
        return self.role == self.HOSPITAL
