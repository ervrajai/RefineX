import io
import json
import os
import numpy as np
import pandas as pd
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.conf import settings
from apps.accounts.views import CsrfExemptSessionAuthentication
from apps.cleaning.models import Dataset
from apps.cleaning.utils import read_dataframe, make_json_safe
from .models import SavedGraph

import matplotlib
matplotlib.use('Agg')  # Non-interactive backend, thread-safe
import matplotlib.pyplot as plt
import seaborn as sns
import networkx as nx
import plotly.express as px


# ---------------------------------------------------------------------------
# Dataset List
# ---------------------------------------------------------------------------

class DatasetListView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]

    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            datasets = Dataset.objects.filter(user=request.user)
        else:
            datasets = Dataset.objects.all()

        data = []
        for ds in datasets:
            data.append({
                "id": ds.id,
                "name": ds.name,
                "created_at": ds.created_at,
                "status": ds.status,
                "file_type": ds.file_type
            })
        return Response(data, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Graph Generation (Single)
# ---------------------------------------------------------------------------

class VisualizationGenerateView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request, dataset_id, *args, **kwargs):
        dataset = get_object_or_404(Dataset, id=dataset_id)

        file_path = dataset.cleaned_file.path if dataset.cleaned_file else dataset.original_file.path
        file_type = dataset.file_type
        encoding = dataset.encoding

        try:
            df, _ = read_dataframe(file_path, file_type, encoding=encoding)
        except Exception as e:
            return Response({"error": f"Failed to load dataset: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        config = request.data.get("config", {})
        library = config.get("library", "plotly")
        chart_type = config.get("chart_type", "bar")
        x_col = config.get("x_column")
        y_col = config.get("y_column")
        color_col = config.get("color_column")

        title = config.get("title", "")
        x_label = config.get("x_label", x_col or "")
        y_label = config.get("y_label", y_col or "")
        orientation = config.get("orientation", "v")
        show_legend = config.get("show_legend", True)
        theme = config.get("theme", "")
        marker_size = int(config.get("marker_size", 8))
        marker_style = config.get("marker_style", "circle")
        bins = int(config.get("bins", 10))
        opacity = float(config.get("opacity", 1.0))
        palette = config.get("palette", "viridis")

        # Advanced properties
        font_family = config.get("font_family", "Arial")
        margin_top = int(config.get("margin_top", 60))
        margin_bottom = int(config.get("margin_bottom", 60))
        margin_left = int(config.get("margin_left", 60))
        margin_right = int(config.get("margin_right", 40))
        animation = bool(config.get("animation", False))

        if not x_col and chart_type != "heatmap":
            return Response({"error": "X-axis column is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            generator = PlotGenerator()
            code, graph_data = generator.generate_plot_and_code(
                df, dataset.name, file_type, library, chart_type, x_col, y_col, color_col,
                title, x_label, y_label, orientation, show_legend, theme,
                marker_size, marker_style, bins, opacity, palette,
                font_family, margin_top, margin_bottom, margin_left, margin_right, animation
            )
            return Response({
                "code": code,
                "graph_data": graph_data,
                "library": library
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Plot generation failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Generate All Valid Graphs
# ---------------------------------------------------------------------------

class GenerateAllView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request, dataset_id, *args, **kwargs):
        dataset = get_object_or_404(Dataset, id=dataset_id)

        file_path = dataset.cleaned_file.path if dataset.cleaned_file else dataset.original_file.path
        file_type = dataset.file_type
        encoding = dataset.encoding

        try:
            df, _ = read_dataframe(file_path, file_type, encoding=encoding)
        except Exception as e:
            return Response({"error": f"Failed to load dataset: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        x_col = request.data.get("x_column")
        y_col = request.data.get("y_column")
        color_col = request.data.get("color_column", "")

        if not x_col:
            return Response({"error": "x_column is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Determine valid chart types based on column types
        x_dtype = str(df[x_col].dtype) if x_col in df.columns else ""
        y_dtype = str(df[y_col].dtype) if y_col and y_col in df.columns else ""
        x_is_numeric = "int" in x_dtype or "float" in x_dtype
        y_is_numeric = "int" in y_dtype or "float" in y_dtype

        # Decide which charts are valid for the given columns
        valid_charts = []
        valid_charts.append(("bar", "plotly"))
        valid_charts.append(("histogram", "plotly"))
        if y_col:
            valid_charts.append(("line", "plotly"))
            if x_is_numeric and y_is_numeric:
                valid_charts.append(("scatter", "plotly"))
                valid_charts.append(("scatter", "seaborn"))
            valid_charts.append(("box", "plotly"))
            valid_charts.append(("bar", "seaborn"))
            valid_charts.append(("line", "seaborn"))

        # Always include heatmap for correlation
        valid_charts.append(("heatmap", "plotly"))

        generator = PlotGenerator()
        results = []

        for chart_type, library in valid_charts:
            try:
                cfg_title = f"{chart_type.capitalize()} — {x_col}" + (f" vs {y_col}" if y_col else "")
                code, graph_data = generator.generate_plot_and_code(
                    df, dataset.name, file_type, library, chart_type,
                    x_col, y_col, color_col,
                    title=cfg_title,
                    x_label=x_col,
                    y_label=y_col or "",
                    orientation="v",
                    show_legend=True,
                    theme="plotly_white" if library == "plotly" else "whitegrid",
                    marker_size=8,
                    marker_style="circle",
                    bins=15,
                    opacity=1.0,
                    palette="viridis",
                    font_family="Arial",
                    margin_top=60, margin_bottom=60, margin_left=60, margin_right=40,
                    animation=False
                )
                results.append({
                    "chart_type": chart_type,
                    "library": library,
                    "title": cfg_title,
                    "graph_data": graph_data,
                    "code": code,
                    "config": {
                        "library": library,
                        "chart_type": chart_type,
                        "x_column": x_col,
                        "y_column": y_col,
                        "color_column": color_col,
                        "title": cfg_title,
                        "x_label": x_col,
                        "y_label": y_col or "",
                        "orientation": "v",
                        "show_legend": True,
                        "theme": "plotly_white" if library == "plotly" else "whitegrid",
                        "marker_size": 8,
                        "marker_style": "circle",
                        "bins": 15,
                        "opacity": 1.0,
                        "palette": "viridis",
                        "font_family": "Arial",
                        "margin_top": 60,
                        "margin_bottom": 60,
                        "margin_left": 60,
                        "margin_right": 40,
                        "animation": False
                    }
                })
            except Exception:
                # Skip charts that fail (e.g., incompatible column types)
                continue

        return Response({"graphs": results}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Graph Recommendation System
# ---------------------------------------------------------------------------

class GraphRecommendationView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]

    def get(self, request, dataset_id, *args, **kwargs):
        dataset = get_object_or_404(Dataset, id=dataset_id)

        file_path = dataset.cleaned_file.path if dataset.cleaned_file else dataset.original_file.path
        file_type = dataset.file_type
        encoding = dataset.encoding

        try:
            df, _ = read_dataframe(file_path, file_type, encoding=encoding)
        except Exception as e:
            return Response({"error": f"Failed to load dataset: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        recommendations = self._generate_recommendations(df)
        return Response({"recommendations": recommendations}, status=status.HTTP_200_OK)

    def _generate_recommendations(self, df):
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
        bool_cols = df.select_dtypes(include=["bool"]).columns.tolist()
        datetime_cols = df.select_dtypes(include=["datetime64"]).columns.tolist()

        recommendations = []

        # ---- 1. Scatter plot (two numeric cols)
        if len(numeric_cols) >= 2:
            x, y = numeric_cols[0], numeric_cols[1]
            corr_val = abs(df[x].corr(df[y]))
            conf = min(99, int(60 + corr_val * 35))
            recommendations.append({
                "title": f"Scatter Plot: {x} vs {y}",
                "chart_type": "scatter",
                "library": "plotly",
                "confidence": conf,
                "reason": f"Two numeric columns detected ({x}, {y}). Correlation coefficient: {corr_val:.2f}. Scatter plots reveal relationships and outliers.",
                "config": {
                    "library": "plotly",
                    "chart_type": "scatter",
                    "x_column": x,
                    "y_column": y,
                    "title": f"Scatter Plot: {x} vs {y}",
                    "x_label": x,
                    "y_label": y,
                    "theme": "plotly_white"
                }
            })

        # ---- 2. Histogram (single numeric distribution)
        if numeric_cols:
            x = numeric_cols[0]
            skew = abs(float(df[x].skew()))
            conf = 90 if skew > 1.5 else 80
            recommendations.append({
                "title": f"Histogram: Distribution of {x}",
                "chart_type": "histogram",
                "library": "plotly",
                "confidence": conf,
                "reason": f"'{x}' is numeric with skewness {skew:.2f}. Histograms reveal distribution shape and outliers.",
                "config": {
                    "library": "plotly",
                    "chart_type": "histogram",
                    "x_column": x,
                    "title": f"Distribution of {x}",
                    "x_label": x,
                    "theme": "plotly_white",
                    "bins": 20
                }
            })

        # ---- 3. Bar chart (categorical + numeric)
        if categorical_cols and numeric_cols:
            x, y = categorical_cols[0], numeric_cols[0]
            n_cats = df[x].nunique()
            conf = 95 if n_cats <= 15 else 70
            recommendations.append({
                "title": f"Bar Chart: {y} by {x}",
                "chart_type": "bar",
                "library": "plotly",
                "confidence": conf,
                "reason": f"'{x}' is categorical ({n_cats} unique values) and '{y}' is numeric. Bar charts compare values across categories.",
                "config": {
                    "library": "plotly",
                    "chart_type": "bar",
                    "x_column": x,
                    "y_column": y,
                    "title": f"{y} by {x}",
                    "x_label": x,
                    "y_label": y,
                    "theme": "plotly_white"
                }
            })

        # ---- 4. Box plot (categorical + numeric, spread analysis)
        if categorical_cols and numeric_cols:
            x, y = categorical_cols[0], numeric_cols[0]
            recommendations.append({
                "title": f"Box Plot: {y} by {x}",
                "chart_type": "box",
                "library": "plotly",
                "confidence": 85,
                "reason": f"Box plots show the spread, quartiles and outliers of '{y}' across groups of '{x}'.",
                "config": {
                    "library": "plotly",
                    "chart_type": "box",
                    "x_column": x,
                    "y_column": y,
                    "title": f"Distribution of {y} by {x}",
                    "x_label": x,
                    "y_label": y,
                    "theme": "plotly_white"
                }
            })

        # ---- 5. Correlation Heatmap (multiple numeric columns)
        if len(numeric_cols) >= 3:
            recommendations.append({
                "title": "Correlation Heatmap",
                "chart_type": "heatmap",
                "library": "plotly",
                "confidence": 88,
                "reason": f"Dataset has {len(numeric_cols)} numeric columns. A correlation heatmap reveals linear relationships between all pairs at once.",
                "config": {
                    "library": "plotly",
                    "chart_type": "heatmap",
                    "x_column": "",
                    "y_column": "",
                    "title": "Correlation Heatmap",
                    "theme": "plotly_white"
                }
            })

        # ---- 6. Line chart (datetime + numeric)
        if datetime_cols and numeric_cols:
            x, y = datetime_cols[0], numeric_cols[0]
            recommendations.append({
                "title": f"Line Chart: {y} over time",
                "chart_type": "line",
                "library": "plotly",
                "confidence": 97,
                "reason": f"'{x}' is a datetime column. Line charts are ideal for tracking '{y}' trends over time.",
                "config": {
                    "library": "plotly",
                    "chart_type": "line",
                    "x_column": x,
                    "y_column": y,
                    "title": f"{y} Over Time",
                    "x_label": x,
                    "y_label": y,
                    "theme": "plotly_white"
                }
            })

        # ---- 7. Seaborn Scatter (for richer aesthetic)
        if len(numeric_cols) >= 2:
            x, y = numeric_cols[0], numeric_cols[1]
            color = categorical_cols[0] if categorical_cols else None
            recommendations.append({
                "title": f"Seaborn Scatter (Styled): {x} vs {y}",
                "chart_type": "scatter",
                "library": "seaborn",
                "confidence": 78,
                "reason": "Seaborn provides publication-quality styling. Use it for crisp SVG exports or academic reports.",
                "config": {
                    "library": "seaborn",
                    "chart_type": "scatter",
                    "x_column": x,
                    "y_column": y,
                    "color_column": color or "",
                    "title": f"Seaborn Scatter: {x} vs {y}",
                    "x_label": x,
                    "y_label": y,
                    "theme": "whitegrid",
                    "palette": "viridis"
                }
            })

        # Sort by confidence descending
        recommendations.sort(key=lambda r: r["confidence"], reverse=True)
        return recommendations


# ---------------------------------------------------------------------------
# Saved Graph History — List & Create
# ---------------------------------------------------------------------------

class SavedGraphListView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]

    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            graphs = SavedGraph.objects.filter(user=request.user)
        else:
            graphs = SavedGraph.objects.all()

        data = []
        for g in graphs:
            data.append({
                "id": g.id,
                "title": g.title,
                "is_favorite": g.is_favorite,
                "chart_config": g.chart_config,
                "dataset_id": g.dataset_id,
                "dataset_name": g.dataset.name,
                "created_at": g.created_at.isoformat(),
            })
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        dataset_id = request.data.get("dataset_id")
        title = request.data.get("title", "Untitled Graph")
        chart_config = request.data.get("chart_config", {})

        if not dataset_id:
            return Response({"error": "dataset_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        dataset = get_object_or_404(Dataset, id=dataset_id)

        graph = SavedGraph.objects.create(
            user=request.user if request.user.is_authenticated else None,
            dataset=dataset,
            title=title,
            chart_config=chart_config
        )
        return Response({
            "id": graph.id,
            "title": graph.title,
            "is_favorite": graph.is_favorite,
            "chart_config": graph.chart_config,
            "dataset_id": graph.dataset_id,
            "dataset_name": dataset.name,
            "created_at": graph.created_at.isoformat(),
        }, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Saved Graph History — Detail: Update & Delete
# ---------------------------------------------------------------------------

class SavedGraphDetailView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]

    def patch(self, request, pk, *args, **kwargs):
        graph = get_object_or_404(SavedGraph, id=pk)
        is_favorite = request.data.get("is_favorite")
        title = request.data.get("title")

        if is_favorite is not None:
            graph.is_favorite = bool(is_favorite)
        if title is not None:
            graph.title = title
        graph.save()

        return Response({
            "id": graph.id,
            "title": graph.title,
            "is_favorite": graph.is_favorite,
        }, status=status.HTTP_200_OK)

    def delete(self, request, pk, *args, **kwargs):
        graph = get_object_or_404(SavedGraph, id=pk)
        graph.delete()
        return Response({"message": "Graph deleted."}, status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# PlotGenerator — Shared logic used by Generate, GenerateAll
# ---------------------------------------------------------------------------

class PlotGenerator:

    def generate_plot_and_code(
        self, df, filename, file_type, library, chart_type, x_col, y_col, color_col,
        title, x_label, y_label, orientation, show_legend, theme,
        marker_size, marker_style, bins, opacity, palette,
        font_family="Arial", margin_top=60, margin_bottom=60, margin_left=60, margin_right=40,
        animation=False
    ):
        file_suffix = "csv" if file_type.lower() == "csv" else "xlsx"
        display_filename = f"dataset.{file_suffix}"

        required_cols = [col for col in [x_col, y_col, color_col] if col]
        df_clean = df.copy()
        if required_cols:
            df_clean = df_clean.dropna(subset=[col for col in required_cols if col in df_clean.columns])

        code = self.build_python_code(
            display_filename, file_type, library, chart_type, x_col, y_col, color_col,
            title, x_label, y_label, orientation, show_legend, theme,
            marker_size, marker_style, bins, opacity, palette,
            font_family, margin_top, margin_bottom, margin_left, margin_right, animation
        )

        graph_data = ""

        if library == "plotly":
            fig = None
            plotly_template = theme if theme in ["plotly", "plotly_white", "plotly_dark", "ggplot2", "seaborn", "simple_white", "none"] else "plotly_white"

            x_val, y_val = x_col, y_col
            if orientation == "h" and chart_type in ["bar", "box"]:
                x_val, y_val = y_col, x_col

            labels_dict = {}
            if x_col:
                labels_dict[x_col] = x_label
            if y_col:
                labels_dict[y_col] = y_label

            if chart_type == "bar":
                if animation and y_col and color_col and color_col in df_clean.columns:
                    fig = px.bar(
                        df_clean, x=x_val, y=y_val,
                        color=color_col,
                        animation_frame=color_col,
                        orientation=orientation, opacity=opacity, title=title, labels=labels_dict
                    )
                else:
                    fig = px.bar(
                        df_clean, x=x_val, y=y_val,
                        color=color_col if color_col in df_clean.columns else None,
                        orientation=orientation, opacity=opacity, title=title, labels=labels_dict
                    )
            elif chart_type == "line":
                fig = px.line(
                    df_clean, x=x_val, y=y_val,
                    color=color_col if color_col in df_clean.columns else None,
                    opacity=opacity, title=title, labels=labels_dict
                )
            elif chart_type == "scatter":
                plotly_markers = {"circle": "circle", "square": "square", "diamond": "diamond", "triangle": "triangle-up", "star": "star"}
                sym = plotly_markers.get(marker_style, "circle")
                if animation and color_col and color_col in df_clean.columns:
                    fig = px.scatter(
                        df_clean, x=x_col, y=y_col,
                        color=color_col,
                        animation_frame=color_col,
                        opacity=opacity, title=title, labels=labels_dict
                    )
                else:
                    fig = px.scatter(
                        df_clean, x=x_col, y=y_col,
                        color=color_col if color_col in df_clean.columns else None,
                        opacity=opacity, title=title, labels=labels_dict
                    )
                fig.update_traces(marker=dict(size=marker_size, symbol=sym))
            elif chart_type == "histogram":
                fig = px.histogram(
                    df_clean, x=x_col, y=y_col if y_col else None,
                    nbins=bins, color=color_col if color_col in df_clean.columns else None,
                    opacity=opacity, title=title, labels=labels_dict
                )
            elif chart_type == "box":
                fig = px.box(
                    df_clean, x=x_val, y=y_val,
                    color=color_col if color_col in df_clean.columns else None,
                    orientation=orientation, opacity=opacity, title=title, labels=labels_dict
                )
            elif chart_type == "heatmap":
                if not x_col or not y_col:
                    num_df = df_clean.select_dtypes(include=[np.number])
                    if num_df.empty:
                        raise ValueError("No numeric columns found for correlation heatmap.")
                    corr_df = num_df.corr()
                    fig = px.imshow(corr_df, title=title or "Correlation Heatmap", text_auto=True, aspect="auto")
                else:
                    pivot_df = df_clean.pivot_table(index=y_col, columns=x_col, values=color_col, aggfunc='mean' if color_col else 'count')
                    fig = px.imshow(pivot_df, title=title, labels=dict(x=x_label, y=y_label, color=color_col or "Count"), aspect="auto")

            if fig is not None:
                fig.update_layout(
                    template=plotly_template,
                    showlegend=show_legend,
                    font=dict(family=font_family),
                    margin=dict(t=margin_top, b=margin_bottom, l=margin_left, r=margin_right)
                )
                graph_data = fig.to_json()
            else:
                raise ValueError("Unsupported chart type for Plotly")

        else:
            plt.close('all')
            if library == "seaborn":
                sns.set_theme(style="whitegrid" if theme not in ["darkgrid", "whitegrid", "dark", "white", "ticks"] else theme)
                if palette:
                    sns.set_palette(palette)
            else:
                mpl_theme = theme if theme in plt.style.available else "default"
                if mpl_theme != "default":
                    plt.style.use(mpl_theme)

            fig, ax = plt.subplots(figsize=(10, 6))

            if library == "matplotlib":
                if chart_type == "bar":
                    if orientation == "h":
                        ax.barh(df_clean[x_col].astype(str), df_clean[y_col] if y_col else range(len(df_clean)), alpha=opacity, color=self.get_mpl_color(palette))
                    else:
                        ax.bar(df_clean[x_col].astype(str), df_clean[y_col] if y_col else range(len(df_clean)), alpha=opacity, color=self.get_mpl_color(palette))
                elif chart_type == "line":
                    ax.plot(df_clean[x_col], df_clean[y_col] if y_col else range(len(df_clean)), alpha=opacity, color=self.get_mpl_color(palette), marker=self.get_mpl_marker(marker_style), markersize=marker_size)
                elif chart_type == "scatter":
                    if color_col and color_col in df_clean.columns:
                        scatter = ax.scatter(df_clean[x_col], df_clean[y_col], alpha=opacity, c=pd.factorize(df_clean[color_col])[0], cmap=palette, s=marker_size * 5, marker=self.get_mpl_marker(marker_style))
                        if show_legend:
                            legend_elements = scatter.legend_elements()
                            if legend_elements:
                                ax.legend(*legend_elements, title=color_col)
                    else:
                        ax.scatter(df_clean[x_col], df_clean[y_col], alpha=opacity, color=self.get_mpl_color(palette), s=marker_size * 5, marker=self.get_mpl_marker(marker_style))
                elif chart_type == "histogram":
                    ax.hist(df_clean[x_col], bins=bins, alpha=opacity, color=self.get_mpl_color(palette), edgecolor='black')
                elif chart_type == "box":
                    if orientation == "h":
                        ax.boxplot(df_clean[x_col], vert=False)
                    else:
                        ax.boxplot(df_clean[x_col], vert=True)
                elif chart_type == "heatmap":
                    if not x_col or not y_col:
                        num_df = df_clean.select_dtypes(include=[np.number])
                        corr_df = num_df.corr()
                        cax = ax.matshow(corr_df, cmap=palette or 'viridis')
                        fig.colorbar(cax)
                        ax.set_xticks(range(len(corr_df.columns)))
                        ax.set_yticks(range(len(corr_df.columns)))
                        ax.set_xticklabels(corr_df.columns, rotation=45, ha='left')
                        ax.set_yticklabels(corr_df.columns)
                    else:
                        pivot_df = df_clean.pivot_table(index=y_col, columns=x_col, values=color_col, aggfunc='mean' if color_col else 'count')
                        cax = ax.imshow(pivot_df, cmap=palette or 'viridis', aspect='auto')
                        fig.colorbar(cax)
                        ax.set_xticks(range(len(pivot_df.columns)))
                        ax.set_yticks(range(len(pivot_df.index)))
                        ax.set_xticklabels(pivot_df.columns, rotation=45)
                        ax.set_yticklabels(pivot_df.index)

            elif library == "seaborn":
                if chart_type == "bar":
                    sns.barplot(
                        data=df_clean,
                        x=x_col if orientation == "v" else y_col,
                        y=y_col if orientation == "v" else x_col,
                        hue=color_col if color_col in df_clean.columns else None,
                        ax=ax, alpha=opacity, orient=orientation
                    )
                elif chart_type == "line":
                    sns.lineplot(
                        data=df_clean, x=x_col, y=y_col,
                        hue=color_col if color_col in df_clean.columns else None,
                        ax=ax, alpha=opacity, marker=self.get_mpl_marker(marker_style),
                        markersize=marker_size
                    )
                elif chart_type == "scatter":
                    sns.scatterplot(
                        data=df_clean, x=x_col, y=y_col,
                        hue=color_col if color_col in df_clean.columns else None,
                        ax=ax, alpha=opacity, s=marker_size * 5,
                        marker=self.get_mpl_marker(marker_style)
                    )
                elif chart_type == "histogram":
                    sns.histplot(
                        data=df_clean, x=x_col, y=y_col if y_col else None,
                        hue=color_col if color_col in df_clean.columns else None,
                        bins=bins, ax=ax, alpha=opacity, kde=True
                    )
                elif chart_type == "box":
                    sns.boxplot(
                        data=df_clean,
                        x=x_col if orientation == "v" else y_col,
                        y=y_col if orientation == "v" else x_col,
                        hue=color_col if color_col in df_clean.columns else None,
                        ax=ax, orient=orientation
                    )
                elif chart_type == "heatmap":
                    if not x_col or not y_col:
                        num_df = df_clean.select_dtypes(include=[np.number])
                        corr_df = num_df.corr()
                        sns.heatmap(corr_df, annot=True, cmap=palette or 'viridis', ax=ax)
                    else:
                        pivot_df = df_clean.pivot_table(index=y_col, columns=x_col, values=color_col, aggfunc='mean' if color_col else 'count')
                        sns.heatmap(pivot_df, annot=True, cmap=palette or 'viridis', ax=ax)

            elif library == "network":
                G = nx.from_pandas_edgelist(df_clean, source=x_col, target=y_col if y_col else x_col)
                pos = nx.spring_layout(G, seed=42)
                node_col = self.get_mpl_color(palette) or "skyblue"
                nx.draw(
                    G, pos, with_labels=True, node_color=node_col,
                    edge_color="gray", node_size=600, font_size=8, ax=ax,
                    alpha=opacity, width=1.2
                )

            if library != "network":
                ax.set_title(title, fontsize=14, fontweight="bold", fontfamily=font_family)
                ax.set_xlabel(x_label, fontsize=12, fontfamily=font_family)
                ax.set_ylabel(y_label, fontsize=12, fontfamily=font_family)
                if not show_legend:
                    legend = ax.get_legend()
                    if legend:
                        legend.remove()
            else:
                ax.set_title(title or "Network Relationship Graph", fontsize=14, fontweight="bold", fontfamily=font_family)

            plt.tight_layout(pad=2.0)
            buf = io.BytesIO()
            fig.savefig(buf, format='svg', bbox_inches='tight')
            buf.seek(0)
            graph_data = buf.getvalue().decode('utf-8')
            plt.close(fig)

        return code, graph_data

    def get_mpl_color(self, palette):
        colors = {
            "viridis": "#440154",
            "plasma": "#0d0887",
            "inferno": "#000004",
            "magma": "#000004",
            "coolwarm": "#3b4cc0",
            "tab10": "#1f77b4"
        }
        return colors.get(palette, None)

    def get_mpl_marker(self, style):
        markers = {
            "circle": "o",
            "square": "s",
            "diamond": "D",
            "triangle": "^",
            "star": "*"
        }
        return markers.get(style, "o")

    def build_python_code(
        self, filename, file_type, library, chart_type, x_col, y_col, color_col,
        title, x_label, y_label, orientation, show_legend, theme,
        marker_size, marker_style, bins, opacity, palette,
        font_family="Arial", margin_top=60, margin_bottom=60, margin_left=60, margin_right=40,
        animation=False
    ):
        read_stmt = f"df = pd.read_csv('{filename}')" if file_type.lower() == "csv" else f"df = pd.read_excel('{filename}')"
        cols = [col for col in [x_col, y_col, color_col] if col]
        cols_str = str(cols)

        if library == "plotly":
            labels_dict = {}
            if x_col:
                labels_dict[x_col] = x_label
            if y_col:
                labels_dict[y_col] = y_label

            code = f"""import pandas as pd
import plotly.express as px

# 1. Load the dataset
{read_stmt}

# 2. Filter required columns and drop missing rows
df_clean = df[{cols_str}].dropna()
"""
            if chart_type == "bar":
                anim_frame = f', animation_frame="{color_col}"' if animation and color_col else ""
                code += f"""
# 3. Generate Plotly Bar Chart
fig = px.bar(
    df_clean,
    x="{x_col}",
    y="{y_col}" if "{y_col}" else None,
    color={f'"{color_col}"' if color_col else "None"},
    orientation="{orientation}",
    opacity={opacity},
    title="{title}",
    labels={labels_dict}{anim_frame}
)
"""
            elif chart_type == "line":
                code += f"""
# 3. Generate Plotly Line Chart
fig = px.line(
    df_clean,
    x="{x_col}",
    y="{y_col}" if "{y_col}" else None,
    color={f'"{color_col}"' if color_col else "None"},
    opacity={opacity},
    title="{title}",
    labels={labels_dict}
)
"""
            elif chart_type == "scatter":
                plotly_markers = {"circle": "circle", "square": "square", "diamond": "diamond", "triangle": "triangle-up", "star": "star"}
                sym = plotly_markers.get(marker_style, "circle")
                anim_frame = f', animation_frame="{color_col}"' if animation and color_col else ""
                code += f"""
# 3. Generate Plotly Scatter Plot
fig = px.scatter(
    df_clean,
    x="{x_col}",
    y="{y_col}",
    color={f'"{color_col}"' if color_col else "None"},
    opacity={opacity},
    title="{title}",
    labels={labels_dict}{anim_frame}
)
fig.update_traces(marker=dict(size={marker_size}, symbol="{sym}"))
"""
            elif chart_type == "histogram":
                code += f"""
# 3. Generate Plotly Histogram
fig = px.histogram(
    df_clean,
    x="{x_col}",
    y="{y_col}" if "{y_col}" else None,
    nbins={bins},
    color={f'"{color_col}"' if color_col else "None"},
    opacity={opacity},
    title="{title}",
    labels={labels_dict}
)
"""
            elif chart_type == "box":
                code += f"""
# 3. Generate Plotly Box Plot
fig = px.box(
    df_clean,
    x="{x_col}",
    y="{y_col}" if "{y_col}" else None,
    color={f'"{color_col}"' if color_col else "None"},
    orientation="{orientation}",
    opacity={opacity},
    title="{title}",
    labels={labels_dict}
)
"""
            elif chart_type == "heatmap":
                if not x_col or not y_col:
                    code += f"""
# 3. Generate Correlation Heatmap
num_df = df_clean.select_dtypes(include=['number'])
corr_df = num_df.corr()
fig = px.imshow(
    corr_df,
    title="{title or 'Correlation Heatmap'}",
    text_auto=True,
    aspect="auto"
)
"""
                else:
                    code += f"""
# 3. Generate Custom Pivot Heatmap
pivot_df = df_clean.pivot_table(
    index="{y_col}",
    columns="{x_col}",
    values={f'"{color_col}"' if color_col else "None"},
    aggfunc='mean' if '{color_col}' else 'count'
)
fig = px.imshow(
    pivot_df,
    title="{title}",
    labels=dict(x="{x_label}", y="{y_label}", color="{color_col or 'Count'}"),
    aspect="auto"
)
"""
            plotly_template = theme if theme in ["plotly", "plotly_white", "plotly_dark", "ggplot2", "seaborn", "simple_white", "none"] else "plotly_white"
            code += f"""
# 4. Customize Layout, Font and Margins
fig.update_layout(
    template="{plotly_template}",
    showlegend={show_legend},
    font=dict(family="{font_family}"),
    margin=dict(t={margin_top}, b={margin_bottom}, l={margin_left}, r={margin_right})
)

# 5. Display Interactive Graph
fig.show()
"""
            return code

        code = f"""import pandas as pd
import matplotlib.pyplot as plt
"""
        if library == "seaborn":
            code += "import seaborn as sns\n"
        elif library == "network":
            code += "import networkx as nx\n"

        code += f"""
# 1. Load dataset
{read_stmt}

# 2. Filter columns and clean missing rows
df_clean = df[{cols_str}].dropna()
"""
        if library == "seaborn":
            sns_style = theme if theme in ["darkgrid", "whitegrid", "dark", "white", "ticks"] else "whitegrid"
            code += f"""
# 3. Apply Seaborn Styling and Palette
sns.set_theme(style="{sns_style}")
"""
            if palette:
                code += f"sns.set_palette('{palette}')\n"
        else:
            mpl_style = theme if theme in plt.style.available else "default"
            code += f"""
# 3. Apply Matplotlib Theme Style
plt.style.use("{mpl_style}")
"""

        code += f"""
# 4. Create Figure and Plot
fig, ax = plt.subplots(figsize=(10, 6))
"""
        if library == "seaborn":
            if chart_type == "bar":
                code += f"""sns.barplot(
    data=df_clean,
    x="{x_col}" if "{orientation}" == "v" else "{y_col}",
    y="{y_col}" if "{orientation}" == "v" else "{x_col}",
    hue={f'"{color_col}"' if color_col else "None"},
    ax=ax,
    alpha={opacity},
    orient="{orientation}"
)"""
            elif chart_type == "line":
                code += f"""sns.lineplot(
    data=df_clean,
    x="{x_col}",
    y="{y_col}",
    hue={f'"{color_col}"' if color_col else "None"},
    ax=ax,
    alpha={opacity},
    marker="{self.get_mpl_marker(marker_style)}",
    markersize={marker_size}
)"""
            elif chart_type == "scatter":
                code += f"""sns.scatterplot(
    data=df_clean,
    x="{x_col}",
    y="{y_col}",
    hue={f'"{color_col}"' if color_col else "None"},
    ax=ax,
    alpha={opacity},
    s={marker_size * 5},
    marker="{self.get_mpl_marker(marker_style)}"
)"""
            elif chart_type == "histogram":
                code += f"""sns.histplot(
    data=df_clean,
    x="{x_col}",
    y="{y_col}" if "{y_col}" else None,
    hue={f'"{color_col}"' if color_col else "None"},
    bins={bins},
    ax=ax,
    alpha={opacity},
    kde=True
)"""
            elif chart_type == "box":
                code += f"""sns.boxplot(
    data=df_clean,
    x="{x_col}" if "{orientation}" == "v" else "{y_col}",
    y="{y_col}" if "{orientation}" == "v" else "{x_col}",
    hue={f'"{color_col}"' if color_col else "None"},
    ax=ax,
    orient="{orientation}"
)"""
            elif chart_type == "heatmap":
                if not x_col or not y_col:
                    code += """num_df = df_clean.select_dtypes(include=['number'])
corr_df = num_df.corr()
sns.heatmap(corr_df, annot=True, cmap="viridis", ax=ax)"""
                else:
                    code += f"""pivot_df = df_clean.pivot_table(
    index="{y_col}",
    columns="{x_col}",
    values={f'"{color_col}"' if color_col else "None"},
    aggfunc='mean' if '{color_col}' else 'count'
)
sns.heatmap(pivot_df, annot=True, cmap="{palette or 'viridis'}", ax=ax)"""

        elif library == "matplotlib":
            c_arg = f", color='{self.get_mpl_color(palette)}'" if self.get_mpl_color(palette) else ""
            if chart_type == "bar":
                if orientation == "h":
                    code += f"""ax.barh(
    df_clean["{x_col}"].astype(str),
    df_clean["{y_col}"] if "{y_col}" else range(len(df_clean)),
    alpha={opacity}{c_arg}
)"""
                else:
                    code += f"""ax.bar(
    df_clean["{x_col}"].astype(str),
    df_clean["{y_col}"] if "{y_col}" else range(len(df_clean)),
    alpha={opacity}{c_arg}
)"""
            elif chart_type == "line":
                code += f"""ax.plot(
    df_clean["{x_col}"],
    df_clean["{y_col}"] if "{y_col}" else range(len(df_clean)),
    alpha={opacity},
    marker="{self.get_mpl_marker(marker_style)}",
    markersize={marker_size}{c_arg}
)"""
            elif chart_type == "scatter":
                if color_col:
                    code += f"""scatter = ax.scatter(
    df_clean["{x_col}"],
    df_clean["{y_col}"],
    alpha={opacity},
    c=pd.factorize(df_clean["{color_col}"])[0],
    cmap="{palette or 'viridis'}",
    s={marker_size * 5},
    marker="{self.get_mpl_marker(marker_style)}"
)"""
                    if show_legend:
                        code += f"""
legend_elements = scatter.legend_elements()
if legend_elements:
    ax.legend(*legend_elements, title="{color_col}")
"""
                else:
                    code += f"""ax.scatter(
    df_clean["{x_col}"],
    df_clean["{y_col}"],
    alpha={opacity},
    s={marker_size * 5},
    marker="{self.get_mpl_marker(marker_style)}"{c_arg}
)"""
            elif chart_type == "histogram":
                code += f"""ax.hist(
    df_clean["{x_col}"],
    bins={bins},
    alpha={opacity},
    edgecolor="black"{c_arg}
)"""
            elif chart_type == "box":
                vert_val = "False" if orientation == "h" else "True"
                code += f"""ax.boxplot(
    df_clean["{x_col}"],
    vert={vert_val}
)"""
            elif chart_type == "heatmap":
                if not x_col or not y_col:
                    code += f"""num_df = df_clean.select_dtypes(include=['number'])
corr_df = num_df.corr()
cax = ax.matshow(corr_df, cmap="{palette or 'viridis'}")
fig.colorbar(cax)
ax.set_xticks(range(len(corr_df.columns)))
ax.set_yticks(range(len(corr_df.columns)))
ax.set_xticklabels(corr_df.columns, rotation=45, ha='left')
ax.set_yticklabels(corr_df.columns)"""
                else:
                    code += f"""pivot_df = df_clean.pivot_table(
    index="{y_col}",
    columns="{x_col}",
    values={f'"{color_col}"' if color_col else "None"},
    aggfunc='mean' if '{color_col}' else 'count'
)
cax = ax.imshow(pivot_df, cmap="{palette or 'viridis'}", aspect="auto")
fig.colorbar(cax)
ax.set_xticks(range(len(pivot_df.columns)))
ax.set_yticks(range(len(pivot_df.index)))
ax.set_xticklabels(pivot_df.columns, rotation=45)
ax.set_yticklabels(pivot_df.index)"""

        elif library == "network":
            node_color_stmt = f"'{self.get_mpl_color(palette)}'" if self.get_mpl_color(palette) else "'skyblue'"
            code += f"""
# 4. Construct Network Graph from edgelist
G = nx.from_pandas_edgelist(
    df_clean,
    source="{x_col}",
    target="{y_col}"
)

# 5. Compute node positions
pos = nx.spring_layout(G, seed=42)

# 6. Draw graph elements
nx.draw(
    G,
    pos,
    with_labels=True,
    node_color={node_color_stmt},
    edge_color="gray",
    node_size=600,
    font_size=8,
    ax=ax,
    alpha={opacity},
    width=1.2
)
"""

        if library != "network":
            code += f"""
# 5. Set Chart Titles, Labels and Font
ax.set_title("{title}", fontsize=14, fontweight="bold", fontfamily="{font_family}")
ax.set_xlabel("{x_label}", fontsize=12, fontfamily="{font_family}")
ax.set_ylabel("{y_label}", fontsize=12, fontfamily="{font_family}")
"""
            if not show_legend:
                code += """
# Hide Legend
legend = ax.get_legend()
if legend:
    legend.remove()
"""
        else:
            code += f"""
# 7. Set Chart Title
ax.set_title("{title or 'Network Relationship Graph'}", fontsize=14, fontweight="bold", fontfamily="{font_family}")
"""

        code += """
# 6. Layout Adjustment and Show
plt.tight_layout()
plt.show()
"""
        return code
