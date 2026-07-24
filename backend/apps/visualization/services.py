import math
from django.core.cache import cache
import pandas as pd
import numpy as np
from apps.cleaning.utils import read_dataframe, make_json_safe

def get_dataset_analysis(dataset):
    """
    Retrieves comprehensive dataset statistics, caching the result with a key
    that incorporates the dataset's updated_at timestamp for automatic invalidation.
    """
    timestamp = int(dataset.updated_at.timestamp())
    cache_key = f"dataset_analysis_{dataset.id}_{timestamp}"
    
    analysis = cache.get(cache_key)
    if analysis:
        return analysis
        
    try:
        file_path = dataset.cleaned_file.path if dataset.cleaned_file else dataset.original_file.path
        df, _ = read_dataframe(file_path, dataset.file_type, encoding=dataset.encoding)
        
        analysis = run_comprehensive_analysis(df, dataset)
        cache.set(cache_key, analysis, timeout=None)  # Cache indefinitely until dataset updates
        return analysis
    except Exception as e:
        # Fallback empty profile
        return {
            "error": f"Failed to profile dataset: {str(e)}",
            "total_rows": dataset.rows_count or 0,
            "total_columns": dataset.cols_count or 0,
            "file_size": dataset.file_size or 0,
            "memory_usage": "Unknown",
            "numeric_columns": [],
            "categorical_columns": [],
            "boolean_columns": [],
            "date_columns": [],
            "text_columns": [],
            "null_counts": {},
            "total_nulls": 0,
            "duplicate_rows": 0,
            "unique_counts": {},
            "stats": {}
        }

def run_comprehensive_analysis(df, dataset):
    """
    Computes all metadata, types, and stats from the Pandas DataFrame.
    """
    total_rows = len(df)
    total_cols = len(df.columns)
    
    numeric_cols = []
    categorical_cols = []
    boolean_cols = []
    date_cols = []
    text_cols = []
    
    unique_counts = {}
    null_counts = {}
    stats = {}
    
    for col in df.columns:
        series = df[col]
        # Count nulls
        null_counts[col] = int(series.isna().sum())
        
        # Count unique values
        nunique = int(series.nunique(dropna=True))
        unique_counts[col] = nunique
        
        # Deduce column type
        if pd.api.types.is_bool_dtype(series):
            boolean_cols.append(col)
        elif pd.api.types.is_datetime64_any_dtype(series):
            date_cols.append(col)
        elif pd.api.types.is_numeric_dtype(series):
            numeric_cols.append(col)
            # Numeric Stats
            non_null = series.dropna()
            if len(non_null) > 0:
                stats[col] = {
                    "min": float(non_null.min()),
                    "max": float(non_null.max()),
                    "mean": float(non_null.mean()),
                    "median": float(non_null.median()),
                    "std": float(non_null.std()) if len(non_null) > 1 else 0.0
                }
        else:
            # Check if it could be parsed as a datetime
            is_date = False
            try:
                sample = series.dropna().head(20)
                if len(sample) > 0:
                    import warnings
                    with warnings.catch_warnings():
                        warnings.simplefilter("ignore", UserWarning)
                        parsed = pd.to_datetime(sample, format='mixed', errors='coerce')
                    if parsed.notna().sum() > 0.8 * len(sample):
                        is_date = True
            except:
                pass
                
            if is_date:
                date_cols.append(col)
            else:
                # Text vs Categorical threshold: <= 50 unique values OR < 10% unique values
                if nunique <= 50 or (total_rows > 0 and (nunique / total_rows) < 0.1):
                    categorical_cols.append(col)
                else:
                    text_cols.append(col)
                    
    duplicate_rows = int(df.duplicated().sum())
    
    try:
        mem_bytes = df.memory_usage(deep=True).sum()
        if mem_bytes < 1024:
            memory_usage = f"{mem_bytes} B"
        elif mem_bytes < 1024 * 1024:
            memory_usage = f"{mem_bytes / 1024:.2f} KB"
        else:
            memory_usage = f"{mem_bytes / (1024 * 1024):.2f} MB"
    except:
        memory_usage = "Unknown"
        
    return make_json_safe({
        "total_rows": total_rows,
        "total_columns": total_cols,
        "file_size": dataset.file_size,
        "memory_usage": memory_usage,
        "numeric_columns": numeric_cols,
        "categorical_columns": categorical_cols,
        "boolean_columns": boolean_cols,
        "date_columns": date_cols,
        "text_columns": text_cols,
        "null_counts": null_counts,
        "total_nulls": sum(null_counts.values()),
        "duplicate_rows": duplicate_rows,
        "unique_counts": unique_counts,
        "stats": stats
    })


