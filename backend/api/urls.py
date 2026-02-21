"""
api/urls.py — API endpoint routes (with hospital routes)
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('patients',          views.PatientViewSet,           basename='patient')
router.register('coding-history',    views.CodingHistoryViewSet,     basename='coding-history')
router.register('medicines',         views.MedicineViewSet,          basename='medicine')
router.register('data-requests',     views.PatientDataRequestViewSet, basename='data-request')
router.register('insurance',         views.InsuranceClaimViewSet,     basename='insurance')

urlpatterns = [
    path('', include(router.urls)),
    # AI endpoints
    path('generate-medical-codes/',  views.GenerateMedicalCodesView.as_view(),   name='generate-codes'),
    path('assign-code-to-patient/',  views.AssignCodeToPatientView.as_view(),     name='assign-code'),
    path('generate-summary/',        views.GenerateClinicalSummaryView.as_view(), name='generate-summary'),
    path('ai-assistant/',            views.AIAssistantView.as_view(),             name='ai-assistant'),
    path('fhir-compliance/',         views.FHIRComplianceView.as_view(),          name='fhir-compliance'),
    path('patient-risk/',            views.PatientRiskView.as_view(),             name='patient-risk'),
    # Analytics
    path('analytics/',               views.AnalyticsView.as_view(),               name='analytics'),
    # Hospital-specific
    path('hospital/dashboard/',      views.HospitalDashboardView.as_view(),       name='hospital-dashboard'),
    path('hospital/doctors/',        views.HospitalDoctorsView.as_view(),         name='hospital-doctors'),
    path('hospitals/',               views.ListHospitalsView.as_view(),           name='list-hospitals'),
]
