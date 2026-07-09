from django.db import models
from django.conf import settings
from apps.cleaning.models import Dataset

class ModelTrainingJob(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="model_training_jobs",
        null=True,
        blank=True
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
    
    # Store predictions (list of dicts containing: actual, predicted)
    predictions = models.JSONField(default=dict, blank=True)
    
    # Progress & Status tracking for asynchronous UI updates
    status = models.CharField(max_length=50, default="pending")  # pending, training, completed, failed
    progress_stage = models.CharField(max_length=100, default="initialized")
    progress_percent = models.IntegerField(default=0)
    error_message = models.TextField(null=True, blank=True)
    
    # History integration features
    is_favorite = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    tags = models.JSONField(default=list)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"ModelTrainingJob #{self.id} for {self.dataset_name}"
