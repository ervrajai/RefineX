from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DatasetAnalysisView,
    GraphRecommendationView,
    GraphValidationView,
    GraphGenerationView,
    GraphExportView,
    GraphCodeView,
    HistoryViewSet
)

router = DefaultRouter()
router.register("history", HistoryViewSet, basename="visualization-history")

urlpatterns = [
    path("", include(router.urls)),
    path("analyze/<int:dataset_id>/", DatasetAnalysisView.as_view(), name="dataset-analyze"),
    path("recommend/<int:dataset_id>/", GraphRecommendationView.as_view(), name="graph-recommend"),
    path("validate/", GraphValidationView.as_view(), name="graph-validate"),
    path("generate/", GraphGenerationView.as_view(), name="graph-generate"),
    path("export/", GraphExportView.as_view(), name="graph-export"),
    path("code/", GraphCodeView.as_view(), name="graph-code"),
]