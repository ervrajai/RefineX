from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import os
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from apps.accounts.views import CsrfExemptSessionAuthentication
from apps.cleaning.models import CleaningJob, Dataset
from apps.model_training.models import ModelTrainingJob
from apps.visualization.models import SavedGraph
from apps.cleaning.utils import make_json_safe

@method_decorator(csrf_exempt, name='dispatch')
class CleaningHistoryView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            clean_jobs = CleaningJob.objects.filter(user=request.user)
            ml_jobs = ModelTrainingJob.objects.filter(user=request.user, is_deleted=False)
            vis_graphs = SavedGraph.objects.filter(user=request.user, is_deleted=False)
        else:
            clean_jobs = CleaningJob.objects.all()
            ml_jobs = ModelTrainingJob.objects.filter(is_deleted=False)
            vis_graphs = SavedGraph.objects.filter(is_deleted=False)

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
                "name": graph.name or "Saved Visualization",
                "graph_name": graph.name or "Saved Visualization",
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

    def delete(self, request, item_id=None, *args, **kwargs):
        """
        Deletes all execution history records OR a specific history item by ID & type,
        erasing physical files from local PC storage.
        """
        target_id = item_id or request.query_params.get("item_id")
        item_type = request.query_params.get("type")

        # Single item deletion
        if target_id and item_type:
            if item_type == "cleaning":
                job = CleaningJob.objects.filter(id=target_id).first()
                if job:
                    ds = job.dataset
                    if ds:
                        if ds.original_file and ds.original_file.name and os.path.isfile(ds.original_file.path):
                            try:
                                os.remove(ds.original_file.path)
                            except Exception:
                                pass
                        if ds.cleaned_file and ds.cleaned_file.name and os.path.isfile(ds.cleaned_file.path):
                            try:
                                os.remove(ds.cleaned_file.path)
                            except Exception:
                                pass
                        ds.delete()
                    else:
                        job.delete()
                    return Response({"detail": "Cleaning record and associated files deleted successfully."}, status=status.HTTP_200_OK)
                return Response({"detail": "Cleaning record not found."}, status=status.HTTP_404_NOT_FOUND)

            elif item_type == "training":
                job = ModelTrainingJob.objects.filter(id=target_id).first()
                if job:
                    if job.trained_model_file and job.trained_model_file.name and os.path.isfile(job.trained_model_file.path):
                        try:
                            os.remove(job.trained_model_file.path)
                        except Exception:
                            pass
                    job.delete()
                    return Response({"detail": "Model training record deleted successfully."}, status=status.HTTP_200_OK)
                return Response({"detail": "Training record not found."}, status=status.HTTP_404_NOT_FOUND)

            elif item_type == "visualization":
                graph = SavedGraph.objects.filter(id=target_id).first()
                if graph:
                    graph.delete()
                    return Response({"detail": "Visualization record deleted successfully."}, status=status.HTTP_200_OK)
                return Response({"detail": "Visualization record not found."}, status=status.HTTP_404_NOT_FOUND)

        # Clear All History (bulk deletion)
        if request.user.is_authenticated:
            user = request.user
            datasets = Dataset.objects.filter(user=user)
            ml_jobs = ModelTrainingJob.objects.filter(user=user)
            vis_graphs = SavedGraph.objects.filter(user=user)
            clean_jobs = CleaningJob.objects.filter(user=user)
        else:
            datasets = Dataset.objects.all()
            ml_jobs = ModelTrainingJob.objects.all()
            vis_graphs = SavedGraph.objects.all()
            clean_jobs = CleaningJob.objects.all()

        # 1. Erase physical original & cleaned files for datasets
        for ds in datasets:
            if ds.original_file:
                try:
                    if ds.original_file.name and os.path.isfile(ds.original_file.path):
                        os.remove(ds.original_file.path)
                except Exception:
                    pass
            if ds.cleaned_file:
                try:
                    if ds.cleaned_file.name and os.path.isfile(ds.cleaned_file.path):
                        os.remove(ds.cleaned_file.path)
                except Exception:
                    pass

        # 2. Erase physical trained model files
        for job in ml_jobs:
            if job.trained_model_file:
                try:
                    if job.trained_model_file.name and os.path.isfile(job.trained_model_file.path):
                        os.remove(job.trained_model_file.path)
                except Exception:
                    pass

        # 3. Clean up any remaining files in media directory
        media_root = getattr(settings, "MEDIA_ROOT", None)
        if media_root and os.path.exists(media_root):
            for subfolder in ["datasets/original", "datasets/cleaned", "datasets", "trained_models", "graphs", "temp"]:
                folder_path = os.path.join(media_root, subfolder)
                if os.path.exists(folder_path):
                    for filename in os.listdir(folder_path):
                        file_path = os.path.join(folder_path, filename)
                        if os.path.isfile(file_path):
                            try:
                                os.remove(file_path)
                            except Exception:
                                pass

        # 4. Delete database records
        clean_jobs.delete()
        ml_jobs.delete()
        vis_graphs.delete()
        datasets.delete()

        return Response({"detail": "History and all local dataset files cleared successfully."}, status=status.HTTP_200_OK)
