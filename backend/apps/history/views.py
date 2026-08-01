from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import os
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q

from apps.accounts.views import CsrfExemptSessionAuthentication
from apps.cleaning.models import CleaningJob, Dataset
from apps.model_training.models import ModelTrainingJob
from apps.visualization.models import SavedGraph
from apps.cleaning.utils import make_json_safe


def purge_expired_deleted_items():
    """
    Automatically purges soft-deleted items older than 10 days
    from both the database and physical local storage.
    """
    try:
        cutoff = timezone.now() - timedelta(days=10)

        # 1. Datasets & associated CleaningJobs
        expired_datasets = Dataset.objects.filter(is_deleted=True, deleted_at__lte=cutoff)
        for ds in expired_datasets:
            if ds.original_file and ds.original_file.name:
                try:
                    if os.path.isfile(ds.original_file.path):
                        os.remove(ds.original_file.path)
                except Exception:
                    pass
            if ds.cleaned_file and ds.cleaned_file.name:
                try:
                    if os.path.isfile(ds.cleaned_file.path):
                        os.remove(ds.cleaned_file.path)
                except Exception:
                    pass
            ds.delete()

        # Orphaned expired CleaningJobs
        CleaningJob.objects.filter(is_deleted=True, deleted_at__lte=cutoff).delete()

        # 2. ModelTrainingJobs
        expired_ml = ModelTrainingJob.objects.filter(is_deleted=True, deleted_at__lte=cutoff)
        for job in expired_ml:
            if job.trained_model_file and job.trained_model_file.name:
                try:
                    if os.path.isfile(job.trained_model_file.path):
                        os.remove(job.trained_model_file.path)
                except Exception:
                    pass
            job.delete()

        # 3. SavedGraphs
        SavedGraph.objects.filter(is_deleted=True, deleted_at__lte=cutoff).delete()
    except Exception:
        pass