def recommend_graphs(analysis):
    """
    Intelligently generates graph recommendations with confidence scores,
    difficulty level, and business use cases based on dataset properties.
    """
    recs = []
    
    num_cols = analysis.get("numeric_columns", [])
    cat_cols = analysis.get("categorical_columns", [])
    date_cols = analysis.get("date_columns", [])
    unique_counts = analysis.get("unique_counts", {})
    total_rows = analysis.get("total_rows", 0)
    
    # 1. Line Chart (Trend Analysis)
    if date_cols and num_cols:
        recs.append({
            "graph_type": "Line Chart",
            "confidence_score": 0.95,
            "reason": f"Detected date column '{date_cols[0]}' and numeric variable '{num_cols[0]}'. Ideal for tracking changes over chronological time.",
            "difficulty_level": "Easy",
            "business_use_case": "Forecast growth, monitor daily revenue trends, or observe seasonal patterns.",
            "recommended_columns": [date_cols[0], num_cols[0]]
        })
        
    # 2. Heatmap (Correlation)
    if len(num_cols) >= 2:
        recs.append({
            "graph_type": "Heatmap",
            "confidence_score": 0.90,
            "reason": f"Found {len(num_cols)} numeric columns. Perfect for correlation matrix mapping to identify linearly related variables.",
            "difficulty_level": "Medium",
            "business_use_case": "Spot dependencies, like product price vs sales count, or customer rating vs purchase frequency.",
            "recommended_columns": num_cols[:5]
        })
        
    # 3. Bar Chart (Comparison)
    if cat_cols and num_cols:
        recs.append({
            "graph_type": "Bar Chart",
            "confidence_score": 0.85,
            "reason": f"Contains categorical '{cat_cols[0]}' and numeric '{num_cols[0]}'. Best choice for comparing metric scores across distinct segments.",
            "difficulty_level": "Easy",
            "business_use_case": "Compare sales across departments, customer ratings across brands, or costs across regions.",
            "recommended_columns": [cat_cols[0], num_cols[0]]
        })
        
    # 4. Pie Chart (Proportions)
    small_cats = [c for c in cat_cols if unique_counts.get(c, 99) <= 10]
    if small_cats and num_cols:
        recs.append({
            "graph_type": "Pie Chart",
            "confidence_score": 0.80,
            "reason": f"Column '{small_cats[0]}' has few unique categories ({unique_counts[small_cats[0]]}). Ideal for showing part-to-whole ratio breakdowns.",
            "difficulty_level": "Easy",
            "business_use_case": "Visualize market share, gender distributions, or category cost allocation.",
            "recommended_columns": [small_cats[0], num_cols[0]]
        })
        
    # 5. Scatter Plot (Relationship)
    if len(num_cols) >= 2:
        recs.append({
            "graph_type": "Scatter Plot",
            "confidence_score": 0.85,
            "reason": f"Has multiple numeric features. Explores the bivariate relationship and detects clusters or correlation shapes.",
            "difficulty_level": "Easy",
            "business_use_case": "Map advertising spend against conversion rates, or employee experience vs salary.",
            "recommended_columns": [num_cols[0], num_cols[1]]
        })
        
    # 6. Box Plot (Outlier Analysis)
    if num_cols:
        # Check if we have categorical to group by
        rec_cols = [num_cols[0]]
        reason = f"Analyzes the statistical distribution, quartiles, median, and flags outlier values in '{num_cols[0]}'."
        if cat_cols:
            rec_cols.append(cat_cols[0])
            reason = f"Compares the distribution and identifies outliers of '{num_cols[0]}' grouped by category '{cat_cols[0]}'."
            
        recs.append({
            "graph_type": "Box Plot",
            "confidence_score": 0.80,
            "reason": reason,
            "difficulty_level": "Medium",
            "business_use_case": "Audit operational run times, salary ranges across departments, or detect data anomalies.",
            "recommended_columns": rec_cols
        })
        
    # 7. Histogram (Distribution)
    if num_cols:
        recs.append({
            "graph_type": "Histogram",
            "confidence_score": 0.75,
            "reason": f"Shows the probability distribution and frequency density profile of numeric variable '{num_cols[0]}'.",
            "difficulty_level": "Easy",
            "business_use_case": "Understand customer age demographics, transaction size frequency, or test scores dispersion.",
            "recommended_columns": [num_cols[0]]
        })
        
    # 8. Bubble Chart (Three-dimensional numeric)
    if len(num_cols) >= 3:
        recs.append({
            "graph_type": "Bubble Chart",
            "confidence_score": 0.75,
            "reason": "Three numeric columns detected. Plots X vs Y while using the 3rd variable to scale the bubble sizes.",
            "difficulty_level": "Hard",
            "business_use_case": "Compare products by revenue (X), profit margin (Y), and customer volume (Size).",
            "recommended_columns": num_cols[:3]
        })
        
    # 9. 3D Scatter Plot (Multi-dimensional space)
    if len(num_cols) >= 3:
        recs.append({
            "graph_type": "3D Scatter Plot",
            "confidence_score": 0.70,
            "reason": "Allows rendering of three numeric columns in an interactive 3D spatial box.",
            "difficulty_level": "Hard",
            "business_use_case": "Visualize three-way customer segments like age, income, and spending scores.",
            "recommended_columns": num_cols[:3]
        })
        
    # 10. Scatter Matrix (High dimensional overview)
    if len(num_cols) >= 3:
        recs.append({
            "graph_type": "Scatter Matrix",
            "confidence_score": 0.80,
            "reason": "Allows simultaneous pairwise plotting of multiple numeric features for rapid scanning.",
            "difficulty_level": "Hard",
            "business_use_case": "Perform broad exploratory analysis across all numeric columns to quickly spot patterns.",
            "recommended_columns": num_cols[:4]
        })

    # Sort recommendations by confidence score descending
    recs.sort(key=lambda x: x["confidence_score"], reverse=True)
    return recs


