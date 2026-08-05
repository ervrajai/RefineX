import io
import base64
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
import networkx as nx

HEATMAP_COLORMAP_MAP = {
    "deep": "Purples",
    "muted": "Blues",
    "bright": "plasma",
    "dark": "magma",
    "colorblind": "viridis",
    "pastel": "coolwarm",
    "viridis": "viridis",
    "plasma": "plasma",
    "magma": "magma",
    "cividis": "cividis",
    "coolwarm": "coolwarm",
    "rdbu": "RdBu",
    "rocket": "rocket",
    "mako": "mako",
    "vlag": "vlag",
    "blues": "Blues",
    "purples": "Purples",
    "greens": "Greens",
    "oranges": "Oranges",
    "spectral": "Spectral",
    "inferno": "inferno",
    "turbo": "turbo",
    "portland": "portland",
}

def resolve_heatmap_cmap(palette_name):
    if not palette_name:
        return "viridis"
    cleaned = str(palette_name).strip().lower()
    return HEATMAP_COLORMAP_MAP.get(cleaned, "viridis")

def generate_graph(df, config):
    """
    Main entrypoint to generate a graph from a dataset and config dictionary.
    Returns: {
        "success": True/False,
        "html": "...plotly interactive html or img container...",
        "image": "data:image/png;base64,...",
        "error": "Error message",
        "notes": []
    }
    """
    library = config.get("library", "plotly").lower()
    graph_type = config.get("graph_type", "").lower().replace(" ", "").replace("_", "")
    
    # Sanitize empty string values to None
    for key in ["x_column", "y_column", "z_column", "color_column", "size_column", "source_column", "target_column"]:
        val = config.get(key)
        if not val or val == "" or str(val).lower() in ["none", "-- none --"]:
            config[key] = None
            
    x_col = config.get("x_column")
    y_col = config.get("y_column")
    
    # 1. Validation checks
    if graph_type in ["networkgraph", "network", "relationshipchart"]:
        source = config.get("source_column")
        target = config.get("target_column")
        if not source or source not in df.columns:
            return {"success": False, "error": "Network Graph requires a valid Source Column."}
        if not target or target not in df.columns:
            return {"success": False, "error": "Network Graph requires a valid Target Column."}
    elif graph_type in ["heatmap", "correlationchart"]:
        if config.get("heatmap_pivoted", False):
            if not x_col or x_col not in df.columns:
                return {"success": False, "error": "Pivoted Heatmap requires a valid X Column."}
            if not y_col or y_col not in df.columns:
                return {"success": False, "error": "Pivoted Heatmap requires a valid Y Column."}
    elif graph_type in ["histogram", "dist", "distplot"]:
        if not x_col or x_col not in df.columns:
            return {"success": False, "error": "Histogram requires a valid X Axis Column."}
    elif graph_type in ["piechart", "pie"]:
        if not x_col or x_col not in df.columns:
            return {"success": False, "error": "Pie Chart requires a valid Category / Label Column."}
    elif graph_type in ["boxplot", "box"]:
        if not x_col or x_col not in df.columns:
            return {"success": False, "error": "Box Plot requires a valid Numeric Column on X Axis."}
    elif graph_type in ["scattermatrix", "splom"]:
        dims = config.get("dimensions", [])
        if not dims:
            # Fallback to all numeric columns if dimensions is empty
            num_cols = list(df.select_dtypes(include=[np.number]).columns)
            if not num_cols:
                return {"success": False, "error": "Scatter Matrix requires numeric columns."}
            config["dimensions"] = num_cols[:4]
    else:
        # Standard plot check (Bar Chart, Line Chart, Scatter Plot, Bubble Chart, etc.)
        if not x_col or x_col not in df.columns:
            return {"success": False, "error": "Please select a valid X Axis Column."}
        if not y_col or y_col not in df.columns:
            return {"success": False, "error": "Please select a valid Y Axis Column."}

    # Downsample large datasets to prevent browser DOM listener memory leaks & high CPU lag
    MAX_VIZ_ROWS = 5000
    if len(df) > MAX_VIZ_ROWS and graph_type not in ["heatmap", "correlationchart"]:
        df = df.sample(n=MAX_VIZ_ROWS, random_state=42)
    
    # Clean up any lingering matplotlib figures before creating new plot
    plt.close('all')
    
    # Apply theme colors
    # We will adjust standard matplotlib styles based on light/dark mode
    bg_color = config.get("background_color", "#ffffff")
    text_color = config.get("text_color", "#1e293b")
    
    def is_hex_dark(hex_str):
        try:
            hex_str = hex_str.lstrip('#')
            if len(hex_str) == 3:
                hex_str = ''.join([c*2 for c in hex_str])
            r = int(hex_str[0:2], 16)
            g = int(hex_str[2:4], 16)
            b = int(hex_str[4:6], 16)
            return ((r * 299) + (g * 587) + (b * 114)) / 1000 < 128
        except:
            return False

    if is_hex_dark(bg_color):
        plt.style.use('dark_background')
        plotly_template = "plotly_dark"
    else:
        plt.style.use('default')
        plotly_template = "plotly_white"
        
    plt.rcParams['figure.facecolor'] = bg_color
    plt.rcParams['axes.facecolor'] = bg_color
    # Configure Matplotlib/Seaborn fonts and sizes globally for this run
    plt.rcParams['font.size'] = float(config.get("font_size", 10))
    plt.rcParams['text.color'] = text_color
    plt.rcParams['axes.labelcolor'] = text_color
    plt.rcParams['xtick.color'] = text_color
    plt.rcParams['ytick.color'] = text_color
    
    try:
        if graph_type in ["networkgraph", "network", "relationshipchart"]:
            res = draw_networkx(df, config, bg_color, text_color)
        elif library == "plotly":
            res = draw_plotly(df, config, plotly_template)
        elif library == "seaborn":
            res = draw_seaborn(df, config)
        elif library == "matplotlib":
            res = draw_matplotlib(df, config)
        else:
            res = {
                "success": False,
                "error": f"Unsupported library: {library}"
            }
        return res
    finally:
        plt.close('all')

