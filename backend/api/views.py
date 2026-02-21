"""
api/views.py — Main API views with Hospital-Scoped Multi-Tenancy
              Includes: Code Generation, Patients, Medicines, Data Requests, Insurance, Analytics
"""
import time
import uuid
import json
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import UserRateThrottle
from django.db.models import Count, Q
from django.utils import timezone
from django.http import HttpResponse
from datetime import timedelta

from .models import Patient, CodingHistory, AIQuery, Medicine, PatientDataRequest, InsuranceClaim
from .serializers import (
    PatientSerializer, CodingHistorySerializer, AIQuerySerializer,
    MedicineSerializer, PatientDataRequestSerializer, InsuranceClaimSerializer,
)
from . import gemini_service


# ──────────────────────────────────────────────────────────────────────────────
# THROTTLES
# ──────────────────────────────────────────────────────────────────────────────
class AIThrottle(UserRateThrottle):
    scope = 'ai_generation'


# ──────────────────────────────────────────────────────────────────────────────
# HELPER — resolve the set of user IDs whose data is visible to `request.user`
# ──────────────────────────────────────────────────────────────────────────────
def _get_visible_user_ids(user):
    """
    - Doctor  → only their own data
    - Hospital → their own + all affiliated doctors' data
    - Admin   → everyone (no filter applied separately)
    """
    if user.role == 'hospital':
        doctor_ids = list(
            user.affiliated_doctors.values_list('id', flat=True)
        )
        return [user.id] + doctor_ids
    return [user.id]


