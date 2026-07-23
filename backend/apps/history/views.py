from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from apps.cleaning.models import CleaningJob
from apps.model_training.models import ModelTrainingJob
from apps.visualization.models import SavedGraph
from apps.cleaning.utils import make_json_safe

class CleaningHistoryView(APIView):
    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            clean_jobs = CleaningJob.objects.filter(user=request.user)
            ml_jobs = ModelTrainingJob.objects.filter(user=request.user, is_deleted=False)
            vis_graphs = SavedGraph.objects.filter(user=request.user)
        else:
            clean_jobs = CleaningJob.objects.all()
            ml_jobs = ModelTrainingJob.objects.filter(is_deleted=False)
            vis_graphs = SavedGraph.objects.none()

        results = []
        for job in clean_jobs:
            results.append({
                "id": job.id,
                "type": "cleaning",
                "dataset_id": job.dataset.id,
                "dataset_name": job.dataset.name,
                "created_at": job.created_at,
                "config": job.cleaning_config,
                "before_stats": job.before_stats,
                "after_stats": job.after_stats,
                "logs": job.logs
            })

        for job in ml_jobs:
            results.append({
                "id": job.id,
                "type": "training",
                "dataset_id": job.dataset.id,
                "dataset_name": job.dataset_name,
                "created_at": job.created_at,
                "target_column": job.target_column,
                "best_model_name": job.best_model_name,
                "best_model_score": job.best_model_score,
                "status": job.status,
                "evaluation_metrics": job.evaluation_metrics,
                "preprocessing_steps": job.preprocessing_steps,
                "hyperparameters": job.hyperparameters,
                "training_duration": job.training_duration,
                "notes": job.notes,
                "tags": job.tags
            })
            
        for graph in vis_graphs:
            results.append({
                "id": graph.id,
                "type": "visualization",
                "dataset_id": graph.dataset.id if graph.dataset else None,
                "dataset_name": graph.dataset_name,
                "created_at": graph.created_at,
                "graph_type": graph.graph_type,
                "library": graph.library,
                "config": graph.config,
                "python_code": graph.python_code,
                "preview_data": graph.preview_data,
                "download_count": graph.download_count,
                "is_favorite": graph.is_favorite
            })
            
        results.sort(key=lambda x: x["created_at"], reverse=True)
        return Response(make_json_safe(results), status=status.HTTP_200_OK)
