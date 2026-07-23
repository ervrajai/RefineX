import uuid
from django.db import models
from django.conf import settings


class UserActivity(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="activities",
        null=True,
        blank=True,
        db_index=True
    )
    action_type = models.CharField(max_length=50, db_index=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "User Activities"
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["action_type"]),
        ]

    def __str__(self):
        user_str = self.user.email if self.user else "Anonymous"
        return f"[{self.action_type}] {self.title} by {user_str}"

