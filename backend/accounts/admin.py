"""
accounts/admin.py — Register custom User in Django admin
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display   = ['email', 'full_name', 'role', 'is_verified', 'date_joined']
    list_filter    = ['role', 'is_verified', 'is_staff', 'is_active']
    search_fields  = ['email', 'full_name', 'hospital_name']
    ordering       = ['-date_joined']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal', {'fields': ('full_name', 'role', 'phone', 'city', 'state', 'avatar_url')}),
        ('Doctor Fields', {'fields': ('specialty', 'license_number', 'registration_id')}),
        ('Hospital Fields', {'fields': ('hospital_name', 'hospital_type', 'facility_id')}),
        ('Status', {'fields': ('is_verified', 'is_active', 'is_staff', 'is_superuser')}),
        ('Permissions', {'fields': ('groups', 'user_permissions')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'role', 'password1', 'password2'),
        }),
    )
