from django.contrib import admin
from .models import SavedGraph

@admin.register(SavedGraph)
class SavedGraphAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "user", "graph_type", "library", "is_favorite", "download_count", "created_at"]
    list_filter = ["library", "graph_type", "is_favorite", "created_at"]
    search_fields = ["name", "dataset_name", "user__email"]