def get_base64_images():
    """
    Utility to grab current matplotlib figure as base64 png and svg.
    """
    # Save as PNG
    png_buf = io.BytesIO()
    plt.savefig(png_buf, format='png', bbox_inches='tight', dpi=150)
    png_buf.seek(0)
    png_base64 = base64.b64encode(png_buf.read()).decode('utf-8')
    
    # Save as SVG
    svg_buf = io.BytesIO()
    plt.savefig(svg_buf, format='svg', bbox_inches='tight')
    svg_buf.seek(0)
    svg_base64 = base64.b64encode(svg_buf.read()).decode('utf-8')
    
    plt.close('all')
    return f"data:image/png;base64,{png_base64}", f"data:image/svg+xml;base64,{svg_base64}"

def draw_networkx(df, config, bg_color, text_color):
    try:
        source_col = config.get("source_column")
        target_col = config.get("target_column")
        is_directed = config.get("directed", False)
        
        if not source_col or not target_col:
            return {"success": False, "error": "Network graph requires both source and target columns."}
            
        # Filter nulls
        plot_df = df[[source_col, target_col]].dropna()
        if len(plot_df) == 0:
            return {"success": False, "error": "Dataset contains no valid records for network plotting."}
            
        if is_directed:
            G = nx.from_pandas_edgelist(plot_df, source=source_col, target=target_col, create_using=nx.DiGraph)
        else:
            G = nx.from_pandas_edgelist(plot_df, source=source_col, target=target_col)
            
        width = float(config.get("width", 800))
        height = float(config.get("height", 500))
        
        fig, ax = plt.subplots(figsize=(width / 100, height / 100))
        fig.patch.set_facecolor(bg_color)
        ax.set_facecolor(bg_color)
        
        layout_name = config.get("layout", "spring").lower()
        if layout_name == "circular":
            pos = nx.circular_layout(G)
        elif layout_name == "random":
            pos = nx.random_layout(G)
        elif layout_name == "kamada-kawai":
            pos = nx.kamada_kawai_layout(G)
        else:
            pos = nx.spring_layout(G)
            
        node_color = config.get("node_color", "#3b82f6")
        edge_color = config.get("edge_color", "#94a3b8")
        node_size = int(config.get("node_size", 500))
        edge_width = float(config.get("edge_width", 1.0))
        show_labels = config.get("show_labels", True)
        
        nx.draw_networkx_nodes(G, pos, node_color=node_color, node_size=node_size, ax=ax)
        nx.draw_networkx_edges(G, pos, edge_color=edge_color, width=edge_width, arrows=is_directed, ax=ax)
        
        if show_labels:
            nx.draw_networkx_labels(G, pos, font_size=float(config.get("font_size", 10)), font_color=text_color, ax=ax)
            
        ax.axis("off")
        
        # Title and margins
        title = config.get("title", "")
        if title:
            ax.set_title(title, color=text_color, fontsize=float(config.get("font_size", 12)) + 2)
            
        png_img, svg_img = get_base64_images()
        html_content = f'<img src="{svg_img}" style="width:100%; height:100%; object-fit:contain;" />'
        
        return {
            "success": True,
            "html": html_content,
            "image": png_img
        }
    except Exception as e:
        return {"success": False, "error": f"Failed to draw network graph: {str(e)}"}

