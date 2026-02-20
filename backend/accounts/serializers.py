"""
accounts/serializers.py — Registration & Login serializers
"""
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User


# ──────────────────────────────────────────────────────────────────────────────
# USER PROFILE SERIALIZER (read/update)
# ──────────────────────────────────────────────────────────────────────────────
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'role',
            'specialty', 'license_number', 'registration_id',
            'hospital_name', 'hospital_type', 'facility_id',
            'phone', 'city', 'state', 'avatar_url',
            'is_verified', 'date_joined', 'last_login',
        ]
        read_only_fields = ['id', 'email', 'role', 'is_verified', 'date_joined', 'last_login']


# ──────────────────────────────────────────────────────────────────────────────
# REGISTER SERIALIZER
# ──────────────────────────────────────────────────────────────────────────────
class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, label='Confirm password', style={'input_type': 'password'})

    class Meta:
        model = User
        fields = [
            'email', 'full_name', 'role', 'password', 'password2',
            'specialty', 'license_number', 'registration_id',
            'hospital_name', 'hospital_type', 'facility_id',
            'phone', 'city', 'state',
        ]

    def validate(self, data):
        if data['password'] != data.pop('password2'):
            raise serializers.ValidationError({'password2': 'Passwords do not match.'})

        role = data.get('role', User.DOCTOR)
        if role == User.DOCTOR:
            if not data.get('license_number'):
                raise serializers.ValidationError({'license_number': 'License number is required for doctors.'})
        elif role == User.HOSPITAL:
            if not data.get('hospital_name'):
                raise serializers.ValidationError({'hospital_name': 'Hospital name is required.'})
        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


# ──────────────────────────────────────────────────────────────────────────────
# LOGIN SERIALIZER — returns access + refresh tokens
# ──────────────────────────────────────────────────────────────────────────────
class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, data):
        user = authenticate(username=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('This account has been disabled.')

        refresh = RefreshToken.for_user(user)
        return {
            'user': UserSerializer(user).data,
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
        }


# ──────────────────────────────────────────────────────────────────────────────
# CHANGE PASSWORD SERIALIZER
# ──────────────────────────────────────────────────────────────────────────────
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value
