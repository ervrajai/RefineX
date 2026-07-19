from django.urls import path
from .views import (
    DatasetListView,
    VisualizationGenerateView,
    GenerateAllView,
    GraphRecommendationView,
    SavedGraphListView,
    SavedGraphDetailView,
)

urlpatterns = [
    path("datasets/", DatasetListView.as_view(), name="visualization-datasets"),
    path("<int:dataset_id>/generate/", VisualizationGenerateView.as_view(), name="visualization-generate"),
    path("<int:dataset_id>/generate-all/", GenerateAllView.as_view(), name="visualization-generate-all"),
    path("<int:dataset_id>/recommendations/", GraphRecommendationView.as_view(), name="visualization-recommendations"),
    path("history/", SavedGraphListView.as_view(), name="visualization-history"),
    path("history/<int:pk>/", SavedGraphDetailView.as_view(), name="visualization-history-detail"),
]