def _get_patient_hospital(user):
    """Get the hospital FK to assign when a patient is registered."""
    if user.role == 'hospital':
        return user
    elif user.role == 'doctor' and user.affiliated_hospital_id:
        return user.affiliated_hospital
    return None


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
                visible_ids = _get_visible_user_ids(request.user)
                patient = Patient.objects.get(
                    patient_id=patient_id,
                    created_by__in=visible_ids
                )
            except Patient.DoesNotExist:
                pass

        try:
            result = gemini_service.generate_medical_codes(clinical_note)

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
# ASSIGN GENERATED CODE TO PATIENT
# ──────────────────────────────────────────────────────────────────────────────
class AssignCodeToPatientView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Assign a generated coding session to a specific patient."""
        history_id = request.data.get('historyId')
        patient_id = request.data.get('patientId')

        if not history_id or not patient_id:
            return Response({'error': 'historyId and patientId are required.'}, status=400)

        try:
            visible_ids = _get_visible_user_ids(request.user)
            history = CodingHistory.objects.get(id=history_id, user__in=visible_ids)
            patient = Patient.objects.get(patient_id=patient_id, created_by__in=visible_ids)
            history.patient = patient
            history.save()
            return Response({'success': True, 'message': f'Code assigned to {patient.name}.'})
        except CodingHistory.DoesNotExist:
            return Response({'error': 'Coding history not found.'}, status=404)
        except Patient.DoesNotExist:
            return Response({'error': 'Patient not found.'}, status=404)


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
# PATIENT VIEWSET — hospital-scoped with report download
# ──────────────────────────────────────────────────────────────────────────────
class PatientViewSet(viewsets.ModelViewSet):
    serializer_class   = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Patient.objects.filter(
            created_by__in=_get_visible_user_ids(self.request.user)
        )
        # Filtering
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(patient_id__icontains=search) | Q(diagnosis__icontains=search))

        date_from = self.request.query_params.get('date_from')
        date_to   = self.request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        sort = self.request.query_params.get('sort', '-created_at')
        if sort in ['name', '-name', 'created_at', '-created_at', 'age', '-age']:
            qs = qs.order_by(sort)
        return qs

    def perform_create(self, serializer):
        # Auto-generate a unique patient_id if not provided
        patient_id = self.request.data.get('patient_id')
        if not patient_id:
            patient_id = f"P-{uuid.uuid4().hex[:6].upper()}"
        hospital = _get_patient_hospital(self.request.user)
        serializer.save(created_by=self.request.user, patient_id=patient_id, hospital=hospital)

    @action(detail=True, methods=['get'])
    def report(self, request, pk=None):
        """Download an overall patient report as plain text."""
        patient = self.get_object()
        medicines = patient.prescribed_medicines.all()
        coding_sessions = patient.coding_history.all()

        lines = [
            f"=== PATIENT REPORT ===",
            f"Name         : {patient.name}",
            f"Patient ID   : {patient.patient_id}",
            f"Age / Gender : {patient.age} / {patient.gender}",
            f"DOB          : {patient.dob or 'N/A'}",
            f"Phone        : {patient.phone or 'N/A'}",
            f"Email        : {patient.email or 'N/A'}",
            f"Address      : {patient.address or 'N/A'}",
            f"Blood Group  : {patient.blood_group or 'N/A'}",
            f"",
            f"--- Diagnosis ---",
            patient.diagnosis or 'None recorded',
            f"",
            f"--- Allergies ---",
            patient.allergies or 'None',
            f"",
            f"--- Medications ---",
            patient.medications or 'None',
            f"",
            f"--- Insurance ---",
            f"Policy ID    : {patient.insurance_id or 'N/A'}",
            f"Provider     : {patient.insurance_provider or 'N/A'}",
            f"",
            f"--- Prescribed Medicines ({medicines.count()}) ---",
        ]
        for m in medicines:
            lines.append(f"  • {m.name} | {m.dosage} | {m.frequency} | {m.duration} | Active: {m.is_active}")

        lines += [
            f"",
            f"--- Coding Sessions ({coding_sessions.count()}) ---",
        ]
        for s in coding_sessions[:10]:
            codes = s.generated_codes
            icd_codes = [c.get('code', '') for c in codes.get('icd_codes', [])]
            lines.append(f"  [{s.created_at.strftime('%Y-%m-%d')}] {s.status.upper()} | ICD: {', '.join(icd_codes)}")

        lines += [
            f"",
            f"Generated: {timezone.now().strftime('%Y-%m-%d %H:%M')}",
            f"System: MediCode AI — FIESTAA-GENAI",
        ]

        content = "\n".join(lines)
        response = HttpResponse(content, content_type='text/plain')
        response['Content-Disposition'] = f'attachment; filename="patient_report_{patient.patient_id}.txt"'
        return response

    @action(detail=False, methods=['get'])
    def export_all(self, request):
        """Export all patients as CSV."""
        import csv
        from io import StringIO
        patients = self.get_queryset()
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['Patient ID', 'Name', 'Age', 'Gender', 'DOB', 'Phone', 'Email', 'Diagnosis', 'Blood Group', 'Insurance ID', 'Created At'])
        for p in patients:
            writer.writerow([
                p.patient_id, p.name, p.age, p.gender, p.dob or '',
                p.phone, p.email, p.diagnosis, p.blood_group, p.insurance_id,
                p.created_at.strftime('%Y-%m-%d %H:%M'),
            ])
        response = HttpResponse(output.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="patients_export.csv"'
        return response


# ──────────────────────────────────────────────────────────────────────────────
# MEDICINE VIEWSET
# ──────────────────────────────────────────────────────────────────────────────
class MedicineViewSet(viewsets.ModelViewSet):
    serializer_class   = MedicineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        visible_ids = _get_visible_user_ids(self.request.user)
        qs = Medicine.objects.filter(patient__created_by__in=visible_ids)
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(prescribed_by=self.request.user)


# ──────────────────────────────────────────────────────────────────────────────
# CODING HISTORY — hospital-scoped with filter/sort/export
# ──────────────────────────────────────────────────────────────────────────────
class CodingHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class   = CodingHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = CodingHistory.objects.filter(
            user__in=_get_visible_user_ids(self.request.user)
        )
        # Search
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(clinical_note__icontains=search) |
                Q(patient__name__icontains=search) |
                Q(patient__patient_id__icontains=search)
            )
        # Date range
        date_from = self.request.query_params.get('date_from')
        date_to   = self.request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        # Sort
        sort = self.request.query_params.get('sort', '-created_at')
        if sort in ['created_at', '-created_at', 'status']:
            qs = qs.order_by(sort)
        return qs

    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export all coding history as CSV."""
        import csv
        from io import StringIO
        sessions = self.get_queryset()
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['Session ID', 'Patient', 'Patient ID', 'Status', 'ICD Codes', 'NAMASTE Codes', 'Created At'])
        for s in sessions:
            codes = s.generated_codes
            icd_codes  = ', '.join([c.get('code', '') for c in codes.get('icd_codes', [])])
            cpt_codes  = ', '.join([c.get('code', '') for c in codes.get('cpt_codes', [])])
            writer.writerow([
                s.id,
                s.patient.name if s.patient else 'N/A',
                s.patient.patient_id if s.patient else 'N/A',
                s.status,
                icd_codes,
                cpt_codes,
                s.created_at.strftime('%Y-%m-%d %H:%M'),
            ])
        response = HttpResponse(output.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="coding_history_export.csv"'
        return response


# ──────────────────────────────────────────────────────────────────────────────
# ANALYTICS DASHBOARD — personal (doctor-level)
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


# ──────────────────────────────────────────────────────────────────────────────
# HOSPITAL DASHBOARD — hospital-wide analytics (hospital role only)
# ──────────────────────────────────────────────────────────────────────────────
class HospitalDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role not in ('hospital', 'admin'):
            return Response({'error': 'Only hospital accounts can access this endpoint.'}, status=403)

        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        seven_days_ago  = now - timedelta(days=7)

        from accounts.models import User as UserModel
        if user.role == 'hospital':
            doctors_qs = UserModel.objects.filter(affiliated_hospital=user)
        else:
            doctors_qs = UserModel.objects.filter(role='doctor')

        doctor_ids   = list(doctors_qs.values_list('id', flat=True))
        all_user_ids = [user.id] + doctor_ids

        total_patients   = Patient.objects.filter(created_by__in=all_user_ids).count()
        new_this_month   = Patient.objects.filter(created_by__in=all_user_ids, created_at__gte=thirty_days_ago).count()
        new_this_week    = Patient.objects.filter(created_by__in=all_user_ids, created_at__gte=seven_days_ago).count()

        total_codes      = CodingHistory.objects.filter(user__in=all_user_ids).count()
        codes_this_month = CodingHistory.objects.filter(user__in=all_user_ids, created_at__gte=thirty_days_ago).count()
        all_history      = CodingHistory.objects.filter(user__in=all_user_ids)
        success_count    = all_history.filter(status='success').count()
        success_rate     = round((success_count / total_codes * 100) if total_codes > 0 else 100, 1)

        total_ai_queries = AIQuery.objects.filter(user__in=all_user_ids).count()
        total_medicines  = Medicine.objects.filter(patient__created_by__in=all_user_ids).count()

        doctor_stats = []
        for doc in doctors_qs.select_related():
            doc_patients = Patient.objects.filter(created_by=doc).count()
            doc_codes    = CodingHistory.objects.filter(user=doc).count()
            doc_queries  = AIQuery.objects.filter(user=doc).count()
            doctor_stats.append({
                'id':         doc.id,
                'name':       doc.full_name,
                'email':      doc.email,
                'specialty':  doc.specialty,
                'patients':   doc_patients,
                'codes_generated': doc_codes,
                'ai_queries': doc_queries,
                'last_login': doc.last_login.isoformat() if doc.last_login else None,
            })

        daily_activity = []
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            count = CodingHistory.objects.filter(
                user__in=all_user_ids,
                created_at__date=day.date()
            ).count()
            patient_count = Patient.objects.filter(
                created_by__in=all_user_ids,
                created_at__date=day.date()
            ).count()
            daily_activity.append({
                'date':     day.strftime('%a'),
                'codes':    count,
                'patients': patient_count,
            })

        gender_dist = (
            Patient.objects.filter(created_by__in=all_user_ids)
            .values('gender')
            .annotate(count=Count('id'))
        )
        gender_map = {g['gender']: g['count'] for g in gender_dist}

        # Pending data requests
        pending_requests = PatientDataRequest.objects.filter(
            target_hospital=user, status='pending'
        ).count()

        return Response({
            'hospital': {
                'name':         user.hospital_name or user.full_name,
                'type':         user.hospital_type,
                'facility_id':  user.facility_id,
                'city':         user.city,
                'state':        user.state,
                'hospital_code': user.hospital_code,
            },
            'overview': {
                'total_doctors':       len(doctor_ids),
                'total_patients':      total_patients,
                'new_patients_month':  new_this_month,
                'new_patients_week':   new_this_week,
                'total_codes':         total_codes,
                'codes_this_month':    codes_this_month,
                'total_ai_queries':    total_ai_queries,
                'success_rate':        success_rate,
                'total_medicines':     total_medicines,
                'pending_data_requests': pending_requests,
            },
            'daily_activity': daily_activity,
            'doctor_stats':   doctor_stats,
            'gender_distribution': {
                'male':   gender_map.get('M', 0),
                'female': gender_map.get('F', 0),
                'other':  gender_map.get('O', 0),
            },
        })


# ──────────────────────────────────────────────────────────────────────────────
# LIST HOSPITALS (for doctor registration dropdown)
# ──────────────────────────────────────────────────────────────────────────────
class ListHospitalsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from accounts.models import User as UserModel
        hospitals = UserModel.objects.filter(role='hospital').values('id', 'full_name', 'hospital_name', 'city', 'state', 'hospital_code')
        return Response({'hospitals': list(hospitals)})


# ──────────────────────────────────────────────────────────────────────────────
# LIST DOCTORS IN HOSPITAL (for hospital accounts)
# ──────────────────────────────────────────────────────────────────────────────
class HospitalDoctorsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role not in ('hospital', 'admin'):
            return Response({'error': 'Access denied.'}, status=403)

        from accounts.models import User as UserModel
        from accounts.serializers import UserSerializer
        if user.role == 'hospital':
            doctors = UserModel.objects.filter(affiliated_hospital=user)
        else:
            doctors = UserModel.objects.filter(role='doctor')

        return Response({'doctors': UserSerializer(doctors, many=True).data})

    def post(self, request):
        """Add/invite a doctor to this hospital by email."""
        user = request.user
        if user.role not in ('hospital', 'admin'):
            return Response({'error': 'Access denied.'}, status=403)

        from accounts.models import User as UserModel
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'error': 'Doctor email is required.'}, status=400)

        try:
            doctor = UserModel.objects.get(email=email, role='doctor')
            doctor.affiliated_hospital = user
            doctor.save()
            return Response({'success': True, 'message': f'Dr. {doctor.full_name} linked to your hospital.'})
        except UserModel.DoesNotExist:
            return Response({'error': f'No doctor found with email {email}.'}, status=404)


