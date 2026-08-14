import logging
from .models import UserActivity

logger = logging.getLogger(__name__)


class ActivityService:
    @staticmethod
    def get_client_ip(request):
        if not request:
            return None
        cf_ip = request.META.get("HTTP_CF_CONNECTING_IP")
        if cf_ip:
            return cf_ip.strip()
        real_ip = request.META.get("HTTP_X_REAL_IP")
        if real_ip:
            return real_ip.strip()
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")

    @classmethod
    def log_activity(cls, user, action_type, title, description="", metadata=None, request=None):
        """
        Record a user action for auditing, analytics, and history tracking.
        """
        try:
            ip_address = cls.get_client_ip(request) if request else None
            user_agent = request.META.get("HTTP_USER_AGENT", "") if request else ""

            # Ensure user is valid / authenticated or None
            user_obj = user if (user and user.is_authenticated) else None

            activity = UserActivity.objects.create(
                user=user_obj,
                action_type=action_type,
                title=title,
                description=description,
                metadata=metadata or {},
                ip_address=ip_address,
                user_agent=user_agent
            )
            return activity
        except Exception as e:
            logger.error(f"Failed to log user activity [{action_type}]: {str(e)}")
            return None
