from django.urls import path
from .views import (
    DatasetUploadView,
    DatasetAnalyzeView,
    DatasetCleanView,
    DatasetDecideView,
    DatasetResetView,
    DatasetDownloadView,
    DatasetPreviewView,
    GuestUploadAndCleanView,
    GuestSessionView,
)

urlpatterns = [
    path("guest/upload-and-clean/", GuestUploadAndCleanView.as_view(), name="guest-upload-and-clean"),
    path("guest/session/", GuestSessionView.as_view(), name="guest-session"),
    path("upload/", DatasetUploadView.as_view(), name="dataset-upload"),
    path("<int:pk>/analyze/", DatasetAnalyzeView.as_view(), name="dataset-analyze"),
    path("<int:pk>/clean/", DatasetCleanView.as_view(), name="dataset-clean"),
    path("<int:pk>/decide/", DatasetDecideView.as_view(), name="dataset-decide"),
    path("<int:pk>/reset/", DatasetResetView.as_view(), name="dataset-reset"),
    path("<int:pk>/download/", DatasetDownloadView.as_view(), name="dataset-download"),
    path("<int:pk>/preview/", DatasetPreviewView.as_view(), name="dataset-preview"),
]