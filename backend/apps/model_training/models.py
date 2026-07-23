import uuid
from django.db import models
from django.conf import settings
from django.dispatch import receiver
from django.db.models.signals import post_delete
from apps.cleaning.models import Dataset

class ModelTrainingJob(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="model_training_jobs",
        null=True,
        blank=True,
        db_index=True
    )
    dataset = models.ForeignKey(
        Dataset,
        on_delete=models.CASCADE,
        related_name="model_training_jobs"
    )
    dataset_name = models.CharField(max_length=255)
    target_column = models.CharField(max_length=100)
    selected_features = models.JSONField(default=list)
    selected_models = models.JSONField(default=list)
    training_mode = models.CharField(max_length=50, default="manual")  # manual, decide
    
    preprocessing_steps = models.JSONField(default=list)
    hyperparameters = models.JSONField(default=dict)
    evaluation_metrics = models.JSONField(default=dict)
    
    best_model_name = models.CharField(max_length=100, null=True, blank=True)
    best_model_score = models.FloatField(null=True, blank=True)
    
    training_duration = models.FloatField(default=0.0)
    prediction_duration = models.FloatField(default=0.0)
    
    # Serialized pipeline + best model (.joblib)
    trained_model_file = models.FileField(upload_to="models/", null=True, blank=True)
    download_count = models.IntegerField(default=0)
    
    # Store predictions (list of dicts containing: actual, predicted)
    predictions = models.JSONField(default=dict, blank=True)
    
    # Progress & Status tracking for asynchronous UI updates
    status = models.CharField(max_length=50, default="pending")  # pending, training, completed, failed
    progress_stage = models.CharField(max_length=100, default="initialized")
    progress_percent = models.IntegerField(default=0)
    error_message = models.TextField(null=True, blank=True)
    
    # History integration features
    is_favorite = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    tags = models.JSONField(default=list)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_deleted"]),
            models.Index(fields=["uuid"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"ModelTrainingJob #{self.id} for {self.dataset_name}"


@receiver(post_delete, sender=ModelTrainingJob)
def auto_delete_file_on_model_job_delete(sender, instance, **kwargs):
    """
    Deletes physical trained model files (.joblib) from local disk when ModelTrainingJob is deleted.
    """
    import os
    if instance.trained_model_file:
        try:
            if os.path.isfile(instance.trained_model_file.path):
                os.remove(instance.trained_model_file.path)
        except Exception:
            pass


