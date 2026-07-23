import uuid
from django.db import models
from django.conf import settings
from apps.cleaning.models import Dataset

class SavedGraph(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_graphs",
        null=True,
        blank=True,
        db_index=True
    )
    dataset = models.ForeignKey(
        Dataset,
        on_delete=models.SET_NULL,
        related_name="saved_graphs",
        null=True,
        blank=True
    )
    dataset_name = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    graph_type = models.CharField(max_length=100)  # bar, line, scatter, etc.
    library = models.CharField(max_length=100)     # matplotlib, seaborn, plotly
    config = models.JSONField(default=dict)        # all layout and design customization parameters
    python_code = models.TextField(blank=True, default="")
    preview_data = models.TextField(blank=True, default="") # base64 or SVG string
    
    download_count = models.IntegerField(default=0)
    is_favorite = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
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
        return f"{self.name} ({self.graph_type} - {self.library})"