def draw_plotly(df, config, template):
    try:
        graph_type = config.get("graph_type", "").lower().replace(" ", "").replace("_", "")
        x_col = config.get("x_column")
        y_col = config.get("y_column")
        z_col = config.get("z_column")
        color_col = config.get("color_column")
        size_col = config.get("size_column")
        
        fig = None
        
        # 1. Bar Chart
        if graph_type in ["bar", "barchart", "barplot"]:
            orientation = "h" if config.get("orientation", "vertical") == "horizontal" else "v"
            barmode = config.get("barmode", "group")  # group, stack, relative
            
            if not y_col and x_col and x_col in df.columns:
                plot_df = df[x_col].value_counts().reset_index()
                plot_df.columns = [x_col, "Count"]
                fig = px.bar(
                    plot_df, x=x_col, y="Count",
                    orientation=orientation,
                    template=template,
                    title=config.get("title", ""),
                    opacity=float(config.get("opacity", 1.0))
                )
            else:
                fig = px.bar(
                    df, x=y_col if orientation == "h" else x_col,
                    y=x_col if orientation == "h" else y_col,
                    color=color_col,
                    orientation=orientation,
                    barmode=barmode,
                    template=template,
                    title=config.get("title", ""),
                    opacity=float(config.get("opacity", 1.0))
                )
            bar_width = float(config.get("bar_width", 0.8))
            fig.update_traces(width=bar_width)
            
        # 2. Line Chart
        elif graph_type in ["line", "linechart", "lineplot"]:
            if not y_col and x_col and x_col in df.columns:
                plot_df = df[x_col].value_counts().sort_index().reset_index()
                plot_df.columns = [x_col, "Count"]
                fig = px.line(
                    plot_df, x=x_col, y="Count",
                    template=template,
                    title=config.get("title", ""),
                    opacity=float(config.get("opacity", 1.0))
                )
            else:
                fig = px.line(
                    df, x=x_col, y=y_col,
                    color=color_col,
                    template=template,
                    title=config.get("title", ""),
                    opacity=float(config.get("opacity", 1.0))
                )
            
        # 3. Scatter Plot
        elif graph_type in ["scatter", "scatterplot", "scatter2d"]:
            trendline = "ols" if config.get("trend_line", False) else None
            fig = px.scatter(
                df, x=x_col, y=y_col,
                color=color_col,
                trendline=trendline,
                template=template,
                title=config.get("title", ""),
                opacity=float(config.get("opacity", 1.0))
            )
            marker_size = int(config.get("marker_size", 10))
            fig.update_traces(marker=dict(size=marker_size))
            
        # 4. Bubble Chart
        elif graph_type in ["bubble", "bubblechart"]:
            fig = px.scatter(
                df, x=x_col, y=y_col,
                size=size_col,
                color=color_col,
                template=template,
                title=config.get("title", ""),
                opacity=float(config.get("opacity", 1.0)),
                size_max=int(config.get("max_bubble_size", 30))
            )
            
        # 5. Histogram
        elif graph_type in ["histogram", "dist", "distplot", "distributionchart"]:
            histnorm = config.get("histnorm", "")  # percent, probability, density
            if histnorm == "count": histnorm = ""
            orientation = "h" if config.get("orientation", "vertical") == "horizontal" else "v"
            fig = px.histogram(
                df, x=x_col,
                nbins=int(config.get("bins", 20)),
                histnorm=histnorm,
                orientation=orientation,
                template=template,
                title=config.get("title", ""),
                opacity=float(config.get("opacity", 1.0))
            )
            
        # 6. Pie Chart
        elif graph_type in ["pie", "piechart"]:
            hole = float(config.get("hole_size", 0.0)) if config.get("donut", False) else 0.0
            fig = px.pie(
                df, names=x_col, values=y_col,
                hole=hole,
                template=template,
                title=config.get("title", ""),
                opacity=float(config.get("opacity", 1.0))
            )

        # 7. Box Plot
        elif graph_type in ["box", "boxplot"]:
            fig = px.box(
                df, x=x_col, y=y_col,
                color=color_col,
                template=template,
                title=config.get("title", ""),
                opacity=float(config.get("opacity", 1.0))
            )

        # 8. Heatmap / Correlation Chart
        elif graph_type in ["heatmap", "correlationchart"]:
            numeric_df = df.select_dtypes(include=[np.number])
            if numeric_df.shape[1] >= 2:
                corr_matrix = numeric_df.corr().round(2)
                palette = config.get("color_palette", "viridis")
                colorscale = resolve_heatmap_cmap(palette)
                fig = px.imshow(
                    corr_matrix,
                    text_auto=config.get("annotations", True),
                    color_continuous_scale=colorscale,
                    template=template,
                    title=config.get("title", "Correlation Matrix Heatmap")
                )
            else:
                return {"success": False, "error": "Heatmap requires at least two numeric columns."}

        # 9. Area Chart
        elif graph_type in ["area", "areachart"]:
            fig = px.area(
                df, x=x_col, y=y_col,
                color=color_col,
                template=template,
                title=config.get("title", ""),
                opacity=float(config.get("opacity", 1.0))
            )

        # 10. Violin Plot
        elif graph_type in ["violin", "violinplot"]:
            fig = px.violin(
                df, x=x_col, y=y_col,
                color=color_col,
                box=True,
                points="all",
                template=template,
                title=config.get("title", ""),
                opacity=float(config.get("opacity", 1.0))
            )

        # 11. Scatter Matrix
        elif graph_type in ["scattermatrix", "splom"]:
            dims = config.get("dimensions", [])
            if not dims:
                dims = list(df.select_dtypes(include=[np.number]).columns[:4])
            fig = px.scatter_matrix(
                df, dimensions=dims,
                color=color_col,
                template=template,
                title=config.get("title", ""),
                opacity=float(config.get("opacity", 0.8))
            )
            
        # 12. 3D Scatter Plot
        elif graph_type in ["3dscatter", "3dscatterplot"]:
            fig = px.scatter_3d(
                df, x=x_col, y=y_col, z=z_col,
                color=color_col,
                template=template,
                title=config.get("title", ""),
                opacity=float(config.get("opacity", 0.8))
            )
            marker_size = int(config.get("marker_size", 10))
            fig.update_traces(marker=dict(size=marker_size))
            # Apply 3D rotation if given
            camera = dict(
                eye=dict(
                    x=float(config.get("camera_x", 1.25)),
                    y=float(config.get("camera_y", 1.25)),
                    z=float(config.get("camera_z", 1.25))
                )
            )
            fig.update_layout(scene_camera=camera)
            
        if not fig:
            return {"success": False, "error": f"Plotly cannot draw graph type: {graph_type}"}
            
        # Apply standard settings (labels, subtitle/caption annotations, sizes)
        width = int(config.get("width", 800))
        height = int(config.get("height", 500))
        
        bg_color = config.get("background_color", "#ffffff")
        text_color = config.get("text_color", "#1e293b")
        font_family = config.get("font_family", "sans-serif")
        font_size = float(config.get("font_size", 10))

        fig.update_layout(
            width=width,
            height=height,
            paper_bgcolor=bg_color,
            plot_bgcolor=bg_color,
            font=dict(color=text_color, family=font_family, size=font_size),
            margin=dict(
                l=int(config.get("margin_left", 40)),
                r=int(config.get("margin_right", 40)),
                t=int(config.get("margin_top", 60)),
                b=int(config.get("margin_bottom", 40))
            ),
            showlegend=config.get("legend", True)
        )
        
        grid_enabled = config.get("grid", True)
        fig.update_xaxes(showgrid=grid_enabled, gridcolor="rgba(128,128,128,0.15)", zeroline=grid_enabled, zerolinecolor="rgba(128,128,128,0.2)")
        fig.update_yaxes(showgrid=grid_enabled, gridcolor="rgba(128,128,128,0.15)", zeroline=grid_enabled, zerolinecolor="rgba(128,128,128,0.2)")
        
        rotation = int(config.get("axis_rotation", 0))
        if rotation > 0:
            fig.update_xaxes(tickangle=rotation)
            
        opacity = float(config.get("opacity", 1.0))
        if opacity < 1.0:
            try:
                fig.update_traces(opacity=opacity)
            except:
                pass
        
        # Subtitle
        subtitle = config.get("subtitle", "")
        if subtitle:
            fig.add_annotation(
                text=subtitle,
                showarrow=False,
                xref="paper", yref="paper",
                x=0.0, y=1.05,
                font=dict(size=float(config.get("font_size", 10)) + 2)
            )
            
        # Caption
        caption = config.get("caption", "")
        if caption:
            fig.add_annotation(
                text=caption,
                showarrow=False,
                xref="paper", yref="paper",
                x=0.0, y=-0.15,
                font=dict(size=float(config.get("font_size", 8)), color="gray")
            )
            
        # Export static image via Kaleido
        img_bytes = fig.to_image(format="png")
        png_base64 = f"data:image/png;base64,{base64.b64encode(img_bytes).decode('utf-8')}"
        
        # HTML conversion
        html_content = fig.to_html(full_html=False, include_plotlyjs='cdn')
        
        return {
            "success": True,
            "html": html_content,
            "image": png_base64
        }
    except Exception as e:
        return {"success": False, "error": f"Plotly generation failed: {str(e)}"}

