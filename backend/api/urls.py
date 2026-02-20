"""
api/urls.py — API endpoint routes
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('patients',       views.PatientViewSet,       basename='patient')
router.register('coding-history', views.CodingHistoryViewSet,  basename='coding-history')

urlpatterns = [
    path('', include(router.urls)),
    # AI endpoints
    path('generate-medical-codes/',  views.GenerateMedicalCodesView.as_view(),   name='generate-codes'),
    path('generate-summary/',        views.GenerateClinicalSummaryView.as_view(), name='generate-summary'),
    path('ai-assistant/',            views.AIAssistantView.as_view(),             name='ai-assistant'),
    path('fhir-compliance/',         views.FHIRComplianceView.as_view(),          name='fhir-compliance'),
    path('patient-risk/',            views.PatientRiskView.as_view(),             name='patient-risk'),
    # Analytics
    path('analytics/',               views.AnalyticsView.as_view(),              name='analytics'),
]
