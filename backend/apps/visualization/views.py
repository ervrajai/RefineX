import io
import json
import base64
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from apps.accounts.views import CsrfExemptSessionAuthentication

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
            return Response({"error": "dataset_id and graph_type are required fields."}, status=status.HTTP_400_BAD_REQUEST)
            
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
            return Response({"error": "dataset_id is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        dataset = get_object_or_404(Dataset, pk=dataset_id)
        analysis = get_dataset_analysis(dataset)
        
        graph_type = config.get("graph_type")
        if not graph_type:
            return Response({"error": "graph_type config parameter is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        # First, run validation
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
                "error": f"{graph_type} cannot be generated.",
                "reason": err_msg,
                "recommended": rec_type
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # Read dataset file
            file_path = dataset.cleaned_file.path if dataset.cleaned_file else dataset.original_file.path
            df, _ = read_dataframe(file_path, dataset.file_type, encoding=dataset.encoding)
            
            # Apply decisions (sampling, aggregation)
            processed_df, notes = apply_smart_decisions(df, config)
            
            # Record if it was sampled
            config["sampled"] = len(processed_df) < len(df)
            config["file_type"] = dataset.file_type
            config["encoding"] = dataset.encoding
            config["dataset_name"] = dataset.name
            
            # Generate graph
            result = generate_graph(processed_df, config)
            
            if not result.get("success"):
                return Response({
                    "error": "Graph generation failed.",
                    "reason": result.get("error", "Please modify your graph settings.")
                }, status=status.HTTP_400_BAD_REQUEST)
                
            # Compile Python code
            python_code = compile_python_code(config)
            
            return Response({
                "html": result.get("html"),
                "image": result.get("image"),
                "python_code": python_code,
                "notes": notes + result.get("notes", [])
            }, status=status.HTTP_200_OK)
            
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
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [CsrfExemptSessionAuthentication]
    
    def get_queryset(self):
        # Only return graphs saved by this user
        queryset = SavedGraph.objects.filter(user=self.request.user)
        
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
        graph = serializer.save(user=self.request.user)
        ActivityService.log_activity(
            user=self.request.user,
            action_type="create_vis",
            title=f"Saved Visualization: {graph.name}",
            description=f"Created and saved {graph.graph_type} visualization ({graph.library}) for dataset {graph.dataset_name}.",
            metadata={"graph_id": graph.id, "graph_type": graph.graph_type, "library": graph.library},
            request=self.request
        )

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

