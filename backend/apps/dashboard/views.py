from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .services import DashboardService


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        analytics = DashboardService.get_dashboard_analytics(request.user)
        return Response(analytics, status=status.HTTP_200_OK)
