import uuid
from django.db import models
from django.conf import settings

class Dataset(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="datasets",
        null=True,
        blank=True,
        db_index=True
    )
    name = models.CharField(max_length=255)
    original_filename = models.CharField(max_length=255, null=True, blank=True)
    original_file = models.FileField(upload_to="datasets/original/")
    cleaned_file = models.FileField(upload_to="datasets/cleaned/", null=True, blank=True)
    file_type = models.CharField(max_length=10)  # csv, xlsx, xls
    file_size = models.BigIntegerField(null=True, blank=True)
    rows_count = models.IntegerField(null=True, blank=True)
    cols_count = models.IntegerField(null=True, blank=True)
    memory_usage = models.CharField(max_length=50, null=True, blank=True)
    encoding = models.CharField(max_length=50, default="UTF-8")
    status = models.CharField(max_length=50, default="uploaded")  # uploaded, cleaned
    download_count = models.IntegerField(default=0)
    
    # Soft deletion & timestamps
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
        return f"{self.name} ({self.file_type.upper()})"


class CleaningJob(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cleaning_jobs",
        null=True,
        blank=True,
        db_index=True
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
    
    # Quantitative summary
    rows_removed = models.IntegerField(default=0)
    cols_removed = models.IntegerField(default=0)
    missing_filled = models.IntegerField(default=0)

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
        return f"CleanJob #{self.id} for {self.dataset.name}"

