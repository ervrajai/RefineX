import uuid
from django.db import models
from django.conf import settings
from django.dispatch import receiver
from django.db.models.signals import post_delete

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
    guest_id = models.CharField(max_length=64, null=True, blank=True, db_index=True)
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
            models.Index(fields=["guest_id"]),
            models.Index(fields=["uuid"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.file_type.upper()})"


class GuestUsage(models.Model):
    guest_id = models.CharField(max_length=64, db_index=True)
    ip_address = models.GenericIPAddressField()
    clean_count = models.IntegerField(default=0)
    last_clean_date = models.DateField(auto_now=True)

    class Meta:
        ordering = ["-last_clean_date"]
        indexes = [
            models.Index(fields=["guest_id", "last_clean_date"]),
            models.Index(fields=["ip_address", "last_clean_date"]),
        ]

    def __str__(self):
        return f"GuestUsage ({self.guest_id}) - {self.clean_count} cleans"



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


@receiver(post_delete, sender=Dataset)
def auto_delete_file_on_dataset_delete(sender, instance, **kwargs):
    """
    Deletes files from cloud/local storage when Dataset object is deleted.
    """
    if instance.original_file:
        try:
            instance.original_file.delete(save=False)
        except Exception:
            pass

    if instance.cleaned_file:
        try:
            instance.cleaned_file.delete(save=False)
        except Exception:
            pass


