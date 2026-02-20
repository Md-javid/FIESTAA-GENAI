"""
api/views.py — Main API views: Medical Codes, Patients, AI Assistant, Analytics
"""
import time
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import UserRateThrottle
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta

from .models import Patient, CodingHistory, AIQuery
from .serializers import PatientSerializer, CodingHistorySerializer, AIQuerySerializer
from . import gemini_service


# ──────────────────────────────────────────────────────────────────────────────
# THROTTLES
# ──────────────────────────────────────────────────────────────────────────────
class AIThrottle(UserRateThrottle):
    scope = 'ai_generation'


# ──────────────────────────────────────────────────────────────────────────────
# MEDICAL CODE GENERATION
# ──────────────────────────────────────────────────────────────────────────────
class GenerateMedicalCodesView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes   = [AIThrottle]

    def post(self, request):
        clinical_note = request.data.get('clinicalNote', '').strip()

        if not clinical_note:
            return Response({'error': 'clinicalNote is required.'}, status=400)
        if len(clinical_note) > 10000:
            return Response({'error': 'Clinical note too long (max 10,000 chars).'}, status=400)

        patient_id = request.data.get('patientId')
        patient = None
        if patient_id:
            try:
                patient = Patient.objects.get(patient_id=patient_id, created_by=request.user)
            except Patient.DoesNotExist:
                pass

        try:
            result = gemini_service.generate_medical_codes(clinical_note)

            # Save to history
            CodingHistory.objects.create(
                user=request.user,
                patient=patient,
                clinical_note=clinical_note,
                generated_codes=result,
                status='success',
                processing_ms=result.get('processing_ms', 0),
            )

            return Response({'success': True, 'data': result})

        except Exception as e:
            CodingHistory.objects.create(
                user=request.user,
                patient=patient,
                clinical_note=clinical_note,
                generated_codes={},
                status='error',
            )
            return Response({'error': str(e)}, status=500)


# ──────────────────────────────────────────────────────────────────────────────
# CLINICAL SUMMARY GENERATION
# ──────────────────────────────────────────────────────────────────────────────
class GenerateClinicalSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes   = [AIThrottle]

    def post(self, request):
        clinical_note = request.data.get('clinicalNote', '').strip()
        if not clinical_note:
            return Response({'error': 'clinicalNote is required.'}, status=400)
        try:
            result = gemini_service.generate_clinical_summary(clinical_note)
            return Response({'success': True, 'data': result})
        except Exception as e:
            return Response({'error': str(e)}, status=500)


# ──────────────────────────────────────────────────────────────────────────────
# AI ASSISTANT
# ──────────────────────────────────────────────────────────────────────────────
class AIAssistantView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes   = [AIThrottle]

    def post(self, request):
        prompt     = request.data.get('prompt', '').strip()
        query_type = request.data.get('queryType', 'general')

        if not prompt:
            return Response({'error': 'prompt is required.'}, status=400)

        try:
            answer = gemini_service.ai_assistant_query(prompt, query_type)
            AIQuery.objects.create(
                user=request.user,
                query_type=query_type,
                prompt=prompt,
                response=answer,
            )
            return Response({'success': True, 'answer': answer})
        except Exception as e:
            return Response({'error': str(e)}, status=500)


# ──────────────────────────────────────────────────────────────────────────────
# FHIR COMPLIANCE CHECK
# ──────────────────────────────────────────────────────────────────────────────
class FHIRComplianceView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes   = [AIThrottle]

    def post(self, request):
        fhir_resource = request.data.get('resource')
        if not fhir_resource:
            return Response({'error': 'resource is required.'}, status=400)
        try:
            result = gemini_service.check_fhir_compliance(fhir_resource)
            return Response({'success': True, 'data': result})
        except Exception as e:
            return Response({'error': str(e)}, status=500)


# ──────────────────────────────────────────────────────────────────────────────
# PATIENT RISK ANALYSIS
# ──────────────────────────────────────────────────────────────────────────────
class PatientRiskView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes   = [AIThrottle]

    def post(self, request):
        patient_data = request.data.get('patientData')
        if not patient_data:
            return Response({'error': 'patientData is required.'}, status=400)
        try:
            result = gemini_service.analyze_patient_risk(patient_data)
            return Response({'success': True, 'data': result})
        except Exception as e:
            return Response({'error': str(e)}, status=500)


# ──────────────────────────────────────────────────────────────────────────────
# PATIENT VIEWSET
# ──────────────────────────────────────────────────────────────────────────────
class PatientViewSet(viewsets.ModelViewSet):
    serializer_class   = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Patient.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# ──────────────────────────────────────────────────────────────────────────────
# CODING HISTORY
# ──────────────────────────────────────────────────────────────────────────────
class CodingHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class   = CodingHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CodingHistory.objects.filter(user=self.request.user)


# ──────────────────────────────────────────────────────────────────────────────
# ANALYTICS DASHBOARD DATA
# ──────────────────────────────────────────────────────────────────────────────
class AnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        now  = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        total_patients = Patient.objects.filter(created_by=user).count()
        total_codes    = CodingHistory.objects.filter(user=user).count()
        recent_codes   = CodingHistory.objects.filter(user=user, created_at__gte=thirty_days_ago).count()
        ai_queries     = AIQuery.objects.filter(user=user).count()

        # Last 7 days activity
        daily_activity = []
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            count = CodingHistory.objects.filter(
                user=user,
                created_at__date=day.date()
            ).count()
            daily_activity.append({
                'date':  day.strftime('%a'),
                'codes': count,
            })

        # Success rate
        history = CodingHistory.objects.filter(user=user)
        success  = history.filter(status='success').count()
        total    = history.count()
        success_rate = round((success / total * 100) if total > 0 else 100, 1)

        return Response({
            'overview': {
                'total_patients': total_patients,
                'total_codes_generated': total_codes,
                'codes_this_month': recent_codes,
                'ai_queries': ai_queries,
                'success_rate': success_rate,
            },
            'daily_activity': daily_activity,
            'user_role': user.role,
        })