def draw_seaborn(df, config):
    try:
        graph_type = config.get("graph_type", "").lower().replace(" ", "").replace("_", "")
        x_col = config.get("x_column")
        y_col = config.get("y_column")
        color_col = config.get("color_column")
        
        width = float(config.get("width", 800))
        height = float(config.get("height", 500))
        
        fig, ax = plt.subplots(figsize=(width / 100, height / 100))
        
        # Set palette
        palette = config.get("color_palette", "deep")
        
        # 1. Heatmap
        if graph_type in ["heatmap", "correlationchart"]:
            # Heatmap expects correlation matrix or pivot
            if graph_type == "correlationchart" or not config.get("heatmap_pivoted", False):
                numeric_df = df.select_dtypes(include=[np.number])
                plot_data = numeric_df.corr()
            else:
                # Pivot heatmap from X and Y
                plot_data = df.pivot(index=y_col, columns=x_col, values=config.get("value_column"))
                
            cmap = resolve_heatmap_cmap(config.get("color_palette", "viridis"))
            try:
                sns.heatmap(
                    plot_data,
                    annot=config.get("annotations", True),
                    cmap=cmap,
                    linewidths=float(config.get("grid_width", 0.5)),
                    ax=ax,
                    square=config.get("square_cells", False),
                    cbar=config.get("color_bar", True)
                )
            except Exception:
                sns.heatmap(
                    plot_data,
                    annot=config.get("annotations", True),
                    cmap="viridis",
                    linewidths=float(config.get("grid_width", 0.5)),
                    ax=ax,
                    square=config.get("square_cells", False),
                    cbar=config.get("color_bar", True)
                )
            
        # 2. Scatter Plot
        elif graph_type in ["scatter", "scatterplot"]:
            marker_size = int(config.get("marker_size", 20))
            sns.scatterplot(
                data=df, x=x_col, y=y_col,
                hue=color_col,
                palette=palette if color_col else None,
                alpha=float(config.get("opacity", 1.0)),
                s=marker_size,
                ax=ax
            )
            
        # 3. Box Plot
        elif graph_type in ["box", "boxplot"]:
            sns.boxplot(
                data=df, x=x_col, y=y_col,
                hue=color_col,
                palette=palette if color_col else None,
                width=float(config.get("box_width", 0.5)),
                showfliers=config.get("show_outliers", True),
                ax=ax
            )
            
        else:
            plt.close(fig)
            return {"success": False, "error": f"Seaborn cannot draw graph type: {graph_type}"}
            
        # Apply standard settings
        apply_matplotlib_titles_labels(ax, fig, config)
        
        png_img, svg_img = get_base64_images()
        html_content = f'<img src="{svg_img}" style="width:100%; height:100%; object-fit:contain;" />'
        
        return {
            "success": True,
            "html": html_content,
            "image": png_img
        }
    except Exception as e:
        plt.close('all')
        return {"success": False, "error": f"Seaborn generation failed: {str(e)}"}

