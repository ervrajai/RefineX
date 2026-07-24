from django.urls import path
from .views import CleaningHistoryView

urlpatterns = [
    path("", CleaningHistoryView.as_view(), name="cleaning-history"),
    path("<int:item_id>/", CleaningHistoryView.as_view(), name="cleaning-history-item"),
]