# ──────────────────────────────────────────────────────────────────────────────
# CROSS-HOSPITAL DATA REQUESTS
# ──────────────────────────────────────────────────────────────────────────────
class PatientDataRequestViewSet(viewsets.ModelViewSet):
    serializer_class   = PatientDataRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Hospital sees incoming requests; doctors/hospitals see their outgoing requests
        return PatientDataRequest.objects.filter(
            Q(requesting_hospital=user) | Q(target_hospital=user)
        )

    def perform_create(self, serializer):
        serializer.save(requesting_hospital=self.request.user)

    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        """Approve or reject an incoming data request."""
        data_request = self.get_object()
        if data_request.target_hospital != request.user:
            return Response({'error': 'You can only respond to requests targeted at your hospital.'}, status=403)

        new_status = request.data.get('status')
        if new_status not in ('approved', 'rejected', 'fulfilled'):
            return Response({'error': 'Invalid status. Use: approved, rejected, fulfilled.'}, status=400)

        data_request.status = new_status
        data_request.response_notes = request.data.get('response_notes', '')
        data_request.save()
        return Response({'success': True, 'status': new_status})


# ──────────────────────────────────────────────────────────────────────────────
# INSURANCE CLAIMS
# ──────────────────────────────────────────────────────────────────────────────
class InsuranceClaimViewSet(viewsets.ModelViewSet):
    serializer_class   = InsuranceClaimSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        visible_ids = _get_visible_user_ids(self.request.user)
        qs = InsuranceClaim.objects.filter(patient__created_by__in=visible_ids)
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Mark an insurance claim as verified."""
        claim = self.get_object()
        claim.status = 'active'
        claim.verified_by = request.user
        claim.save()
        return Response({'success': True, 'message': 'Insurance policy verified.'})
