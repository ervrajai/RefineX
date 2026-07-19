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
    
    # Apply theme colors
    # We will adjust standard matplotlib styles based on light/dark mode
    is_dark = config.get("dark_mode", False)
    if is_dark:
        plt.style.use('dark_background')
        plotly_template = "plotly_dark"
        text_color = config.get("text_color", "#ffffff")
        bg_color = config.get("background_color", "#121212")
    else:
        plt.style.use('default')
        plotly_template = "plotly_white"
        text_color = config.get("text_color", "#1e293b")
        bg_color = config.get("background_color", "#ffffff")
        
    # Configure Matplotlib/Seaborn fonts and sizes globally for this run
    plt.rcParams['font.size'] = float(config.get("font_size", 10))
    plt.rcParams['text.color'] = text_color
    plt.rcParams['axes.labelcolor'] = text_color
    plt.rcParams['xtick.color'] = text_color
    plt.rcParams['ytick.color'] = text_color
    
    # Check if network graph
    if graph_type in ["networkgraph", "network", "relationshipchart"]:
        return draw_networkx(df, config, bg_color, text_color)
        
    if library == "plotly":
        return draw_plotly(df, config, plotly_template)
    elif library == "seaborn":
        return draw_seaborn(df, config)
    elif library == "matplotlib":
        return draw_matplotlib(df, config)
    else:
        return {
            "success": False,
            "error": f"Unsupported library: {library}"
        }

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
        if graph_type in ["bar", "barchart"]:
            orientation = "h" if config.get("orientation", "vertical") == "horizontal" else "v"
            barmode = config.get("barmode", "group")  # group, stack, relative
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
            
        # 2. Line Chart
        elif graph_type in ["line", "linechart"]:
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
        elif graph_type in ["histogram", "dist"]:
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
            
        # 7. Scatter Matrix
        elif graph_type in ["scattermatrix", "splom"]:
            dims = config.get("dimensions", [])
            if not dims:
                # Fallback to numeric columns
                dims = list(df.select_dtypes(include=[np.number]).columns[:4])
            fig = px.scatter_matrix(
                df, dimensions=dims,
                color=color_col,
                template=template,
                title=config.get("title", ""),
                opacity=float(config.get("opacity", 0.8))
            )
            
        # 8. 3D Scatter Plot
        elif graph_type in ["3dscatter", "3dscatterplot"]:
            fig = px.scatter_3d(
                df, x=x_col, y=y_col, z=z_col,
                color=color_col,
                template=template,
                title=config.get("title", ""),
                opacity=float(config.get("opacity", 0.8))
            )
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
        
        fig.update_layout(
            width=width,
            height=height,
            margin=dict(
                l=int(config.get("margin_left", 40)),
                r=int(config.get("margin_right", 40)),
                t=int(config.get("margin_top", 60)),
                b=int(config.get("margin_bottom", 40))
            ),
            showlegend=config.get("legend", True)
        )
        
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
                
            sns.heatmap(
                plot_data,
                annot=config.get("annotations", True),
                cmap=palette,
                linewidths=float(config.get("grid_width", 0.5)),
                ax=ax,
                square=config.get("square_cells", False),
                cbar=config.get("color_bar", True)
            )
            
        # 2. Scatter Plot
        elif graph_type in ["scatter", "scatterplot"]:
            sns.scatterplot(
                data=df, x=x_col, y=y_col,
                hue=color_col,
                palette=palette if color_col else None,
                alpha=float(config.get("opacity", 1.0)),
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
            if color_col:
                for label, group in df.groupby(color_col):
                    ax.plot(group[x_col], group[y_col], label=label, alpha=float(config.get("opacity", 1.0)))
                ax.legend()
            else:
                ax.plot(df[x_col], df[y_col], alpha=float(config.get("opacity", 1.0)))
                
        # 2. Bar Plot
        elif graph_type in ["bar", "barplot"]:
            orientation = config.get("orientation", "vertical")
            if orientation == "horizontal":
                ax.barh(df[x_col], df[y_col], alpha=float(config.get("opacity", 1.0)), height=float(config.get("bar_width", 0.8)))
            else:
                ax.bar(df[x_col], df[y_col], alpha=float(config.get("opacity", 1.0)), width=float(config.get("bar_width", 0.8)))
                
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
