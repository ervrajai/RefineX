from django.urls import path
from .views import CleaningHistoryView

urlpatterns = [
    path("", CleaningHistoryView.as_view(), name="cleaning-history"),
]