def draw_matplotlib(df, config):
    try:
        graph_type = config.get("graph_type", "").lower().replace(" ", "").replace("_", "")
        x_col = config.get("x_column")
        y_col = config.get("y_column")
        color_col = config.get("color_column")
        
        width = float(config.get("width", 800))
        height = float(config.get("height", 500))
        
        fig, ax = plt.subplots(figsize=(width / 100, height / 100))
        
        # 1. Line Plot
        if graph_type in ["line", "lineplot"]:
            plot_df = df.sort_values(by=x_col).reset_index(drop=True)
            if color_col:
                for label, group in plot_df.groupby(color_col):
                    ax.plot(group[x_col], group[y_col], label=label, alpha=float(config.get("opacity", 1.0)))
                ax.legend()
            else:
                ax.plot(plot_df[x_col], plot_df[y_col], alpha=float(config.get("opacity", 1.0)))
                
        # 2. Bar Plot
        elif graph_type in ["bar", "barplot"]:
            orientation = config.get("orientation", "vertical")
            x_data = df[x_col].astype(str)
            y_data = df[y_col]
            if orientation == "horizontal":
                ax.barh(x_data, y_data, alpha=float(config.get("opacity", 1.0)), height=float(config.get("bar_width", 0.8)))
            else:
                ax.bar(x_data, y_data, alpha=float(config.get("opacity", 1.0)), width=float(config.get("bar_width", 0.8)))
                
        # 3. Scatter Plot
        elif graph_type in ["scatter", "scatterplot"]:
            ax.scatter(df[x_col], df[y_col], alpha=float(config.get("opacity", 1.0)), s=int(config.get("marker_size", 20)))
            
        # 4. Histogram
        elif graph_type in ["histogram", "hist"]:
            ax.hist(df[x_col], bins=int(config.get("bins", 20)), alpha=float(config.get("opacity", 1.0)))
            
        # 5. Pie Chart
        elif graph_type in ["pie", "piechart"]:
            ax.pie(df[y_col], labels=df[x_col], autopct='%1.1f%%', startangle=90)
            
        else:
            plt.close(fig)
            return {"success": False, "error": f"Matplotlib cannot draw graph type: {graph_type}"}
            
        # Apply standard settings
        apply_matplotlib_titles_labels(ax, fig, config)
        
        png_img, svg_img = get_base64_images()
        html_content = f'<img src="{svg_img}" style="width:100%; height:100%; object-fit:contain;" />'
        
        return {
            "success": True,
            "html": html_content,
            "image": png_img
        }
    except Exception as e:
        plt.close('all')
        return {"success": False, "error": f"Matplotlib generation failed: {str(e)}"}

