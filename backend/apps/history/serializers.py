from rest_framework import serializers
from apps.cleaning.models import CleaningJob, Dataset
from apps.model_training.models import ModelTrainingJob
from apps.visualization.models import SavedGraph


class HistoryListSerializer(serializers.Serializer):
    """
    Lightweight serializer for history list endpoints.
    Excludes heavy text fields like full logs, detailed before/after reports, and raw python code.
    """
    id = serializers.CharField()
    type = serializers.CharField()
    dataset_id = serializers.CharField(allow_null=True)
    dataset_name = serializers.CharField()
    name = serializers.CharField(required=False, allow_null=True)
    created_at = serializers.DateTimeField()
    status = serializers.CharField(required=False, allow_null=True)
    
    # Lightweight stats summary
    file_type = serializers.CharField(required=False, allow_null=True)
    file_size = serializers.IntegerField(required=False, allow_null=True)
    rows = serializers.IntegerField(required=False, allow_null=True)
    columns = serializers.IntegerField(required=False, allow_null=True)
    before_stats = serializers.JSONField(required=False, allow_null=True)
    after_stats = serializers.JSONField(required=False, allow_null=True)
    config = serializers.JSONField(required=False, allow_null=True)
    
    # ML model summary fields
    target_column = serializers.CharField(required=False, allow_null=True)
    best_model_name = serializers.CharField(required=False, allow_null=True)
    best_model_score = serializers.FloatField(required=False, allow_null=True)
    
    # Visualization summary fields
    graph_type = serializers.CharField(required=False, allow_null=True)
    library = serializers.CharField(required=False, allow_null=True)
    is_favorite = serializers.BooleanField(required=False, default=False)


class HistoryDetailSerializer(serializers.Serializer):
    """
    Detailed serializer for history item retrieve endpoints.
    Includes full heavy logs, configurations, metrics, code, and complete statistical reports.
    """
    id = serializers.CharField()
    type = serializers.CharField()
    dataset_id = serializers.CharField(allow_null=True)
    dataset_name = serializers.CharField()
    name = serializers.CharField(required=False, allow_null=True)
    created_at = serializers.DateTimeField()
    status = serializers.CharField(required=False, allow_null=True)
    
    # Complete statistics & reports
    file_type = serializers.CharField(required=False, allow_null=True)
    file_size = serializers.IntegerField(required=False, allow_null=True)
    rows = serializers.IntegerField(required=False, allow_null=True)
    columns = serializers.IntegerField(required=False, allow_null=True)
    before_stats = serializers.JSONField(required=False, allow_null=True)
    after_stats = serializers.JSONField(required=False, allow_null=True)
    config = serializers.JSONField(required=False, allow_null=True)
    logs = serializers.JSONField(required=False, allow_null=True)
    
    # Complete ML job details
    target_column = serializers.CharField(required=False, allow_null=True)
    best_model_name = serializers.CharField(required=False, allow_null=True)
    best_model_score = serializers.FloatField(required=False, allow_null=True)
    evaluation_metrics = serializers.JSONField(required=False, allow_null=True)
    preprocessing_steps = serializers.JSONField(required=False, allow_null=True)
    hyperparameters = serializers.JSONField(required=False, allow_null=True)
    training_duration = serializers.FloatField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_null=True)
    tags = serializers.JSONField(required=False, allow_null=True)
    
    # Complete visualization details
    graph_type = serializers.CharField(required=False, allow_null=True)
    library = serializers.CharField(required=False, allow_null=True)
    python_code = serializers.CharField(required=False, allow_null=True)
    preview_data = serializers.CharField(required=False, allow_null=True)
    download_count = serializers.IntegerField(required=False, default=0)
    is_favorite = serializers.BooleanField(required=False, default=False)