@method_decorator(csrf_exempt, name='dispatch')
class CleaningHistoryView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]

    def get(self, request, *args, **kwargs):
        purge_expired_deleted_items()

        if request.user.is_authenticated:
            guest_id = request.query_params.get("guest_id") or request.headers.get("X-Guest-ID")
            if guest_id:
                Dataset.objects.filter(guest_id=guest_id, user__isnull=True).update(user=request.user)
                CleaningJob.objects.filter(dataset__guest_id=guest_id, user__isnull=True).update(user=request.user)

            clean_jobs = CleaningJob.objects.filter(
                (Q(user=request.user) | Q(dataset__user=request.user)) & Q(is_deleted=False)
            ).distinct()
            ml_jobs = ModelTrainingJob.objects.filter(
                (Q(user=request.user) | Q(dataset__user=request.user)) & Q(is_deleted=False)
            ).distinct()
            vis_graphs = SavedGraph.objects.filter(
                (Q(user=request.user) | Q(dataset__user=request.user)) & Q(is_deleted=False)
            ).distinct()

        else:
            clean_jobs = CleaningJob.objects.filter(is_deleted=False)
            ml_jobs = ModelTrainingJob.objects.filter(is_deleted=False)
            vis_graphs = SavedGraph.objects.filter(is_deleted=False)

        results = []
        for job in clean_jobs:
            results.append({
                "id": job.id,
                "type": "cleaning",
                "dataset_id": job.dataset.id if job.dataset else None,
                "dataset_name": job.dataset.name if job.dataset else "Dataset",
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
                "dataset_id": job.dataset.id if job.dataset else None,
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
        Soft deletes item (moves to Recently Deleted for 10 days) unless permanent=true is specified.
        """
        target_id = item_id or request.query_params.get("item_id")
        item_type = request.query_params.get("type")
        is_permanent = request.query_params.get("permanent", "").lower() == "true"
        now = timezone.now()

        # Single item deletion
        if target_id and item_type:
            if item_type == "cleaning":
                job = CleaningJob.objects.filter(id=target_id).first()
                if job:
                    if is_permanent:
                        ds = job.dataset
                        if ds:
                            if ds.original_file and ds.original_file.name and os.path.isfile(ds.original_file.path):
                                try: os.remove(ds.original_file.path)
                                except Exception: pass
                            if ds.cleaned_file and ds.cleaned_file.name and os.path.isfile(ds.cleaned_file.path):
                                try: os.remove(ds.cleaned_file.path)
                                except Exception: pass
                            ds.delete()
                        else:
                            job.delete()
                        return Response({"detail": "Cleaning record permanently deleted."}, status=status.HTTP_200_OK)
                    else:
                        job.is_deleted = True
                        job.deleted_at = now
                        job.save()
                        if job.dataset:
                            job.dataset.is_deleted = True
                            job.dataset.deleted_at = now
                            job.dataset.save()
                        return Response({"detail": "Item moved to Recently Deleted. It will be automatically removed after 10 days."}, status=status.HTTP_200_OK)
                return Response({"detail": "Cleaning record not found."}, status=status.HTTP_404_NOT_FOUND)

            elif item_type == "training":
                job = ModelTrainingJob.objects.filter(id=target_id).first()
                if job:
                    if is_permanent:
                        if job.trained_model_file and job.trained_model_file.name and os.path.isfile(job.trained_model_file.path):
                            try: os.remove(job.trained_model_file.path)
                            except Exception: pass
                        job.delete()
                        return Response({"detail": "Training record permanently deleted."}, status=status.HTTP_200_OK)
                    else:
                        job.is_deleted = True
                        job.deleted_at = now
                        job.save()
                        return Response({"detail": "Item moved to Recently Deleted. It will be automatically removed after 10 days."}, status=status.HTTP_200_OK)
                return Response({"detail": "Training record not found."}, status=status.HTTP_404_NOT_FOUND)

            elif item_type == "visualization":
                graph = SavedGraph.objects.filter(id=target_id).first()
                if graph:
                    if is_permanent:
                        graph.delete()
                        return Response({"detail": "Visualization permanently deleted."}, status=status.HTTP_200_OK)
                    else:
                        graph.is_deleted = True
                        graph.deleted_at = now
                        graph.save()
                        return Response({"detail": "Item moved to Recently Deleted. It will be automatically removed after 10 days."}, status=status.HTTP_200_OK)
                return Response({"detail": "Visualization record not found."}, status=status.HTTP_404_NOT_FOUND)

        # Bulk Clear All History
        if is_permanent:
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

            for ds in datasets:
                if ds.original_file and ds.original_file.name and os.path.isfile(ds.original_file.path):
                    try: os.remove(ds.original_file.path)
                    except Exception: pass
                if ds.cleaned_file and ds.cleaned_file.name and os.path.isfile(ds.cleaned_file.path):
                    try: os.remove(ds.cleaned_file.path)
                    except Exception: pass

            for job in ml_jobs:
                if job.trained_model_file and job.trained_model_file.name and os.path.isfile(job.trained_model_file.path):
                    try: os.remove(job.trained_model_file.path)
                    except Exception: pass

            clean_jobs.delete()
            ml_jobs.delete()
            vis_graphs.delete()
            datasets.delete()
            return Response({"detail": "All history records permanently deleted."}, status=status.HTTP_200_OK)
        else:
            if request.user.is_authenticated:
                user = request.user
                Dataset.objects.filter(user=user, is_deleted=False).update(is_deleted=True, deleted_at=now)
                CleaningJob.objects.filter(user=user, is_deleted=False).update(is_deleted=True, deleted_at=now)
                ModelTrainingJob.objects.filter(user=user, is_deleted=False).update(is_deleted=True, deleted_at=now)
                SavedGraph.objects.filter(user=user, is_deleted=False).update(is_deleted=True, deleted_at=now)
            else:
                Dataset.objects.filter(is_deleted=False).update(is_deleted=True, deleted_at=now)
                CleaningJob.objects.filter(is_deleted=False).update(is_deleted=True, deleted_at=now)
                ModelTrainingJob.objects.filter(is_deleted=False).update(is_deleted=True, deleted_at=now)
                SavedGraph.objects.filter(is_deleted=False).update(is_deleted=True, deleted_at=now)

            return Response({"detail": "All items moved to Recently Deleted. They will be automatically removed after 10 days."}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class RecentlyDeletedView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]

    def get(self, request, *args, **kwargs):
        purge_expired_deleted_items()
        now = timezone.now()

        if request.user.is_authenticated:
            user = request.user
            clean_jobs = CleaningJob.objects.filter(
                (Q(user=user) | Q(dataset__user=user)) & Q(is_deleted=True)
            ).distinct()
            ml_jobs = ModelTrainingJob.objects.filter(
                (Q(user=user) | Q(dataset__user=user)) & Q(is_deleted=True)
            ).distinct()
            vis_graphs = SavedGraph.objects.filter(
                (Q(user=user) | Q(dataset__user=user)) & Q(is_deleted=True)
            ).distinct()
        else:
            clean_jobs = CleaningJob.objects.filter(is_deleted=True)
            ml_jobs = ModelTrainingJob.objects.filter(is_deleted=True)
            vis_graphs = SavedGraph.objects.filter(is_deleted=True)

        results = []

        for job in clean_jobs:
            del_at = job.deleted_at or now
            days_passed = (now - del_at).days
            days_remaining = max(0, 10 - days_passed)
            results.append({
                "id": job.id,
                "type": "cleaning",
                "name": job.dataset.name if job.dataset else "Dataset",
                "dataset_name": job.dataset.name if job.dataset else "Dataset",
                "deleted_at": del_at.isoformat(),
                "created_at": job.created_at.isoformat(),
                "days_remaining": days_remaining
            })

        for job in ml_jobs:
            del_at = job.deleted_at or now
            days_passed = (now - del_at).days
            days_remaining = max(0, 10 - days_passed)
            results.append({
                "id": job.id,
                "type": "training",
                "name": f"{job.best_model_name or 'ML Model'} ({job.dataset_name})",
                "dataset_name": job.dataset_name,
                "deleted_at": del_at.isoformat(),
                "created_at": job.created_at.isoformat(),
                "days_remaining": days_remaining
            })

        for graph in vis_graphs:
            del_at = graph.deleted_at or now
            days_passed = (now - del_at).days
            days_remaining = max(0, 10 - days_passed)
            results.append({
                "id": graph.id,
                "type": "visualization",
                "name": graph.name or "Saved Visualization",
                "dataset_name": graph.dataset_name,
                "deleted_at": del_at.isoformat(),
                "created_at": graph.created_at.isoformat(),
                "days_remaining": days_remaining
            })

        results.sort(key=lambda x: x["deleted_at"], reverse=True)
        return Response(make_json_safe(results), status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        """
        Restore item(s) from Recently Deleted back to active history.
        """
        action = request.data.get("action", "restore")
        item_id = request.data.get("item_id")
        item_type = request.data.get("type")
        restore_all = request.data.get("all", False)

        if action == "restore":
            if restore_all:
                if request.user.is_authenticated:
                    user = request.user
                    Dataset.objects.filter(user=user, is_deleted=True).update(is_deleted=False, deleted_at=None)
                    CleaningJob.objects.filter(user=user, is_deleted=True).update(is_deleted=False, deleted_at=None)
                    ModelTrainingJob.objects.filter(user=user, is_deleted=True).update(is_deleted=False, deleted_at=None)
                    SavedGraph.objects.filter(user=user, is_deleted=True).update(is_deleted=False, deleted_at=None)
                else:
                    Dataset.objects.filter(is_deleted=True).update(is_deleted=False, deleted_at=None)
                    CleaningJob.objects.filter(is_deleted=True).update(is_deleted=False, deleted_at=None)
                    ModelTrainingJob.objects.filter(is_deleted=True).update(is_deleted=False, deleted_at=None)
                    SavedGraph.objects.filter(is_deleted=True).update(is_deleted=False, deleted_at=None)
                return Response({"detail": "All items restored successfully."}, status=status.HTTP_200_OK)

            if not item_id or not item_type:
                return Response({"error": "item_id and type are required."}, status=status.HTTP_400_BAD_REQUEST)

            if item_type == "cleaning":
                job = CleaningJob.objects.filter(id=item_id, is_deleted=True).first()
                if job:
                    job.is_deleted = False
                    job.deleted_at = None
                    job.save()
                    if job.dataset:
                        job.dataset.is_deleted = False
                        job.dataset.deleted_at = None
                        job.dataset.save()
                    return Response({"detail": "Cleaning record restored successfully."}, status=status.HTTP_200_OK)

            elif item_type == "training":
                job = ModelTrainingJob.objects.filter(id=item_id, is_deleted=True).first()
                if job:
                    job.is_deleted = False
                    job.deleted_at = None
                    job.save()
                    return Response({"detail": "Training record restored successfully."}, status=status.HTTP_200_OK)

            elif item_type == "visualization":
                graph = SavedGraph.objects.filter(id=item_id, is_deleted=True).first()
                if graph:
                    graph.is_deleted = False
                    graph.deleted_at = None
                    graph.save()
                    return Response({"detail": "Visualization graph restored successfully."}, status=status.HTTP_200_OK)

            return Response({"error": "Item not found in Recently Deleted."}, status=status.HTTP_404_NOT_FOUND)

        return Response({"error": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, *args, **kwargs):
        """
        Permanently purge item(s) from Recently Deleted.
        """
        item_id = request.query_params.get("item_id") or request.data.get("item_id")
        item_type = request.query_params.get("type") or request.data.get("type")
        purge_all = request.query_params.get("all", "").lower() == "true" or request.data.get("all", False)

        if purge_all:
            if request.user.is_authenticated:
                user = request.user
                datasets = Dataset.objects.filter(user=user, is_deleted=True)
                ml_jobs = ModelTrainingJob.objects.filter(user=user, is_deleted=True)
                vis_graphs = SavedGraph.objects.filter(user=user, is_deleted=True)
                clean_jobs = CleaningJob.objects.filter(user=user, is_deleted=True)
            else:
                datasets = Dataset.objects.filter(is_deleted=True)
                ml_jobs = ModelTrainingJob.objects.filter(is_deleted=True)
                vis_graphs = SavedGraph.objects.filter(is_deleted=True)
                clean_jobs = CleaningJob.objects.filter(is_deleted=True)

            for ds in datasets:
                if ds.original_file and ds.original_file.name and os.path.isfile(ds.original_file.path):
                    try: os.remove(ds.original_file.path)
                    except Exception: pass
                if ds.cleaned_file and ds.cleaned_file.name and os.path.isfile(ds.cleaned_file.path):
                    try: os.remove(ds.cleaned_file.path)
                    except Exception: pass

            for job in ml_jobs:
                if job.trained_model_file and job.trained_model_file.name and os.path.isfile(job.trained_model_file.path):
                    try: os.remove(job.trained_model_file.path)
                    except Exception: pass

            clean_jobs.delete()
            ml_jobs.delete()
            vis_graphs.delete()
            datasets.delete()
            return Response({"detail": "All recently deleted items permanently erased."}, status=status.HTTP_200_OK)

        if not item_id or not item_type:
            return Response({"error": "item_id and type are required."}, status=status.HTTP_400_BAD_REQUEST)

        if item_type == "cleaning":
            job = CleaningJob.objects.filter(id=item_id, is_deleted=True).first()
            if job:
                ds = job.dataset
                if ds:
                    if ds.original_file and ds.original_file.name and os.path.isfile(ds.original_file.path):
                        try: os.remove(ds.original_file.path)
                        except Exception: pass
                    if ds.cleaned_file and ds.cleaned_file.name and os.path.isfile(ds.cleaned_file.path):
                        try: os.remove(ds.cleaned_file.path)
                        except Exception: pass
                    ds.delete()
                else:
                    job.delete()
                return Response({"detail": "Cleaning record permanently erased."}, status=status.HTTP_200_OK)

        elif item_type == "training":
            job = ModelTrainingJob.objects.filter(id=item_id, is_deleted=True).first()
            if job:
                if job.trained_model_file and job.trained_model_file.name and os.path.isfile(job.trained_model_file.path):
                    try: os.remove(job.trained_model_file.path)
                    except Exception: pass
                job.delete()
                return Response({"detail": "Model training record permanently erased."}, status=status.HTTP_200_OK)

        elif item_type == "visualization":
            graph = SavedGraph.objects.filter(id=item_id, is_deleted=True).first()
            if graph:
                graph.delete()
                return Response({"detail": "Visualization permanently erased."}, status=status.HTTP_200_OK)

        return Response({"error": "Item not found in Recently Deleted."}, status=status.HTTP_404_NOT_FOUND)
