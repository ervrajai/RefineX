from django.urls import path
from .views import CleaningHistoryView, RecentlyDeletedView

urlpatterns = [
    path("", CleaningHistoryView.as_view(), name="cleaning-history"),
    path("recently-deleted/", RecentlyDeletedView.as_view(), name="recently-deleted"),
    path("<int:item_id>/", CleaningHistoryView.as_view(), name="cleaning-history-item"),
]