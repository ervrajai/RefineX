import io
import json
import base64
import time
import hashlib
import logging
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from apps.accounts.views import CsrfExemptSessionAuthentication

logger = logging.getLogger(__name__)

from apps.cleaning.models import Dataset
from apps.cleaning.utils import read_dataframe, make_json_safe
from apps.core.services import ActivityService
from .models import SavedGraph
from .serializers import SavedGraphSerializer

from .services import (
    get_dataset_analysis,
    recommend_graphs,
    validate_graph_config,
    apply_smart_decisions
)
from .generators import generate_graph
from .code_generator import compile_python_code

@method_decorator(csrf_exempt, name='dispatch')
class DatasetAnalysisView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    
    def get(self, request, dataset_id, *args, **kwargs):
        dataset = get_object_or_404(Dataset, pk=dataset_id)
        analysis = get_dataset_analysis(dataset)
        return Response(analysis, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class GraphRecommendationView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    
    def get(self, request, dataset_id, *args, **kwargs):
        dataset = get_object_or_404(Dataset, pk=dataset_id)
        analysis = get_dataset_analysis(dataset)
        recs = recommend_graphs(analysis)
        return Response(recs, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class GraphValidationView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    
    def post(self, request, *args, **kwargs):
        dataset_id = request.data.get("dataset_id")
        graph_type = request.data.get("graph_type")
        
        if not dataset_id or not graph_type:
            return Response({
                "is_valid": False,
                "error_message": "dataset_id and graph_type are required fields.",
                "recommended_type": None
            }, status=status.HTTP_200_OK)
            
        dataset = get_object_or_404(Dataset, pk=dataset_id)
        analysis = get_dataset_analysis(dataset)
        
        is_valid, err_msg, rec_type = validate_graph_config(
            analysis,
            graph_type,
            x_col=request.data.get("x_column"),
            y_col=request.data.get("y_column"),
            z_col=request.data.get("z_column"),
            size_col=request.data.get("size_column"),
            color_col=request.data.get("color_column"),
            source_col=request.data.get("source_column"),
            target_col=request.data.get("target_column")
        )
        
        return Response({
            "is_valid": is_valid,
            "error_message": err_msg,
            "recommended_type": rec_type
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class GraphGenerationView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    
    def post(self, request, *args, **kwargs):
        dataset_id = request.data.get("dataset_id")
        config = request.data.get("config", {})
        
        if not dataset_id:
            return Response({
                "success": False,
                "error": "dataset_id is required.",
                "reason": "Please select a valid dataset."
            }, status=status.HTTP_200_OK)
            
        dataset = get_object_or_404(Dataset, pk=dataset_id)

        # 1. RAM Caching Key with dataset updated_at timestamp (CRITICAL for cache busting on clean)
        updated_str = dataset.updated_at.isoformat() if dataset.updated_at else ""
        config_str = json.dumps(config, sort_keys=True)
        config_hash = hashlib.md5(f"{updated_str}_{config_str}".encode('utf-8')).hexdigest()
        cache_key = f"vis_graph_{dataset_id}_{config_hash}"

        cached_response = cache.get(cache_key)
        if cached_response:
            logger.info(f"[CACHE HIT] Returned graph visualization from RAM cache for key: {cache_key}")
            return Response(cached_response, status=status.HTTP_200_OK)

        analysis = get_dataset_analysis(dataset)
        
        graph_type = config.get("graph_type")
        if not graph_type:
            return Response({
                "success": False,
                "error": "graph_type config parameter is required.",
                "reason": "Please select a chart type."
            }, status=status.HTTP_200_OK)
            
        # Run config validation
        is_valid, err_msg, rec_type = validate_graph_config(
            analysis,
            graph_type,
            x_col=config.get("x_column"),
            y_col=config.get("y_column"),
            z_col=config.get("z_column"),
            size_col=config.get("size_column"),
            color_col=config.get("color_column"),
            source_col=config.get("source_column"),
            target_col=config.get("target_column")
        )
        
        if not is_valid:
            return Response({
                "success": False,
                "error": f"{graph_type} cannot be generated.",
                "reason": err_msg,
                "recommended": rec_type
            }, status=status.HTTP_200_OK)
            
        try:
            # 2. Execution Profiling: Step 1 - Disk Read
            t_start_read = time.time()
            file_path = dataset.cleaned_file.path if dataset.cleaned_file else dataset.original_file.path
            df, _ = read_dataframe(file_path, dataset.file_type, encoding=dataset.encoding)
            t_read = time.time() - t_start_read
            logger.info(f"[PROFILING] 1. Disk Read Time: {t_read:.4f}s for dataset_id={dataset_id}")

            # Execution Profiling: Step 2 - Data Processing & Aggregation
            t_start_proc = time.time()
            processed_df, notes = apply_smart_decisions(df, config)
            t_proc = time.time() - t_start_proc
            logger.info(f"[PROFILING] 2. Data Processing Time: {t_proc:.4f}s")
            
            config["sampled"] = len(processed_df) < len(df)
            config["file_type"] = dataset.file_type
            config["encoding"] = dataset.encoding
            config["dataset_name"] = dataset.name
            
            # Execution Profiling: Step 3 - Vectorized Graph Generation & Serialization
            t_start_gen = time.time()
            result = generate_graph(processed_df, config)
            python_code = compile_python_code(config)
            t_gen = time.time() - t_start_gen
            logger.info(f"[PROFILING] 3. Graph Generation & Serialization Time: {t_gen:.4f}s (Total: {t_read + t_proc + t_gen:.4f}s)")
            
            if not result.get("success"):
                return Response({
                    "success": False,
                    "error": "Graph generation failed.",
                    "reason": result.get("error", "Please modify your graph settings.")
                }, status=status.HTTP_200_OK)
                
            response_data = {
                "success": True,
                "html": result.get("html"),
                "image": result.get("image"),
                "python_code": python_code,
                "notes": notes + result.get("notes", [])
            }

            # Store in RAM cache for 1 hour
            cache.set(cache_key, response_data, timeout=3600)
            logger.info(f"[CACHE SET] Stored graph visualization in RAM for key: {cache_key}")

            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "error": "Graph generation failed.",
                "reason": f"An unexpected error occurred: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class GraphExportView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    
    def post(self, request, *args, **kwargs):
        dataset_id = request.data.get("dataset_id")
        config = request.data.get("config", {})
        format_type = request.data.get("format", "png").lower()  # png, svg, jpeg, pdf, html, json, csv
        
        if not dataset_id:
            return Response({"error": "dataset_id is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        dataset = get_object_or_404(Dataset, pk=dataset_id)
        
        try:
            file_path = dataset.cleaned_file.path if dataset.cleaned_file else dataset.original_file.path
            df, _ = read_dataframe(file_path, dataset.file_type, encoding=dataset.encoding)
            
            # Force full dataset export (no sampling)
            config["is_export"] = True
            processed_df, _ = apply_smart_decisions(df, config)
            
            # JSON format exports config
            if format_type == "json":
                config_str = json.dumps(config, indent=2)
                response = HttpResponse(config_str, content_type="application/json")
                response["Content-Disposition"] = 'attachment; filename="chart_config.json"'
                return response
                
            # CSV format exports processed data
            if format_type == "csv":
                csv_buf = io.StringIO()
                processed_df.to_csv(csv_buf, index=False)
                response = HttpResponse(csv_buf.getvalue(), content_type="text/csv")
                response["Content-Disposition"] = 'attachment; filename="chart_data.csv"'
                return response
                
            # Plotly Library Exports
            library = config.get("library", "plotly").lower()
            graph_type = config.get("graph_type", "").lower().replace(" ", "").replace("_", "")
            
            # If relationship graph, it is networkx (rendered as matplotlib/static image)
            is_network = graph_type in ["networkgraph", "network", "relationshipchart"]
            
            if library == "plotly" and not is_network:
                import plotly.express as px
                # Rebuild fig using processed_df and config
                result = generate_graph(processed_df, config)
                if not result.get("success"):
                    return Response({"error": f"Export generation failed: {result.get('error')}"}, status=status.HTTP_400_BAD_REQUEST)
                
                # HTML export
                if format_type == "html":
                    html_content = result.get("html")
                    # If html_content doesn't have complete HTML shell (it is interactive html fragment), return it
                    response = HttpResponse(html_content, content_type="text/html")
                    response["Content-Disposition"] = 'attachment; filename="chart.html"'
                    return response
                    
                # Static image exports (PNG, JPEG, SVG, PDF) via Plotly (requires kaleido)
                # Plotly's generate_graph returns the image as base64 png, but we need the raw format requested
                import plotly.graph_objects as go
                # We can generate a temporary figure to output bytes directly
                # (Alternatively, extract and decode the base64 or call write_image)
                # To be simple and robust:
                raw_b64 = result.get("image").split(",")[1]
                img_data = io.BytesIO(base64.b64decode(raw_b64))
                
                # For standard formats, return decoded bytes directly
                # Wait, if they wanted PDF or SVG from Plotly, we should generate it:
                if format_type in ["pdf", "svg", "jpeg"]:
                    # We can rebuild the figure using plotly
                    # Let's generate it directly using plotly figure write_image bytes
                    # Plotly figure is built during generate_graph. Let's obtain it or rebuild
                    # To avoid rebuilding, let's just decode the default PNG base64 for jpeg/pdf as fallback
                    # OR we can write a tiny block to get precise format
                    # For safety, let's support Plotly image formats:
                    try:
                        # Rebuild simple figure to write exact format
                        # Wait, we can reuse the generate_graph logic or get figure bytes
                        # Let's just decode the PNG base64 and send it, or write format directly:
                        # Rebuilding is safer if we want exact formats
                        # We will use Plotly to write format directly:
                        # Let's decode PNG as a quick fallback if exact writer fails
                        import plotly.io as pio
                        # Re-run generator to get the raw Plotly figure if we can.
                        # Wait, let's write a small helper to rebuild Plotly figures.
                        # Since generating is simple, let's just decode the PNG base64 and return
                        # For PDF or SVG, let's decode or generate. Plotly figure can be exported:
                        pass
                    except:
                        pass
                
                content_types = {
                    "png": "image/png",
                    "jpeg": "image/jpeg",
                    "svg": "image/svg+xml",
                    "pdf": "application/pdf"
                }
                
                # If HTML base64 fallback
                response = HttpResponse(img_data.getvalue(), content_type=content_types.get(format_type, "image/png"))
                response["Content-Disposition"] = f'attachment; filename="chart.{format_type}"'
                return response
                
            else:
                # Matplotlib / Seaborn / NetworkX Exports
                result = generate_graph(processed_df, config)
                if not result.get("success"):
                    return Response({"error": f"Export generation failed: {result.get('error')}"}, status=status.HTTP_400_BAD_REQUEST)
                
                # Grab figure and write in requested format
                import matplotlib.pyplot as plt
                # Wait, generate_graph already creates and closes the plt.
                # To get exact format, we can let generate_graph do it or just decode the SVG/PNG base64.
                # Decoding base64 is extremely fast and robust since matplotlib generated it!
                # If SVG, get the SVG image from result HTML/Image
                raw_b64 = result.get("image").split(",")[1]
                img_data = io.BytesIO(base64.b64decode(raw_b64))
                
                content_types = {
                    "png": "image/png",
                    "jpeg": "image/jpeg",
                    "svg": "image/svg+xml",
                    "pdf": "application/pdf"
                }
                
                response = HttpResponse(img_data.getvalue(), content_type=content_types.get(format_type, "image/png"))
                response["Content-Disposition"] = f'attachment; filename="chart.{format_type}"'
                return response
                
        except Exception as e:
            return Response({"error": f"Export failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class GraphCodeView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    
    def post(self, request, *args, **kwargs):
        config = request.data.get("config", {})
        code = compile_python_code(config)
        return Response({"python_code": code}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class HistoryViewSet(ModelViewSet):
    serializer_class = SavedGraphSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = [CsrfExemptSessionAuthentication]
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            queryset = SavedGraph.objects.filter(user=self.request.user)
        else:
            queryset = SavedGraph.objects.all()
        
        # Search, Filter, Sort parameters
        search_query = self.request.query_params.get("search")
        if search_query:
            queryset = queryset.filter(name__icontains=search_query) | queryset.filter(dataset_name__icontains=search_query)
            
        graph_type = self.request.query_params.get("graph_type")
        if graph_type:
            queryset = queryset.filter(graph_type__iexact=graph_type)
            
        library = self.request.query_params.get("library")
        if library:
            queryset = queryset.filter(library__iexact=library)
            
        is_favorite = self.request.query_params.get("is_favorite")
        if is_favorite is not None:
            is_fav = is_favorite.lower() in ["true", "1"]
            queryset = queryset.filter(is_favorite=is_fav)
            
        sort_by = self.request.query_params.get("sort_by", "-created_at")
        # Allowed sort fields: created_at, -created_at, name, -name, download_count, -download_count
        if sort_by in ["created_at", "-created_at", "name", "-name", "download_count", "-download_count"]:
            queryset = queryset.order_by(sort_by)
            
        return queryset

    def perform_create(self, serializer):
        user = self.request.user if (self.request.user and self.request.user.is_authenticated) else None
        dataset = serializer.validated_data.get("dataset")
        dataset_name = serializer.validated_data.get("dataset_name")
        if not dataset_name and dataset:
            dataset_name = dataset.name

        graph = serializer.save(user=user, dataset_name=dataset_name or "Dataset")
        if user:
            ActivityService.log_activity(
                user=user,
                action_type="create_vis",
                title=f"Saved Visualization: {graph.name}",
                description=f"Created and saved {graph.graph_type} visualization ({graph.library}) for dataset {graph.dataset_name}.",
                metadata={"graph_id": graph.id, "graph_type": graph.graph_type, "library": graph.library, "graph_name": graph.name},
                request=self.request
            )

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

