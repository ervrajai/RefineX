from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum
from apps.cleaning.models import Dataset, CleaningJob
from apps.model_training.models import ModelTrainingJob
from apps.visualization.models import SavedGraph
from apps.core.models import UserActivity
from apps.cleaning.utils import make_json_safe, profile_dataset, read_dataframe


class DashboardService:
    @staticmethod
    def get_dashboard_analytics(user):
        """
        Calculates all real-time dashboard statistics dynamically from the database
        without storing redundant duplicate values.
        """
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        if not user or not user.is_authenticated:
            return {
                "profile": {
                    "username": "Guest User",
                    "email": "",
                    "first_name": "Guest",
                    "last_name": "",
                    "date_joined": None,
                    "is_email_verified": False,
                    "avatar": "",
                    "auth_provider": "email",
                },
                "stats": {
                    "total_uploaded_csvs": 0,
                    "total_cleaned_csvs": 0,
                    "total_downloaded_csvs": 0,
                    "total_trained_models": 0,
                    "total_visualizations_created": 0,
                    "total_application_usage": 0,
                    "recent_activity_count": 0,
                },
                "recent_activities": [],
                "recent_csv_files": [],
                "latest_trained_models": [],
                "latest_visualizations": [],
            }

        # User Profile info
        profile_avatar = ""
        if hasattr(user, "profile") and user.profile.avatar:
            profile_avatar = user.profile.avatar
        elif user.profile_picture:
            profile_avatar = user.profile_picture

        display_username = user.username if user.username else (user.email.split("@")[0] if user.email else "User")

        # 1. Total uploaded CSVs
        uploaded_qs = Dataset.objects.filter(user=user, is_deleted=False)
        total_uploaded_csvs = uploaded_qs.count()

        # 2. Total cleaned CSVs
        total_cleaned_csvs = uploaded_qs.filter(status="cleaned").count()

        # 3. Total downloaded CSVs (Sum of download_count across datasets + download activity count)
        dataset_downloads = uploaded_qs.aggregate(total=Sum("download_count"))["total"] or 0
        download_activities = UserActivity.objects.filter(user=user, action_type="download_csv").count()
        total_downloaded_csvs = dataset_downloads + download_activities

        # 4. Total trained models
        models_qs = ModelTrainingJob.objects.filter(user=user, is_deleted=False)
        total_trained_models = models_qs.filter(status="completed").count()

        # 5. Total visualizations created
        viz_qs = SavedGraph.objects.filter(user=user, is_deleted=False)
        total_visualizations_created = viz_qs.count()

        # 6. Total application usage
        user_activities_qs = UserActivity.objects.filter(user=user)
        total_application_usage = user_activities_qs.count()

        # 7. Recent activity count (last 30 days)
        recent_activity_count = user_activities_qs.filter(created_at__gte=thirty_days_ago).count()

        # Activity stream (latest 10 activities)
        recent_activities_data = []
        for act in user_activities_qs[:10]:
            recent_activities_data.append({
                "id": act.id,
                "action_type": act.action_type,
                "title": act.title,
                "description": act.description,
                "metadata": act.metadata,
                "created_at": act.created_at.isoformat(),
            })

        # Top 5 recently worked CSV files (with quick resume metadata payload)
        recent_csv_files = []
        top_datasets = uploaded_qs.order_by("-updated_at")[:5]
        for ds in top_datasets:
            # Check latest cleaning job for after stats if available
            latest_clean_job = CleaningJob.objects.filter(dataset=ds, is_deleted=False).order_by("-created_at").first()
            clean_logs = latest_clean_job.logs if latest_clean_job else []
            before_report = latest_clean_job.before_stats if latest_clean_job else None
            after_report = latest_clean_job.after_stats if latest_clean_job else None

            recent_csv_files.append({
                "id": ds.id,
                "uuid": str(ds.uuid),
                "name": ds.name,
                "original_filename": ds.original_filename or ds.name,
                "file_type": ds.file_type,
                "file_size": ds.file_size,
                "rows_count": ds.rows_count,
                "cols_count": ds.cols_count,
                "status": ds.status,
                "download_count": ds.download_count,
                "updated_at": ds.updated_at.isoformat(),
                "before_report": before_report,
                "after_report": after_report,
                "clean_logs": clean_logs,
            })

        # Latest trained models (top 5)
        latest_models_data = []
        for model in models_qs.order_by("-created_at")[:5]:
            latest_models_data.append({
                "id": model.id,
                "uuid": str(model.uuid),
                "dataset_name": model.dataset_name,
                "target_column": model.target_column,
                "best_model_name": model.best_model_name or "N/A",
                "best_model_score": model.best_model_score,
                "status": model.status,
                "training_duration": model.training_duration,
                "created_at": model.created_at.isoformat(),
            })

        # Latest visualizations (top 5)
        latest_viz_data = []
        for viz in viz_qs.order_by("-created_at")[:5]:
            latest_viz_data.append({
                "id": viz.id,
                "uuid": str(viz.uuid),
                "name": viz.name,
                "graph_type": viz.graph_type,
                "library": viz.library,
                "dataset_name": viz.dataset_name,
                "preview_data": viz.preview_data,
                "created_at": viz.created_at.isoformat(),
            })

        return make_json_safe({
            "profile": {
                "username": display_username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "date_joined": user.date_joined.isoformat() if user.date_joined else None,
                "is_email_verified": user.is_email_verified,
                "avatar": profile_avatar,
                "auth_provider": user.auth_provider,
            },
            "stats": {
                "total_uploaded_csvs": total_uploaded_csvs,
                "total_cleaned_csvs": total_cleaned_csvs,
                "total_downloaded_csvs": total_downloaded_csvs,
                "total_trained_models": total_trained_models,
                "total_visualizations_created": total_visualizations_created,
                "total_application_usage": total_application_usage,
                "recent_activity_count": recent_activity_count,
            },
            "recent_activities": recent_activities_data,
            "recent_csv_files": recent_csv_files,
            "latest_trained_models": latest_models_data,
            "latest_visualizations": latest_viz_data,
        })