def validate_graph_config(analysis, graph_type, x_col=None, y_col=None, z_col=None, size_col=None, color_col=None, source_col=None, target_col=None):
    """
    Validates a graph type selection against the dataset columns.
    Returns (is_valid, error_message, recommended_type)
    """
    num_cols = analysis.get("numeric_columns", [])
    cat_cols = analysis.get("categorical_columns", [])
    date_cols = analysis.get("date_columns", [])
    unique_counts = analysis.get("unique_counts", {})
    
    graph_type_lower = graph_type.lower().replace(" ", "").replace("_", "")
    
    # 1. Heatmap / Correlation Chart
    if graph_type_lower in ["heatmap", "correlationchart"]:
        if len(num_cols) < 2:
            return False, "Heatmap requires at least two numeric columns for correlation matrix analysis.", "Scatter Plot"
            
    # 2. Scatter Plot
    elif graph_type_lower in ["scatterplot", "scatter"]:
        if not x_col or not y_col:
            return False, "Scatter Plot requires both X-axis and Y-axis columns.", None
        if x_col not in num_cols or y_col not in num_cols:
            return False, "Scatter Plot requires both X and Y columns to be numeric.", None
            
    # 3. Bubble Chart
    elif graph_type_lower in ["bubblechart", "bubble"]:
        if not x_col or not y_col or not size_col:
            return False, "Bubble Chart requires X-axis, Y-axis, and size columns.", None
        if x_col not in num_cols or y_col not in num_cols or size_col not in num_cols:
            return False, "Bubble Chart requires X, Y, and Bubble Size columns to be numeric.", None
            
    # 4. 3D Scatter Plot
    elif graph_type_lower in ["3dscatterplot", "3dscatter"]:
        if not x_col or not y_col or not z_col:
            return False, "3D Scatter Plot requires X-axis, Y-axis, and Z-axis columns.", None
        if x_col not in num_cols or y_col not in num_cols or z_col not in num_cols:
            return False, "3D Scatter Plot requires all three axes (X, Y, Z) to be numeric.", None
            
    # 5. Pie Chart
    elif graph_type_lower in ["piechart", "pie"]:
        if not x_col: # X acts as the labels
            return False, "Pie Chart requires a Labels (category) column.", None
        # Check cardinality
        cardinality = unique_counts.get(x_col, 0)
        if cardinality > 15:
            return False, f"Pie Chart category '{x_col}' has too many unique values ({cardinality}). The chart would be unreadable. We recommend using a Bar Chart instead.", "Bar Chart"
            
    # 6. Scatter Matrix
    elif graph_type_lower in ["scattermatrix", "splom"]:
        if len(num_cols) < 3:
            return False, "Scatter Matrix requires at least three numeric columns to construct the grid.", "Scatter Plot"
            
    # 7. Line Chart
    elif graph_type_lower in ["linechart", "line"]:
        if not x_col or not y_col:
            return False, "Line Chart requires both X-axis and Y-axis columns.", None
            
    # 8. Histogram
    elif graph_type_lower in ["histogram", "distplot", "distributionchart"]:
        if not x_col:
            return False, "Histogram requires an X-axis column.", None
        if x_col not in num_cols:
            return False, f"Histogram requires the X-axis column '{x_col}' to be numeric.", None
            
    # 9. Box Plot
    elif graph_type_lower in ["boxplot", "box"]:
        if not x_col:
            return False, "Box Plot requires a numeric value column on X-axis.", None
        if x_col not in num_cols:
            return False, f"Box Plot requires the primary column '{x_col}' to be numeric.", None
            
    # 10. Network Graph
    elif graph_type_lower in ["networkgraph", "network", "relationshipchart"]:
        if not source_col or not target_col:
            return False, "Network Graph requires both Source Node and Target Node columns.", None

    return True, None, None


