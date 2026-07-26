import os
from datetime import timedelta
from django.apps import AppConfig
from django.utils import timezone


class CleaningConfig(AppConfig):
    name = 'apps.cleaning'

    def ready(self):
        from django.db.models.signals import post_migrate
        post_migrate.connect(self._purge_expired_guest_datasets, sender=self)

    def _purge_expired_guest_datasets(self, **kwargs):
        try:
            from .models import Dataset
            cutoff = timezone.now() - timedelta(hours=24)
            expired = Dataset.objects.filter(user__isnull=True, created_at__lt=cutoff)
            for ds in expired:
                if ds.original_file:
                    try:
                        if os.path.isfile(ds.original_file.path):
                            os.remove(ds.original_file.path)
                    except Exception:
                        pass
                if ds.cleaned_file:
                    try:
                        if os.path.isfile(ds.cleaned_file.path):
                            os.remove(ds.cleaned_file.path)
                    except Exception:
                        pass
                ds.delete()
        except Exception:
            pass



