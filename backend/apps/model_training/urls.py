from django.urls import path
from .views import (
    DatasetMLUploadView,
    DatasetMLTrainView,
    DatasetMLJobStatusView,
    DatasetMLJobDetailView,
    DatasetMLHistoryView,
    DatasetMLJobActionsView,
    DatasetMLDownloadView,
    DatasetMLPredictView
)

urlpatterns = [
    path("upload/", DatasetMLUploadView.as_view(), name="ml-upload"),
    path("<int:pk>/train/", DatasetMLTrainView.as_view(), name="ml-train"),
    path("jobs/<int:pk>/status/", DatasetMLJobStatusView.as_view(), name="ml-job-status"),
    path("jobs/<int:pk>/", DatasetMLJobDetailView.as_view(), name="ml-job-detail"),
    path("history/", DatasetMLHistoryView.as_view(), name="ml-history"),
    path("jobs/<int:pk>/actions/", DatasetMLJobActionsView.as_view(), name="ml-job-actions"),
    path("jobs/<int:pk>/download/", DatasetMLDownloadView.as_view(), name="ml-job-download"),
    path("jobs/<int:pk>/predict/", DatasetMLPredictView.as_view(), name="ml-job-predict"),
]