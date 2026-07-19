from django.db import models
from django.conf import settings
from apps.cleaning.models import Dataset


class SavedGraph(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_graphs",
        null=True,
        blank=True
    )
    dataset = models.ForeignKey(
        Dataset,
        on_delete=models.CASCADE,
        related_name="saved_graphs"
    )
    title = models.CharField(max_length=255, default="Untitled Graph")
    chart_config = models.JSONField(default=dict)
    thumbnail = models.TextField(blank=True, default="")  # SVG string or Plotly JSON (truncated)
    is_favorite = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"SavedGraph #{self.id} - {self.title}"
