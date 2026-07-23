from rest_framework import serializers
from .models import SavedGraph

class SavedGraphSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedGraph
        fields = [
            "id",
            "user",
            "dataset",
            "dataset_name",
            "name",
            "graph_type",
            "library",
            "config",
            "python_code",
            "preview_data",
            "download_count",
            "is_favorite",
            "created_at",
            "updated_at"
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at", "python_code"]