def apply_smart_decisions(df, config):
    """
    Applies automatic sorting, aggregation, pie grouping, and sampling on the dataframe.
    Returns: (processed_df, notes_list)
    """
    notes = []
    graph_type = config.get("graph_type", "").lower().replace(" ", "").replace("_", "")
    x_col = config.get("x_column")
    y_col = config.get("y_column")
    
    processed_df = df.copy()
    
    # 1. Dataset Sampling for preview speed
    is_export = config.get("is_export", False)
    if len(processed_df) > 10000 and not is_export:
        processed_df = processed_df.sample(n=2000, random_state=42)
        notes.append(f"Dataset contains {len(df)} rows. Sampled 2,000 rows for smooth realtime editing.")
        
    # 2. Aggregations for Bar and Pie Charts
    # If the categories in x_col have duplicate rows, they must be aggregated.
    if graph_type in ["bar", "barchart", "barplot", "pie", "piechart"]:
        if x_col and x_col in processed_df.columns:
            # Check if x_col contains duplicates
            if processed_df[x_col].duplicated().any():
                agg_func = config.get("aggregation", "sum")  # sum, mean, count
                if y_col and y_col in processed_df.columns and pd.api.types.is_numeric_dtype(processed_df[y_col]):
                    # Group by X and aggregate Y
                    if agg_func == "sum":
                        processed_df = processed_df.groupby(x_col, as_index=False)[y_col].sum()
                    elif agg_func == "mean":
                        processed_df = processed_df.groupby(x_col, as_index=False)[y_col].mean()
                    elif agg_func == "count":
                        processed_df = processed_df.groupby(x_col, as_index=False)[y_col].count()
                    notes.append(f"Automatically aggregated duplicate categories in '{x_col}' using '{agg_func}' of '{y_col}'.")
                else:
                    # No Y, just count occurrences of X
                    processed_df = processed_df.groupby(x_col, as_index=False).size().rename(columns={"size": "count"})
                    config["y_column"] = "count"  # redirect Y to count
                    notes.append(f"Automatically counted occurrences of categories in '{x_col}'.")
                    
    # 3. Pie Chart "Others" category
    if graph_type in ["pie", "piechart"]:
        if x_col and x_col in processed_df.columns:
            val_col = config.get("y_column")
            if val_col and val_col in processed_df.columns:
                # Group small slices into Others
                nunique = processed_df[x_col].nunique()
                if nunique > 8:
                    # Sort descending by values
                    processed_df = processed_df.sort_values(by=val_col, ascending=False).reset_index(drop=True)
                    top_7 = processed_df.iloc[:7]
                    others_sum = processed_df.iloc[7:][val_col].sum()
                    
                    others_row = pd.DataFrame([{x_col: "Others", val_col: others_sum}])
                    processed_df = pd.concat([top_7, others_row], ignore_index=True)
                    notes.append(f"Grouped categories outside of top 7 into 'Others'.")
                    
    # 4. Sorting for Bar Charts
    if graph_type in ["bar", "barchart", "barplot"]:
        sort_order = config.get("sorting", "none")  # none, ascending, descending
        if sort_order != "none" and y_col and y_col in processed_df.columns:
            asc = (sort_order == "ascending")
            processed_df = processed_df.sort_values(by=y_col, ascending=asc).reset_index(drop=True)
            notes.append(f"Sorted bars in {sort_order} order based on '{y_col}'.")
            
    return processed_df, notes