def apply_matplotlib_titles_labels(ax, fig, config):
    title = config.get("title", "")
    subtitle = config.get("subtitle", "")
    caption = config.get("caption", "")
    x_label = config.get("x_label", config.get("x_column", ""))
    y_label = config.get("y_label", config.get("y_column", ""))
    
    # Grid
    if config.get("grid", False):
        ax.grid(True, linestyle='--', alpha=0.5)
    else:
        ax.grid(False)
        
    # Labels
    if x_label: ax.set_xlabel(x_label)
    if y_label: ax.set_ylabel(y_label)
    
    # Title
    if title:
        fig.suptitle(title, fontsize=float(config.get("font_size", 12)) + 2)
        if subtitle:
            ax.set_title(subtitle, fontsize=float(config.get("font_size", 10)))
    elif subtitle:
        ax.set_title(subtitle, fontsize=float(config.get("font_size", 10)))
        
    # Rotate tick labels if specified
    rotation = float(config.get("axis_rotation", 0))
    if rotation:
        plt.setp(ax.get_xticklabels(), rotation=rotation, horizontalalignment='right')
        
    # Caption
    if caption:
        fig.text(0.01, 0.01, caption, transform=fig.transFigure, fontsize=float(config.get("font_size", 8)), color="gray")
        
    # Layout adjustment
    plt.tight_layout()
