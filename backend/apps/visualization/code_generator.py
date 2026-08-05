def compile_python_code(config):
    """
    Translates a visualization configuration into a self-contained, clean,
    and ready-to-run Python script.
    """
    library = config.get("library", "plotly").lower()
    graph_type = config.get("graph_type", "").lower().replace(" ", "").replace("_", "")
    x_col = config.get("x_column")
    y_col = config.get("y_column")
    z_col = config.get("z_column")
    color_col = config.get("color_column")
    size_col = config.get("size_column")
    
    # 1. Gather imports
    code = []
    code.append("import pandas as pd")
    code.append("import numpy as np")
    
    if graph_type in ["networkgraph", "network", "relationshipchart"]:
        code.append("import networkx as nx")
        code.append("import matplotlib.pyplot as plt")
    elif library == "plotly":
        code.append("import plotly.express as px")
        code.append("import plotly.graph_objects as go")
    elif library == "seaborn":
        code.append("import seaborn as sns")
        code.append("import matplotlib.pyplot as plt")
    else:  # matplotlib
        code.append("import matplotlib.pyplot as plt")
        
    code.append("\n# 1. Load the dataset (adjust file path or encoding as needed)")
    # Since dataset is typically CSV or Excel, generate standard pandas reading
    file_type = config.get("file_type", "csv")
    dataset_name = config.get("dataset_name", f"dataset.{file_type}")
    if file_type.lower() in ["xlsx", "xls"]:
        code.append(f"df = pd.read_excel('{dataset_name}')")
    else:
        encoding = config.get("encoding", "utf-8")
        code.append(f"df = pd.read_csv('{dataset_name}', encoding='{encoding}')")
        
    # 2. Smart decisions / Data prep code
    code.append("\n# 2. Data Preparation & Preprocessing")
    
    # Aggregation
    if graph_type in ["bar", "barchart", "barplot", "pie", "piechart"] and x_col:
        agg_func = config.get("aggregation", "sum")
        if y_col:
            code.append(f"# Aggregate duplicates in '{x_col}' by computing the '{agg_func}' of '{y_col}'")
            code.append(f"df = df.groupby('{x_col}', as_index=False)['{y_col}'].{agg_func}()")
        else:
            code.append(f"# Group and count occurrences of categories in '{x_col}'")
            code.append(f"df = df.groupby('{x_col}', as_index=False).size().rename(columns={{'size': 'count'}})")
            y_col = "count"
            
    # Pie chart Others grouping
    if graph_type in ["pie", "piechart"] and x_col and y_col:
        code.append("\n# Group categories outside of top 7 into 'Others'")
        code.append(f"df = df.sort_values(by='{y_col}', ascending=False).reset_index(drop=True)")
        code.append("if len(df) > 8:")
        code.append("    top_7 = df.iloc[:7]")
        code.append(f"    others_sum = df.iloc[7:]['{y_col}'].sum()")
        code.append(f"    others_row = pd.DataFrame([{{'{x_col}': 'Others', '{y_col}': others_sum}}])")
        code.append("    df = pd.concat([top_7, others_row], ignore_index=True)")
        
    # Sorting
    if graph_type in ["bar", "barchart", "barplot"] and y_col:
        sort_order = config.get("sorting", "none")
        if sort_order != "none":
            asc = "True" if sort_order == "ascending" else "False"
            code.append(f"\n# Sort values in {sort_order} order")
            code.append(f"df = df.sort_values(by='{y_col}', ascending={asc}).reset_index(drop=True)")
            
    # Sampling (if dataset is huge)
    if config.get("sampled", False):
        code.append("\n# Sample dataset for plotting performance (optional)")
        code.append("df = df.sample(n=2000, random_state=42) if len(df) > 10000 else df")
        
    # Helper to check if color is dark
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

    # 3. Graph drawing code
    code.append("\n# 3. Create the Visualization")
    
    # Title & label strings
    title = config.get("title", "")
    subtitle = config.get("subtitle", "")
    caption = config.get("caption", "")
    bg_color = config.get("background_color", "#ffffff")
    text_color = config.get("text_color", "#1e293b")
    font_family = config.get("font_family", "sans-serif")
    is_dark = is_hex_dark(bg_color)
    font_size = float(config.get("font_size", 10))
    
    width = int(config.get("width", 800))
    height = int(config.get("height", 500))
    
    if graph_type in ["networkgraph", "network", "relationshipchart"]:
        source = config.get("source_column")
        target = config.get("target_column")
        is_directed = config.get("directed", False)
        layout = config.get("layout", "spring")
        node_color = config.get("node_color", "#3b82f6")
        edge_color = config.get("edge_color", "#94a3b8")
        node_size = int(config.get("node_size", 500))
        edge_width = float(config.get("edge_width", 1.0))
        show_labels = config.get("show_labels", True)
        
        g_class = "nx.DiGraph" if is_directed else "nx.Graph"
        code.append(f"G = nx.from_pandas_edgelist(df, source='{source}', target='{target}', create_using={g_class}())")
        code.append(f"fig, ax = plt.subplots(figsize=({width / 100}, {height / 100}))")
        code.append(f"fig.patch.set_facecolor('{bg_color}')")
        code.append(f"ax.set_facecolor('{bg_color}')")
            
        code.append(f"pos = nx.{layout}_layout(G)")
        code.append(f"nx.draw_networkx_nodes(G, pos, node_color='{node_color}', node_size={node_size}, ax=ax)")
        code.append(f"nx.draw_networkx_edges(G, pos, edge_color='{edge_color}', width={edge_width}, arrows={is_directed}, ax=ax)")
        if show_labels:
            code.append(f"nx.draw_networkx_labels(G, pos, font_size={font_size}, font_color='{text_color}', ax=ax)")
            
        code.append("ax.axis('off')")
        if title:
            code.append(f"ax.set_title('{title}', color='{text_color}', fontsize={font_size + 2})")
        code.append("plt.tight_layout()")
        code.append("plt.show()")
        
    elif library == "plotly":
        # Construct Plotly generator lines
        opacity = float(config.get("opacity", 1.0))
        color_param = f", color='{color_col}'" if color_col else ""
        title_param = f", title='{title}'" if title else ""
        
        if graph_type in ["bar", "barchart"]:
            orientation = "h" if config.get("orientation", "vertical") == "horizontal" else "v"
            barmode = config.get("barmode", "group")
            bar_w = float(config.get("bar_width", 0.8))
            x_var = y_col if orientation == "h" else x_col
            y_var = x_col if orientation == "h" else y_col
            code.append(f"fig = px.bar(df, x='{x_var}', y='{y_var}', barmode='{barmode}', orientation='{orientation}'{color_param}{title_param}, opacity={opacity})")
            code.append(f"fig.update_traces(width={bar_w})")
            
        elif graph_type in ["line", "linechart"]:
            code.append(f"fig = px.line(df, x='{x_col}', y='{y_col}'{color_param}{title_param}, opacity={opacity})")
            
        elif graph_type in ["scatter", "scatterplot", "scatter2d"]:
            trendline = ", trendline='ols'" if config.get("trend_line", False) else ""
            marker_size = int(config.get("marker_size", 20))
            code.append(f"fig = px.scatter(df, x='{x_col}', y='{y_col}'{color_param}{trendline}{title_param}, opacity={opacity})")
            code.append(f"fig.update_traces(marker=dict(size={marker_size}))")
            
        elif graph_type in ["bubble", "bubblechart"]:
            size_param = f", size='{size_col}'"
            max_size = int(config.get("max_bubble_size", 30))
            code.append(f"fig = px.scatter(df, x='{x_col}', y='{y_col}'{size_param}{color_param}{title_param}, size_max={max_size}, opacity={opacity})")
            
        elif graph_type in ["histogram", "dist"]:
            bins = int(config.get("bins", 20))
            histnorm = config.get("histnorm", "")
            histnorm_param = f", histnorm='{histnorm}'" if histnorm and histnorm != "count" else ""
            orientation = "h" if config.get("orientation", "vertical") == "horizontal" else "v"
            code.append(f"fig = px.histogram(df, x='{x_col}', nbins={bins}{histnorm_param}, orientation='{orientation}'{title_param}, opacity={opacity})")
            
        elif graph_type in ["pie", "piechart"]:
            hole = float(config.get("hole_size", 0.0)) if config.get("donut", False) else 0.0
            code.append(f"fig = px.pie(df, names='{x_col}', values='{y_col}', hole={hole}{title_param}, opacity={opacity})")
            
        elif graph_type in ["scattermatrix", "splom"]:
            dims = config.get("dimensions", [])
            code.append(f"fig = px.scatter_matrix(df, dimensions={dims}{color_param}{title_param}, opacity={opacity})")
            
        elif graph_type in ["3dscatter", "3dscatterplot"]:
            marker_size = int(config.get("marker_size", 20))
            code.append(f"fig = px.scatter_3d(df, x='{x_col}', y='{y_col}', z='{z_col}'{color_param}{title_param}, opacity={opacity})")
            code.append(f"fig.update_traces(marker=dict(size={marker_size}))")
            eye_x = float(config.get("camera_x", 1.25))
            eye_y = float(config.get("camera_y", 1.25))
            eye_z = float(config.get("camera_z", 1.25))
            code.append(f"fig.update_layout(scene_camera=dict(eye=dict(x={eye_x}, y={eye_y}, z={eye_z})))")
            
        template = "plotly_dark" if is_dark else "plotly_white"
        code.append(f"fig.update_layout(template='{template}', width={width}, height={height}, paper_bgcolor='{bg_color}', plot_bgcolor='{bg_color}', font=dict(color='{text_color}', family='{font_family}'))")
        
        # Legend setting
        show_legend = "True" if config.get("legend", True) else "False"
        code.append(f"fig.update_layout(showlegend={show_legend})")
        
        # Margins setting
        margin_left = int(config.get("margin_left", 40))
        margin_right = int(config.get("margin_right", 40))
        margin_top = int(config.get("margin_top", 60))
        margin_bottom = int(config.get("margin_bottom", 40))
        code.append(f"fig.update_layout(margin=dict(l={margin_left}, r={margin_right}, t={margin_top}, b={margin_bottom}))")
        
        # Axis grid and rotation settings
        show_grid = "True" if config.get("grid", True) else "False"
        axis_rotation = int(config.get("axis_rotation", 0))
        if axis_rotation != 0:
            code.append(f"fig.update_xaxes(showgrid={show_grid}, tickangle={axis_rotation})")
            code.append(f"fig.for_each_xaxis(lambda ax: ax.update(tickangle={axis_rotation}))")
        else:
            code.append(f"fig.update_xaxes(showgrid={show_grid})")
        code.append(f"fig.update_yaxes(showgrid={show_grid})")
        
        # Annotations for subtitle and caption
        if subtitle:
            code.append(f"fig.add_annotation(text='{subtitle}', showarrow=False, xref='paper', yref='paper', x=0, y=1.05, font=dict(size={font_size + 2}))")
        if caption:
            code.append(f"fig.add_annotation(text='{caption}', showarrow=False, xref='paper', yref='paper', x=0, y=-0.15, font=dict(size={font_size}, color='gray'))")
            
        code.append("fig.show()")
        
    else:  # Seaborn / Matplotlib
        if is_dark:
            code.append("plt.style.use('dark_background')")
        else:
            code.append("plt.style.use('default')")
            
        code.append(f"plt.rcParams['figure.facecolor'] = '{bg_color}'")
        code.append(f"plt.rcParams['axes.facecolor'] = '{bg_color}'")
        code.append(f"plt.rcParams['text.color'] = '{text_color}'")
        code.append(f"plt.rcParams['axes.labelcolor'] = '{text_color}'")
        code.append(f"plt.rcParams['xtick.color'] = '{text_color}'")
        code.append(f"plt.rcParams['ytick.color'] = '{text_color}'")
        code.append(f"plt.rcParams['font.size'] = {font_size}")
        
        font_family = config.get("font_family", "sans-serif")
        if font_family in ["serif", "sans-serif", "monospace"]:
            code.append(f"plt.rcParams['font.family'] = '{font_family}'")
        else:
            code.append(f"plt.rcParams['font.sans-serif'] = ['{font_family}', 'DejaVu Sans', 'Arial', 'sans-serif']")
            code.append("plt.rcParams['font.family'] = 'sans-serif'")

        code.append(f"fig, ax = plt.subplots(figsize=({width / 100}, {height / 100}))")
        
        opacity = float(config.get("opacity", 1.0))
        color_param = f", hue='{color_col}'" if color_col else ""
        palette = config.get("color_palette", "deep")
        palette_param = f", palette='{palette}'" if color_col else ""
        
        if library == "seaborn":
            code.append(f"sns.set_palette('{palette}')")
            if graph_type in ["heatmap", "correlationchart"]:
                if graph_type == "correlationchart" or not config.get("heatmap_pivoted", False):
                    code.append("plot_data = df.select_dtypes(include=[np.number]).corr()")
                else:
                    val_col = config.get("value_column", "values")
                    code.append(f"plot_data = df.pivot(index='{y_col}', columns='{x_col}', values='{val_col}')")
                
                annot = "True" if config.get("annotations", True) else "False"
                grid_w = float(config.get("grid_width", 0.5))
                sq = "True" if config.get("square_cells", False) else "False"
                cbar = "True" if config.get("color_bar", True) else "False"
                code.append(f"sns.heatmap(plot_data, annot={annot}, cmap='{palette}', linewidths={grid_w}, square={sq}, cbar={cbar}, ax=ax)")
                
            elif graph_type in ["scatter", "scatterplot", "scatterchart"]:
                marker_size = int(config.get("marker_size", 20))
                code.append(f"sns.scatterplot(data=df, x='{x_col}', y='{y_col}'{color_param}{palette_param}, s={marker_size}, alpha={opacity}, ax=ax)")
                
            elif graph_type in ["bar", "barplot", "barchart"]:
                code.append(f"sns.barplot(data=df, x='{x_col}', y='{y_col}'{color_param}{palette_param}, alpha={opacity}, ax=ax)")

            elif graph_type in ["line", "lineplot", "linechart"]:
                code.append(f"sns.lineplot(data=df, x='{x_col}', y='{y_col}'{color_param}{palette_param}, alpha={opacity}, ax=ax)")

            elif graph_type in ["box", "boxplot"]:
                w = float(config.get("box_width", 0.5))
                fliers = "True" if config.get("show_outliers", True) else "False"
                code.append(f"sns.boxplot(data=df, x='{x_col}', y='{y_col}'{color_param}{palette_param}, width={w}, showfliers={fliers}, ax=ax)")

            elif graph_type in ["histogram", "hist", "histogramchart", "dist", "distplot"]:
                bins = int(config.get("bins", 20))
                code.append(f"sns.histplot(data=df, x='{x_col}'{color_param}{palette_param}, bins={bins}, alpha={opacity}, ax=ax)")

            elif graph_type in ["violin", "violinplot"]:
                code.append(f"sns.violinplot(data=df, x='{x_col}', y='{y_col}'{color_param}{palette_param}, ax=ax)")
                
        else:  # raw matplotlib
            if graph_type in ["line", "lineplot", "linechart"]:
                if color_col:
                    code.append(f"for label, group in df.groupby('{color_col}'):")
                    code.append(f"    ax.plot(group['{x_col}'], group['{y_col}'], label=label, alpha={opacity})")
                    code.append("ax.legend()")
                else:
                    code.append(f"ax.plot(df['{x_col}'], df['{y_col}'], alpha={opacity})")
                    
            elif graph_type in ["bar", "barplot", "barchart"]:
                orientation = config.get("orientation", "vertical")
                w = float(config.get("bar_width", 0.8))
                if orientation == "horizontal":
                    code.append(f"ax.barh(df['{x_col}'], df['{y_col}'], alpha={opacity}, height={w})")
                else:
                    code.append(f"ax.bar(df['{x_col}'], df['{y_col}'], alpha={opacity}, width={w})")
                    
            elif graph_type in ["scatter", "scatterplot", "scatterchart"]:
                s = int(config.get("marker_size", 20))
                code.append(f"ax.scatter(df['{x_col}'], df['{y_col}'], alpha={opacity}, s={s})")
                
            elif graph_type in ["histogram", "hist", "histogramchart", "dist", "distplot"]:
                bins = int(config.get("bins", 20))
                code.append(f"ax.hist(df['{x_col}'], bins={bins}, alpha={opacity})")
                
            elif graph_type in ["pie", "piechart", "pieplot"]:
                code.append(f"ax.pie(df['{y_col}'], labels=df['{x_col}'], autopct='%1.1f%%', startangle=90)")

            elif graph_type in ["box", "boxplot"]:
                target_col = y_col if y_col else x_col
                code.append(f"ax.boxplot(df['{target_col}'].dropna())")

            elif graph_type in ["area", "areachart", "areaplot"]:
                code.append(f"ax.fill_between(df['{x_col}'], df['{y_col}'], alpha={opacity})")
                
        # Common matplotlib properties
        if config.get("grid", False):
            code.append("ax.grid(True, linestyle='--', alpha=0.5)")
        else:
            code.append("ax.grid(False)")
            
        x_label = config.get("x_label", x_col or "")
        y_label = config.get("y_label", y_col or "")
        if x_label: code.append(f"ax.set_xlabel('{x_label}')")
        if y_label: code.append(f"ax.set_ylabel('{y_label}')")
        
        if title:
            code.append(f"fig.suptitle('{title}', fontsize={font_size + 2})")
        if subtitle:
            code.append(f"ax.set_title('{subtitle}', fontsize={font_size})")

        if not config.get("legend", True):
            code.append("if ax.get_legend(): ax.get_legend().remove()")
            
        rotation = float(config.get("axis_rotation", 0))
        if rotation > 0:
            code.append(f"for a in fig.axes:")
            code.append(f"    plt.setp(a.get_xticklabels(), rotation={rotation}, horizontalalignment='right')")
            
        if caption:
            code.append(f"fig.text(0.01, 0.01, '{caption}', transform=fig.transFigure, fontsize={font_size}, color='gray')")
            
        code.append("plt.tight_layout()")
        code.append("plt.show()")
        
    return "\n".join(code)
