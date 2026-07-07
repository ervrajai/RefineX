from django.db import models
from django.conf import settings

class Dataset(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="datasets",
        null=True,
        blank=True
    )
    name = models.CharField(max_length=255)
    original_file = models.FileField(upload_to="datasets/original/")
    cleaned_file = models.FileField(upload_to="datasets/cleaned/", null=True, blank=True)
    file_type = models.CharField(max_length=10)  # csv, xlsx, xls
    file_size = models.BigIntegerField(null=True, blank=True)
    rows_count = models.IntegerField(null=True, blank=True)
    cols_count = models.IntegerField(null=True, blank=True)
    memory_usage = models.CharField(max_length=50, null=True, blank=True)
    encoding = models.CharField(max_length=50, default="UTF-8")
    status = models.CharField(max_length=50, default="uploaded")  # uploaded, cleaned
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.file_type.upper()})"


class CleaningJob(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cleaning_jobs",
        null=True,
        blank=True
    )
    dataset = models.ForeignKey(
        Dataset,
        on_delete=models.CASCADE,
        related_name="cleaning_jobs"
    )
    cleaning_config = models.JSONField(default=dict)
    before_stats = models.JSONField(default=dict)
    after_stats = models.JSONField(default=dict)
    logs = models.JSONField(default=list)  # List of strings: log entries
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"CleanJob #{self.id} for {self.dataset.name}"
