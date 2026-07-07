from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.cleaning.models import CleaningJob
from apps.cleaning.utils import make_json_safe

class CleaningHistoryView(APIView):
    def get(self, request, *args, **kwargs):
        # Filter by user if authenticated, otherwise return all (helps with guest testing)
        if request.user.is_authenticated:
            jobs = CleaningJob.objects.filter(user=request.user).order_by('-created_at')
        else:
            jobs = CleaningJob.objects.all().order_by('-created_at')

        results = []
        for job in jobs:
            results.append({
                "id": job.id,
                "dataset_id": job.dataset.id,
                "dataset_name": job.dataset.name,
                "cleaned_at": job.created_at,
                "config": job.cleaning_config,
                "before_stats": job.before_stats,
                "after_stats": job.after_stats,
                "logs": job.logs
            })
            
        return Response(make_json_safe(results), status=status.HTTP_200_OK)
