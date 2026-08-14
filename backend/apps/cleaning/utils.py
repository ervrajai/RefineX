import os
import io
import csv
import re
import numpy as np
import pandas as pd
from django.core.files.base import ContentFile

def is_numeric_column(series):
    """
    Returns True if series is strictly numeric (int or float) and NOT boolean.
    Pandas considers boolean dtypes as numeric in is_numeric_dtype(s), which causes
    quantile, lerp, std, variance, and outlier operations to fail with:
    TypeError: numpy boolean subtract, the '-' operator, is not supported.
    """
    if series is None or len(series) == 0:
        return False
    if pd.api.types.is_bool_dtype(series):
        return False
    if str(series.dtype).lower() in ['bool', 'boolean', 'bool_']:
        return False
    return pd.api.types.is_numeric_dtype(series)

def make_columns_unique(columns):
    """
    Guarantees all column names are unique, non-empty, and free of accidental duplication.
    """
    new_cols = []
    seen = set()
    for col in columns:
        col_str = str(col).strip()
        if not col_str:
            col_str = "unnamed"
        candidate = col_str
        count = 1
        while candidate in seen:
            candidate = f"{col_str}_{count}"
            count += 1
        seen.add(candidate)
        new_cols.append(candidate)
    return new_cols

def clean_numeric_series(series):
    """
    Cleans currency symbols ($, ₹, €, £, ¥, ₩, ฿, ₫, ₱, ¢, ¤, etc.),
    currency codes/words (rs, rs., Rs, RS, USD, INR, EUR, GBP, JPY, AUD, CAD, CHF, CNY, SGD, NZD, AED, SAR, BRL, RUB, etc.),
    accounting negative formats '(100.50)', percentage signs (%), spaces, and thousand-separator commas.
    Returns a float numeric pandas Series (with NaN for unparsable values).
    """
    if series is None or len(series) == 0:
        return series
        
    s = series.astype(str).str.strip()
    
    # 1. Detect accounting negative format e.g. ($100.50) or (100 rs)
    is_parenthesized = s.str.match(r'^\(.*\)$', na=False)
    s = s.str.replace(r'^\((.*)\)$', r'\1', regex=True).str.strip()
    
    # 2. Strip common currency symbols ($, ₹, €, £, ¥, ₩, ฿, ₫, ₱, ¢, ¤, %)
    s = s.str.replace(r'[$₹€£¥₩฿₫₱¢¤%]', '', regex=True)
    
    # 3. Strip currency word codes/prefixes/suffixes (case-insensitive, optional trailing dot)
    currency_words_regex = r'(?i)(rs|inr|usd|eur|gbp|jpy|aud|cad|chf|cny|sgd|nzd|aed|sar|brl|rub)\.?'
    s = s.str.replace(currency_words_regex, '', regex=True)
    
    # 4. Strip thousand separator commas and extra spaces
    s = s.str.replace(',', '', regex=False).str.strip()
    
    # 5. Parse to numeric
    numeric_s = pd.to_numeric(s, errors='coerce')
    
    # 6. Apply negative sign for parenthesized accounting format
    if is_parenthesized.any():
        numeric_s = numeric_s.mask(is_parenthesized & numeric_s.notna(), -numeric_s.abs())
        
    return numeric_s

def read_dataframe(file_input, file_type='csv', encoding='UTF-8'):
    """
    Safely reads a dataset into a Pandas DataFrame, handling:
    - Django FieldFile / File instances (from remote S3/B2 storage or local storage)
    - File-like objects (io.BytesIO, StringIO)
    - Raw bytes
    - File system string paths / storage keys
    Handles Parquet, CSV (delimiter sniffing & multiple encodings), and Excel (xlsx/xls).
    """
    if file_input is None:
        raise ValueError("No file provided to read_dataframe.")

    # Determine file_type if not explicitly known
    ext = (file_type or "").lower()
    if hasattr(file_input, 'name') and file_input.name:
        ext = file_input.name.split('.')[-1].lower()
    elif isinstance(file_input, str) and '.' in file_input:
        ext = file_input.split('.')[-1].lower()

    # Extract bytes safely from any source
    content_bytes = None
    if isinstance(file_input, bytes):
        content_bytes = file_input
    elif hasattr(file_input, 'read'):
        try:
            if hasattr(file_input, 'seek'):
                file_input.seek(0)
            content_bytes = file_input.read()
        except Exception:
            if hasattr(file_input, 'open'):
                with file_input.open('rb') as f:
                    content_bytes = f.read()
            else:
                raise
    elif hasattr(file_input, 'open'):
        with file_input.open('rb') as f:
            content_bytes = f.read()
    elif isinstance(file_input, str):
        if os.path.exists(file_input):
            with open(file_input, 'rb') as f:
                content_bytes = f.read()
        else:
            from django.core.files.storage import default_storage
            if default_storage.exists(file_input):
                with default_storage.open(file_input, 'rb') as f:
                    content_bytes = f.read()
            else:
                raise ValueError(f"File not found: {file_input}")

    if not content_bytes or len(content_bytes.strip()) == 0:
        raise ValueError("The dataset file is empty.")

    if ext == 'parquet' or file_type.lower() == 'parquet':
        try:
            df = pd.read_parquet(io.BytesIO(content_bytes))
            df.columns = make_columns_unique(df.columns)
            return df, 'UTF-8'
        except Exception as e:
            raise ValueError(f"Could not read Parquet file: {str(e)}")

    return read_dataframe_from_bytes(content_bytes, file_type=file_type, encoding=encoding)


def read_dataframe_from_bytes(content_bytes, file_type, encoding='UTF-8'):
    """
    Safely reads raw dataset bytes into a Pandas DataFrame, handling encodings, BOM, and delimiter sniffing.
    """
    if not content_bytes or len(content_bytes.strip()) == 0:
        raise ValueError("The uploaded dataset is empty.")

    if file_type.lower() == 'csv':
        encodings_to_try = [encoding, 'utf-8-sig', 'utf-8', 'latin-1', 'cp1252', 'utf-16']
        seen_enc = set()
        unique_encodings = [x for x in encodings_to_try if not (x.lower() in seen_enc or seen_enc.add(x.lower()))]

        df = None
        detected_encoding = encoding

        for enc in unique_encodings:
            try:
                sample = content_bytes[:10240].decode(enc, errors='ignore')
                try:
                    dialect = csv.Sniffer().sniff(sample)
                    delimiter = dialect.delimiter
                    if delimiter not in [',', ';', '\t', '|', ':']:
                        delimiter = ','
                except Exception:
                    if ';' in sample and sample.count(';') > sample.count(','):
                        delimiter = ';'
                    elif '\t' in sample:
                        delimiter = '\t'
                    elif '|' in sample and sample.count('|') > sample.count(','):
                        delimiter = '|'
                    else:
                        delimiter = ','

                df = pd.read_csv(io.BytesIO(content_bytes), encoding=enc, sep=delimiter, on_bad_lines='skip', engine='python')
                detected_encoding = enc
                break
            except Exception:
                try:
                    df = pd.read_csv(io.BytesIO(content_bytes), encoding=enc, on_bad_lines='skip')
                    detected_encoding = enc
                    break
                except Exception:
                    continue

        if df is None:
            raise ValueError("Failed to parse CSV dataset. Check delimiter, rows format, or file corruption.")

        df.columns = make_columns_unique(df.columns)
        return df, detected_encoding
    elif file_type.lower() in ['xlsx', 'xls']:
        try:
            df = pd.read_excel(io.BytesIO(content_bytes))
            df.columns = make_columns_unique(df.columns)
            return df, 'UTF-8'
        except Exception as e:
            raise ValueError(f"Could not read Excel file: {str(e)}")
    else:
        raise ValueError(f"Unsupported file type: {file_type}")

import datetime
import uuid

def make_json_safe(obj):
    """
    Recursively converts NumPy/Pandas data types, datetimes, UUIDs, and float NaNs
    to standard Python types that are JSON serializable.
    """
    if isinstance(obj, (pd.Series, pd.Index)):
        return make_json_safe(obj.tolist())
    elif isinstance(obj, dict):
        return {str(k): make_json_safe(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [make_json_safe(v) for v in obj]
    elif isinstance(obj, (tuple, set)):
        return [make_json_safe(v) for v in obj]
    elif isinstance(obj, (np.integer, np.int64, np.int32, np.int16, np.int8)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32, np.float16, float)):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return float(obj)
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return make_json_safe(obj.tolist())
    elif isinstance(obj, (pd.Timestamp, pd.DatetimeIndex, datetime.datetime, datetime.date)):
        return obj.isoformat()
    elif isinstance(obj, uuid.UUID):
        return str(obj)
    else:
        try:
            if pd.isna(obj):
                return None
        except Exception:
            pass
    return obj



def calculate_quality_score(df, report=None, original_row_count=None):
    """
    Calculates an objective Data Quality Score (0-100) applicable to both Auto and Manual modes.
    
    Penalties:
    - Missing Values Ratio: Up to -35 pts
    - Duplicate Rows Ratio: Up to -25 pts
    - Mixed / Invalid Sentinel Data Types: Up to -15 pts
    - Data/Row Loss Ratio: Up to -35 pts (penalizes aggressive row deletion to prevent vanity metrics)
    - Outliers: 0 pts penalty (outliers do NOT reduce score)
    """
    if df is None or len(df) == 0:
        return 0

    score = 100.0
    rows = max(1, len(df))
    cols = max(1, len(df.columns))
    total_cells = rows * cols

    # 1. Missing Values Penalty (max -35 pts)
    missing_cells = 0
    if report and isinstance(report, dict) and "missing_summary" in report:
        missing_cells = report["missing_summary"].get("total_missing", 0)
    else:
        try:
            missing_cells = int(df.isna().sum().sum())
        except Exception:
            missing_cells = 0

    missing_ratio = missing_cells / total_cells if total_cells > 0 else 0
    score -= (missing_ratio * 35.0)

    # 2. Duplicate Rows Penalty (max -25 pts)
    dup_rows = 0
    if report and isinstance(report, dict) and "duplicate_summary" in report:
        dup_rows = report["duplicate_summary"].get("duplicate_rows_count", 0)
    else:
        try:
            dup_rows = int(df.duplicated().sum())
        except Exception:
            dup_rows = 0

    dup_ratio = dup_rows / rows if rows > 0 else 0
    score -= (dup_ratio * 25.0)

    # 3. Mixed / Invalid Sentinel Values Penalty (max -15 pts)
    invalid_cells = 0
    blank_markers = {"", " ", "na", "n/a", "null", "none", "-", "--", "unknown", "nan", "nil", "missing", "#n/a", "#na"}
    for col in df.columns:
        if df[col].dtype == object or pd.api.types.is_string_dtype(df[col]):
            try:
                s_str = df[col].astype(str).str.strip().str.lower()
                mask = s_str.isin(blank_markers) & df[col].notna()
                invalid_cells += int(mask.sum())
            except Exception:
                pass

    invalid_ratio = invalid_cells / total_cells if total_cells > 0 else 0
    score -= (invalid_ratio * 15.0)

    # 4. Data Loss Penalty (max -35 pts)
    orig_rows = original_row_count
    if not orig_rows and report and isinstance(report, dict):
        orig_rows = report.get("original_row_count") or report.get("rows")
    
    if orig_rows and orig_rows > rows:
        row_loss_ratio = (orig_rows - rows) / orig_rows
        score -= (row_loss_ratio * 35.0)

    # Note: Outliers do NOT reduce the score.

    # Enforce boundaries [0, 100]
    score = max(0.0, min(100.0, score))
    return int(round(score))


def profile_dataset(df, original_row_count=None):
    """
    Profiles a Pandas DataFrame and returns a comprehensive, JSON-safe report.
    """
    rows = len(df)
    cols = len(df.columns)
    shape = [rows, cols]
    
    # Estimate memory usage
    try:
        mem_bytes = df.memory_usage(deep=True).sum()
        if mem_bytes < 1024:
            memory_usage = f"{mem_bytes} B"
        elif mem_bytes < 1024 * 1024:
            memory_usage = f"{mem_bytes / 1024:.2f} KB"
        else:
            memory_usage = f"{mem_bytes / (1024 * 1024):.2f} MB"
    except Exception:
        memory_usage = "Unknown"

    # Missing Value analysis
    missing_summary = {}
    missing_by_col = []
    total_missing = 0
    
    for col in df.columns:
        m_count = int(df[col].isna().sum())
        total_missing += m_count
        m_pct = (m_count / rows) * 100 if rows > 0 else 0
        missing_by_col.append({
            "column": col,
            "missing_count": m_count,
            "missing_percent": m_pct
        })
    missing_summary["total_missing"] = total_missing
    missing_summary["columns"] = missing_by_col

    # Duplicate analysis
    dup_rows_count = int(df.duplicated().sum())
    dup_rows_pct = (dup_rows_count / rows) * 100 if rows > 0 else 0
    
    # Duplicate columns via robust Series.equals comparison
    dup_cols_count = 0
    dup_cols_list = []
    if cols > 1 and cols < 1000:
        try:
            cols_arr = list(df.columns)
            seen_dup = set()
            for i in range(len(cols_arr)):
                if cols_arr[i] in seen_dup:
                    continue
                for j in range(i + 1, len(cols_arr)):
                    if cols_arr[j] in seen_dup:
                        continue
                    if df[cols_arr[i]].equals(df[cols_arr[j]]):
                        seen_dup.add(cols_arr[j])
            dup_cols_list = list(seen_dup)
            dup_cols_count = len(dup_cols_list)
        except Exception:
            pass

    duplicate_summary = {
        "duplicate_rows_count": dup_rows_count,
        "duplicate_rows_percentage": dup_rows_pct,
        "duplicate_columns_count": dup_cols_count,
        "duplicate_columns_names": dup_cols_list
    }

    # Data Types Report
    dtype_report = []
    constant_columns = []
    low_variance_columns = []
    high_cardinality_columns = []
    
    for col in df.columns:
        curr_type = str(df[col].dtype)
        unique_vals = df[col].nunique(dropna=True)
        
        # Check constant
        if unique_vals <= 1:
            constant_columns.append(col)
        
        # Check low variance (for numeric)
        is_num = is_numeric_column(df[col])
        if is_num and rows > 1:
            try:
                var = df[col].var(ddof=1)
                if pd.notna(var) and var < 0.001:
                    low_variance_columns.append(col)
            except Exception:
                pass
        
        # High cardinality (objects with >50% unique values)
        if curr_type == 'object' and rows > 0:
            if (unique_vals / rows) > 0.5 and unique_vals > 10:
                high_cardinality_columns.append(col)

        # Suggested type
        sug_type = curr_type
        if curr_type == 'object':
            # Check if it could be datetime
            try:
                import warnings
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore", UserWarning)
                    parsed = pd.to_datetime(df[col].dropna().head(20), format='mixed', errors='coerce')
                if parsed.notna().sum() > 10 or (parsed.notna().sum() == len(df[col].dropna().head(20)) and len(df[col].dropna().head(20)) > 0):
                    sug_type = 'datetime64[ns]'
            except Exception:
                pass
            
            # Check if it could be numeric
            try:
                sample = df[col].dropna().head(20)
                if len(sample) > 0:
                    cleaned = clean_numeric_series(sample)
                    if (cleaned.notna().sum() / len(sample)) >= 0.7:
                        sug_type = 'float64'
            except Exception:
                pass

        conversion_needed = (curr_type != sug_type)
        dtype_report.append({
            "column": col,
            "current_type": curr_type,
            "suggested_type": sug_type,
            "conversion_needed": conversion_needed
        })

    # Outlier detection (IQR and Z-score)
    outlier_report = []
    numeric_columns = []
    
    for col in df.columns:
        if is_numeric_column(df[col]):
            numeric_columns.append(col)
            col_nonnull = df[col].dropna()
            outlier_count = 0
            iqr_val = 0.0
            if len(col_nonnull) > 4:
                try:
                    q1 = col_nonnull.quantile(0.25)
                    q3 = col_nonnull.quantile(0.75)
                    iqr = q3 - q1
                    iqr_val = float(iqr) if pd.notna(iqr) else 0.0
                    if iqr_val > 0:
                        lower_bound = q1 - 1.5 * iqr
                        upper_bound = q3 + 1.5 * iqr
                        outliers = col_nonnull[(col_nonnull < lower_bound) | (col_nonnull > upper_bound)]
                        outlier_count = len(outliers)
                    else:
                        # Fallback to Z-score bounds if IQR is 0
                        mean_val = col_nonnull.mean()
                        std_val = col_nonnull.std()
                        if pd.notna(std_val) and std_val > 0:
                            lower_bound = mean_val - 3 * std_val
                            upper_bound = mean_val + 3 * std_val
                            outliers = col_nonnull[(col_nonnull < lower_bound) | (col_nonnull > upper_bound)]
                            outlier_count = len(outliers)
                        else:
                            outlier_count = 0
                except Exception:
                    outlier_count = 0
            
            outlier_report.append({
                "column": col,
                "outlier_count": outlier_count,
                "method_used": "IQR" if iqr_val > 0 else "Z-score"
            })

    # Numeric Statistics
    numeric_stats = []
    for col in df.columns:
        if is_numeric_column(df[col]):
            try:
                col_nonnull = df[col].dropna()
                if len(col_nonnull) > 0:
                    q1_val = col_nonnull.quantile(0.25)
                    q3_val = col_nonnull.quantile(0.75)
                    q1 = float(q1_val) if pd.notna(q1_val) else 0.0
                    q3 = float(q3_val) if pd.notna(q3_val) else 0.0
                    iqr = q3 - q1
                    
                    # Mode extraction safely
                    mode_series = col_nonnull.mode()
                    mode_val = None
                    if not mode_series.empty:
                        try:
                            mode_val = float(mode_series.iloc[0])
                        except Exception:
                            mode_val = str(mode_series.iloc[0])

                    numeric_stats.append({
                        "column": col,
                        "mean": float(col_nonnull.mean()) if pd.notna(col_nonnull.mean()) else 0.0,
                        "median": float(col_nonnull.median()) if pd.notna(col_nonnull.median()) else 0.0,
                        "mode": mode_val,
                        "min": float(col_nonnull.min()) if pd.notna(col_nonnull.min()) else 0.0,
                        "max": float(col_nonnull.max()) if pd.notna(col_nonnull.max()) else 0.0,
                        "std": float(col_nonnull.std()) if len(col_nonnull) > 1 and pd.notna(col_nonnull.std()) else 0.0,
                        "variance": float(col_nonnull.var()) if len(col_nonnull) > 1 and pd.notna(col_nonnull.var()) else 0.0,
                        "q1": q1,
                        "q3": q3,
                        "iqr": iqr
                    })
            except Exception:
                pass

    # Correlation Matrix
    correlation_matrix = {}
    if len(numeric_columns) > 1:
        try:
            corr_df = df[numeric_columns].corr()
            correlation_matrix = corr_df.to_dict()
        except Exception:
            pass

    report = {
        "rows": rows,
        "columns": cols,
        "shape": shape,
        "memory_usage": memory_usage,
        "missing_summary": missing_summary,
        "duplicate_summary": duplicate_summary,
        "data_types": dtype_report,
        "constant_columns": constant_columns,
        "low_variance_columns": low_variance_columns,
        "high_cardinality_columns": high_cardinality_columns,
        "outlier_report": outlier_report,
        "numeric_statistics": numeric_stats,
        "correlation_matrix": correlation_matrix,
    }

    # Add calculated quality score
    report["quality_score"] = calculate_quality_score(df, report, original_row_count=original_row_count)
    
    return make_json_safe(report)


def strip_emojis_and_control_chars(text):
    """
    Strips emojis, non-printable unicode control characters, zero-width spaces, and HTML tags from a text string.
    """
    if not isinstance(text, str):
        return text
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map symbols
        "\U0001F1E0-\U0001F1FF"  # flags (iOS)
        "\U00002702-\U000027B0"
        "\U000024C2-\U000025B6"
        "\u2600-\u27BF"          # misc symbols & dingbats
        "\u2300-\u23FF"          # technical symbols
        "\u2B00-\u2BFF"
        "\u200b-\u200d"          # zero-width spaces
        "\uFE0F"                 # variation selector
        "\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f"  # control characters
        "]+", flags=re.UNICODE
    )
    cleaned = emoji_pattern.sub('', text)
    cleaned = re.sub(r'<[^>]+>', '', cleaned)  # Remove HTML tags
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()  # Collapse extra whitespace
    return cleaned

# Strong EMAIL regex (RFC 5322-style, practical strict version):
#   - no leading/trailing/consecutive dots in local part
#   - domain must have valid labels + a 2+ letter TLD
EMAIL_REGEX = re.compile(
    r"^(?!.*\.\.)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+"
    r"(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*"
    r"@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+"
    r"[a-zA-Z]{2,63}$"
)

# Strong MOBILE NUMBER regex (checked AFTER stripping spaces/dashes/dots/
# parentheses down to digits + optional leading '+'). Enforces E.164 shape:
#   - optional single leading '+'
#   - first digit cannot be 0
#   - total digit length between 7 and 15 (ITU E.164 max)
MOBILE_REGEX = re.compile(r"^\+?[1-9]\d{6,14}$")

EMAIL_NAME_HINTS = {"email", "e_mail", "mail", "email_address", "emailid", "email_id"}
MOBILE_NAME_HINTS = {
    "phone", "mobile", "cell", "contact", "contact_no", "contact_number",
    "mob", "mob_no", "mobile_no", "mobile_number", "phone_no", "phone_number",
    "whatsapp", "telephone", "tel"
}


def auto_clean_dataset(df):
    """
    Executes the enterprise 6-Phase Heuristic Engine for 'Auto-Decide' mode.
    
    Phase 1 (Structural & Text Hygiene):
      - Standardize header names to snake_case.
      - Remove emojis, non-printable unicode, HTML tags, and extra spaces from text cells.
      - Normalize sentinel blank strings ("N/A", "NULL", etc.) to NaN.
      - Drop exact duplicate rows.
      
    Phase 2 (Email/Mobile Validation, Currency, Date & Negative Number Repair):
      - Detect and strictly validate Email columns (RFC 5322-style regex); invalid emails -> NaN.
      - Detect and strictly validate Mobile/Phone columns (E.164-style regex); invalid numbers -> NaN.
      - Clean currency symbols ($, ₹, €, £, Rs, USD, INR), commas, and percentages.
      - Correct erroneous negative numbers (e.g. negative age/price/quantity/count) to positive.
      - Parse and format date columns to standard 'YYYY-MM-DD' ISO format.
      - Infer and coerce remaining text columns to numeric dtypes.
      
    Phase 3 (Dimensionality Pruning):
      - Drop columns with >60% missing values.
      
    Phase 4 (Post-Validation Imputation & Null Resolution):
      - Impute missing values created from invalid conversions or original nulls.
      - Numeric columns -> Column Median.
      - Categorical/Date columns -> Column Mode or Forward/Backward fill.
      
    Phase 5 (Outlier Capping, Decimal Rounding & Integer Refinement):
      - Enforce non-destructive IQR capping (clipping) for numeric columns.
      - Round float columns to 2 decimal places (default).
      - Cast whole numeric columns to Integer (int64) dtypes.
      
    Phase 6 (Profiling & Scoring):
      - Recalculate profiling report and final Dataset Quality Score.
      
    Returns: (cleaned_df, logs_list, before_report, after_report)
    """
    logs = []
    original_row_count = len(df)
    before_report = profile_dataset(df)
    cleaned_df = df.copy()

    logs.append(f"⚡ RefineX Auto-Decide Engine initialized ({len(df)} rows, {len(df.columns)} columns)")

    # -------------------------------------------------------------
    # PHASE 1: STRUCTURAL CLEANUP & TEXT SANITIZATION
    # -------------------------------------------------------------
    # 1. Standardize Header Names to snake_case
    new_cols = []
    changed_headers = 0
    for col in cleaned_df.columns:
        col_str = str(col).strip()
        col_str = re.sub(r'[^\w\s-]', '', col_str)
        col_str = re.sub(r'\s+', '_', col_str).lower()
        col_str = re.sub(r'_+', '_', col_str).strip('_')
        if col_str != str(col):
            changed_headers += 1
        new_cols.append(col_str)

    # Ensure uniqueness of headers
    cleaned_df.columns = make_columns_unique(new_cols)

    if changed_headers > 0:
        logs.append(f"✓ Phase 1: Standardized {changed_headers} column headers to clean snake_case")

    # 2. Remove Emojis, Unicode control characters, HTML & Normalize Sentinel Strings
    blank_markers = {"", " ", "na", "n/a", "null", "none", "-", "--", "unknown", "nan", "nil", "missing", "#n/a", "#na", "?"}
    blank_count = 0
    emoji_cleaned_count = 0

    for col in cleaned_df.columns:
        if cleaned_df[col].dtype == object or pd.api.types.is_string_dtype(cleaned_df[col]):
            try:
                # Strip emojis, unicode artifacts, and extra whitespace
                orig_series = cleaned_df[col].copy()
                cleaned_df[col] = cleaned_df[col].apply(lambda x: strip_emojis_and_control_chars(x) if isinstance(x, str) else x)
                
                if not cleaned_df[col].equals(orig_series):
                    emoji_cleaned_count += 1

                # Normalize sentinel strings to NaN
                s_str = cleaned_df[col].astype(str).str.strip().str.lower()
                mask = s_str.isin(blank_markers) & cleaned_df[col].notna()
                if mask.any():
                    blank_count += int(mask.sum())
                    cleaned_df.loc[mask, col] = np.nan
            except Exception:
                pass

    if emoji_cleaned_count > 0:
        logs.append(f"✓ Phase 1: Sanitized text in {emoji_cleaned_count} column(s) (removed emojis, HTML tags, and unicode control characters)")

    if blank_count > 0:
        logs.append(f"✓ Phase 1: Normalized {blank_count} blank/sentinel strings to NaN")

    # 3. Drop Exact Duplicate Rows
    dups_count = int(cleaned_df.duplicated().sum())
    if dups_count > 0:
        cleaned_df = cleaned_df.drop_duplicates().reset_index(drop=True)
        logs.append(f"✓ Phase 1: Removed {dups_count} exact duplicate rows")

    # -------------------------------------------------------------
    # PHASE 2: EMAIL/MOBILE VALIDATION, CURRENCY, DATE & NEGATIVE NUMBER REPAIR
    # -------------------------------------------------------------
    email_cleaned_count = 0
    email_invalid_count = 0
    mobile_cleaned_count = 0
    mobile_invalid_count = 0
    currency_cleaned_count = 0
    date_cleaned_count = 0

    for col in cleaned_df.columns:
        col_dtype = cleaned_df[col].dtype

        if col_dtype == object or pd.api.types.is_string_dtype(cleaned_df[col]):
            s_non_null = cleaned_df[col].dropna().astype(str)

            if len(s_non_null) > 0:
                col_name_lower = str(col).lower()

                # 0a. Strong Email Validation
                is_email_name = any(hint in col_name_lower for hint in EMAIL_NAME_HINTS)
                email_match_ratio = s_non_null.str.strip().str.match(EMAIL_REGEX).mean()
                if is_email_name or email_match_ratio >= 0.6:
                    before_valid = cleaned_df[col].notna().sum()
                    cleaned_df[col] = cleaned_df[col].apply(
                        lambda x: x.strip().lower() if isinstance(x, str) and EMAIL_REGEX.match(x.strip()) else np.nan
                    )
                    invalid_here = int(before_valid - cleaned_df[col].notna().sum())
                    email_cleaned_count += 1
                    email_invalid_count += invalid_here
                    continue

                # 0b. Strong Mobile Number Validation
                is_mobile_name = any(hint in col_name_lower for hint in MOBILE_NAME_HINTS)
                stripped_sample = s_non_null.apply(lambda x: re.sub(r'[^\d+]', '', x))
                mobile_match_ratio = stripped_sample.str.match(MOBILE_REGEX).mean()
                if is_mobile_name or mobile_match_ratio >= 0.6:
                    def _clean_mobile(x):
                        if not isinstance(x, str):
                            return np.nan
                        digits = re.sub(r'[^\d+]', '', x)
                        if digits.count('+') > 1 or ('+' in digits and not digits.startswith('+')):
                            return np.nan
                        return digits if MOBILE_REGEX.match(digits) else np.nan

                    before_valid = cleaned_df[col].notna().sum()
                    cleaned_df[col] = cleaned_df[col].apply(_clean_mobile)
                    invalid_here = int(before_valid - cleaned_df[col].notna().sum())
                    mobile_cleaned_count += 1
                    mobile_invalid_count += invalid_here
                    continue

        # 1. Currency & Special Numeric Cleaning for text columns
        if col_dtype == object or pd.api.types.is_string_dtype(cleaned_df[col]):
            s_non_null = cleaned_df[col].dropna().astype(str)
            if len(s_non_null) > 0:
                has_currency_symbols = s_non_null.str.contains(r'[$₹€£¥₩฿₫₱¢¤%]|(?i)\b(rs|inr|usd|eur|gbp|jpy)\b', regex=True).any()
                cleaned_num = clean_numeric_series(cleaned_df[col])
                valid_num_count = cleaned_num.notna().sum()
                
                if valid_num_count > 0 and (has_currency_symbols or (valid_num_count / len(s_non_null)) >= 0.5):
                    cleaned_df[col] = cleaned_num
                    currency_cleaned_count += 1
                    continue

        # 2. Date Formatting (YYYY-MM-DD)
        if col_dtype == object or pd.api.types.is_string_dtype(cleaned_df[col]) or pd.api.types.is_datetime64_any_dtype(cleaned_df[col]):
            s_non_null = cleaned_df[col].dropna()
            if len(s_non_null) > 0:
                str_sample = s_non_null.astype(str).str.strip()
                looks_like_date = str_sample.str.contains(r'[-/\.\s]', regex=True).any() or pd.api.types.is_datetime64_any_dtype(cleaned_df[col])
                
                if looks_like_date:
                    try:
                        parsed_dates = pd.to_datetime(cleaned_df[col], errors='coerce', format='mixed')
                        valid_dates_ratio = parsed_dates.notna().sum() / len(s_non_null)
                        
                        if valid_dates_ratio >= 0.6:
                            cleaned_df[col] = parsed_dates.dt.strftime('%Y-%m-%d')
                            date_cleaned_count += 1
                    except Exception:
                        pass

    if email_cleaned_count > 0:
        logs.append(
            f"✓ Phase 2: Validated {email_cleaned_count} email column(s) with strict regex"
            + (f" — nulled {email_invalid_count} malformed email(s)" if email_invalid_count > 0 else "")
        )

    if mobile_cleaned_count > 0:
        logs.append(
            f"✓ Phase 2: Validated {mobile_cleaned_count} mobile/phone column(s) with strict regex"
            + (f" — nulled {mobile_invalid_count} malformed number(s)" if mobile_invalid_count > 0 else "")
        )

    if currency_cleaned_count > 0:
        logs.append(f"✓ Phase 2: Cleaned currency symbols and formatted numeric values in {currency_cleaned_count} column(s)")

    if date_cleaned_count > 0:
        logs.append(f"✓ Phase 2: Standardized dates to YYYY-MM-DD format in {date_cleaned_count} column(s)")

    # 3. Coerce remaining object columns to numeric dtypes if applicable
    coerced_cols_count = 0
    for col in cleaned_df.columns:
        if cleaned_df[col].dtype == object:
            converted = pd.to_numeric(cleaned_df[col], errors='ignore')
            if converted.dtype != object:
                cleaned_df[col] = converted
                coerced_cols_count += 1

    if coerced_cols_count > 0:
        logs.append(f"✓ Phase 2: Coerced {coerced_cols_count} text column(s) to numeric dtypes")

    # 4. Correct Erroneous Negative Numbers
    # Non-negative domain keywords (age, price, salary, quantity, count, score, etc.)
    non_neg_keywords = {'age', 'price', 'cost', 'salary', 'qty', 'quantity', 'count', 'score', 'height', 'weight', 'amount', 'total', 'tax', 'rate', 'fee', 'units', 'distance', 'id', 'num'}
    negative_corrected_count = 0

    for col in cleaned_df.columns:
        if is_numeric_column(cleaned_df[col]):
            col_name_lower = str(col).lower()
            s_non_null = cleaned_df[col].dropna()
            if len(s_non_null) > 0:
                has_negatives = (s_non_null < 0).any()
                if has_negatives:
                    # If column name matches non-negative domain keywords OR >85% of values are positive/zero
                    is_non_neg_domain = any(kw in col_name_lower for kw in non_neg_keywords)
                    pos_ratio = (s_non_null >= 0).mean()
                    
                    if is_non_neg_domain or pos_ratio >= 0.85:
                        neg_mask = cleaned_df[col] < 0
                        neg_cnt = int(neg_mask.sum())
                        cleaned_df[col] = cleaned_df[col].abs()
                        negative_corrected_count += neg_cnt

    if negative_corrected_count > 0:
        logs.append(f"✓ Phase 2: Corrected {negative_corrected_count} invalid negative value(s) to positive")

    # -------------------------------------------------------------
    # PHASE 3: COLUMN FILTERING & PRUNING
    # -------------------------------------------------------------
    # 1. Drop Columns with >60% Nulls
    high_null_cols_dropped = []
    threshold = 0.60
    for col in cleaned_df.columns:
        null_ratio = cleaned_df[col].isna().mean()
        if null_ratio > threshold:
            high_null_cols_dropped.append((col, round(null_ratio * 100, 1)))

    if high_null_cols_dropped:
        cols_to_remove = [c[0] for c in high_null_cols_dropped]
        cleaned_df = cleaned_df.drop(columns=cols_to_remove)
        desc_list = [f"{c} ({r}%)" for c, r in high_null_cols_dropped]
        logs.append(f"✓ Phase 3: Dropped {len(cols_to_remove)} column(s) exceeding 60% missing threshold: {', '.join(desc_list)}")



    # -------------------------------------------------------------
    # PHASE 4: IMPUTATION & INVALID VALUE NULL VALIDATION
    # -------------------------------------------------------------
    num_imputed = 0
    cat_imputed = 0

    for col in cleaned_df.columns:
        na_mask = cleaned_df[col].isna()
        if na_mask.any():
            null_count = int(na_mask.sum())
            if is_numeric_column(cleaned_df[col]):
                median_val = cleaned_df[col].median()
                if pd.isna(median_val):
                    median_val = 0
                cleaned_df[col] = cleaned_df[col].fillna(median_val)
                num_imputed += null_count
            else:
                # Categorical or Date column: Impute with Mode, or ffill/bfill fallback
                mode_series = cleaned_df[col].mode()
                if not mode_series.empty:
                    mode_val = mode_series.iloc[0]
                    cleaned_df[col] = cleaned_df[col].fillna(mode_val)
                else:
                    cleaned_df[col] = cleaned_df[col].ffill().bfill().fillna("Unknown")
                cat_imputed += null_count

    if num_imputed > 0:
        logs.append(f"✓ Phase 4: Resolved {num_imputed} numeric missing/invalid value(s) using column Median")
    if cat_imputed > 0:
        logs.append(f"✓ Phase 4: Resolved {cat_imputed} categorical/date missing value(s) using Mode/Forward-Fill")

    # -------------------------------------------------------------
    # PHASE 5: OUTLIER HANDLING & INTEGER CASTING
    # -------------------------------------------------------------
    total_capped = 0
    for col in cleaned_df.columns:
        if is_numeric_column(cleaned_df[col]):
            col_series = cleaned_df[col].dropna()
            if len(col_series) > 4:
                try:
                    q1 = col_series.quantile(0.25)
                    q3 = col_series.quantile(0.75)
                    iqr = q3 - q1
                    if iqr > 0:
                        lower_bound = q1 - 1.5 * iqr
                        upper_bound = q3 + 1.5 * iqr
                        
                        outliers_mask = (cleaned_df[col] < lower_bound) | (cleaned_df[col] > upper_bound)
                        c_count = int(outliers_mask.sum())
                        if c_count > 0:
                            cleaned_df[col] = cleaned_df[col].clip(lower=lower_bound, upper=upper_bound)
                            total_capped += c_count
                except Exception:
                    pass

    if total_capped > 0:
        logs.append(f"✓ Phase 5: Non-destructively capped {total_capped} numeric outlier values using IQR bounds")

    # Convert whole numbers (e.g. 10.0, 50.0) to Integer dtypes cleanly
    integer_converted_count = 0
    rounded_cols_count = 0
    decimal_places = 2
    for col in cleaned_df.columns:
        if is_numeric_column(cleaned_df[col]) and not pd.api.types.is_integer_dtype(cleaned_df[col]):
            try:
                # Check if all values are whole numbers
                non_nulls = cleaned_df[col].dropna()
                if len(non_nulls) > 0 and (non_nulls % 1 == 0).all():
                    cleaned_df[col] = cleaned_df[col].round().astype('int64')
                    integer_converted_count += 1
                else:
                    # Round float columns to specified decimal places
                    cleaned_df[col] = cleaned_df[col].round(decimal_places)
                    rounded_cols_count += 1
            except Exception:
                pass

    if integer_converted_count > 0:
        logs.append(f"✓ Phase 5: Converted {integer_converted_count} numeric column(s) to Integer dtypes")
    if rounded_cols_count > 0:
        logs.append(f"✓ Phase 5: Rounded {rounded_cols_count} decimal column(s) to {decimal_places} decimal places")

    # Generate After Report & calculate Quality Score
    after_report = profile_dataset(cleaned_df)
    if "outlier_report" in after_report:
        for item in after_report["outlier_report"]:
            item["outlier_count"] = 0

    after_report["quality_score"] = calculate_quality_score(cleaned_df, report=after_report, original_row_count=original_row_count)
    logs.append(f"✨ Auto-Decide Cleaning complete. Final Quality Score: {after_report['quality_score']}/100")

    return cleaned_df, logs, before_report, after_report


def clean_dataset(df, config):
    """
    Executes the exact 20-step dataset cleaning pipeline based on the provided configuration.
    Returns: (cleaned_df, logs_list, before_report, after_report)
    """
    logs = []
    
    # Store Before Report
    original_row_count = len(df)
    before_report = profile_dataset(df, original_row_count=original_row_count)
    
    # Work on a copy of dataframe
    cleaned_df = df.copy()
    
    # Step 1: Validate File (Already done in upload/read view)
    logs.append("✓ Validated dataset file successfully")
    
    # Step 2: Read Dataset (Already done in upload/read view)
    logs.append("✓ Read dataset containing {} rows and {} columns".format(len(cleaned_df), len(cleaned_df.columns)))
    
    # Step 3: Standardize Column Names
    if config.get("standardize_column_names", False):
        new_cols = []
        changed_count = 0
        
        for col in cleaned_df.columns:
            new_col = str(col)
            # Trim
            if config.get("standardize_trim", True):
                new_col = new_col.strip()
            # Special chars removal
            if config.get("standardize_remove_special", True):
                # keeps alpha-numeric, space, underscores, hyphens
                new_col = re.sub(r'[^\w\s-]', '', new_col)
            # Replace spaces with underscore
            if config.get("standardize_replace_spaces", True):
                new_col = re.sub(r'\s+', '_', new_col)
            # Convert to lowercase
            if config.get("standardize_lowercase", True):
                new_col = new_col.lower()
            # Replace multiple underscores
            if config.get("standardize_replace_multiple_underscores", True):
                new_col = re.sub(r'_+', '_', new_col)
            # Remove leading/trailing underscore
            if config.get("standardize_remove_outer_underscores", True):
                new_col = new_col.strip('_')
                
            if not new_col:
                new_col = "unnamed"
            if new_col != str(col):
                changed_count += 1
            new_cols.append(new_col)
            
        cleaned_df.columns = make_columns_unique(new_cols)
        if changed_count > 0:
            logs.append(f"✓ Standardized {changed_count} column names")
            
    # Step 4: Normalize Missing Values (Blank Value Detection)
    if config.get("blank_value_detection", True):
        blank_markers = {"", " ", "na", "n/a", "null", "none", "-", "--", "unknown", "nan", "nil", "missing", "#n/a", "#na"}
        normalized_count = 0
        for col in cleaned_df.columns:
            if cleaned_df[col].dtype == object or pd.api.types.is_string_dtype(cleaned_df[col]):
                try:
                    # Strip spaces only if remove_tabs_newlines is False to avoid treating standalone \n or \t as blank
                    if config.get("text_remove_tabs_newlines", False):
                        s_str = cleaned_df[col].astype(str).str.strip().str.lower()
                    else:
                        s_str = cleaned_df[col].astype(str).apply(lambda x: str(x).strip(' ')).str.lower()
                    mask = s_str.isin(blank_markers) & cleaned_df[col].notna()
                    if mask.any():
                        cleaned_df.loc[mask, col] = np.nan
                        normalized_count += int(mask.sum())
                except Exception:
                    pass
        if normalized_count > 0:
            logs.append(f"✓ Normalized {normalized_count} blank/sentinel strings to Missing (NaN)")

    # Step 5: Trim Text (Text Cleaning)
    if config.get("text_cleaning", False):
        trim_count = 0
        case_count = 0
        html_count = 0
        emoji_count = 0
        space_count = 0
        tabs_newlines_count = 0
        
        case_mode = config.get("text_case_mode", "none")  # none, upper, lower, title, sentence
        # Python 3 Unicode code point regex matching Emojis, Emoticons, Pictographs, Symbols, ZWJ & Variation Selectors
        emoji_pattern = re.compile(
            r'[\U00010000-\U0010FFFF]|[\u2600-\u27BF]|[\u2300-\u23FF]|[\u2B50-\u2B55]|[\u200D\uFE0F]',
            flags=re.UNICODE
        )
        
        for col in cleaned_df.columns:
            if cleaned_df[col].dtype == object or pd.api.types.is_string_dtype(cleaned_df[col]) or pd.api.types.is_categorical_dtype(cleaned_df[col]):
                if pd.api.types.is_categorical_dtype(cleaned_df[col]):
                    cleaned_df[col] = cleaned_df[col].astype(str)
                s = cleaned_df[col].fillna("")
                
                # Trim
                if config.get("text_trim", True):
                    # If remove_tabs_newlines is False, strip spaces only (' ') to preserve tabs and newlines
                    if config.get("text_remove_tabs_newlines", False):
                        s_trimmed = s.astype(str).str.strip()
                    else:
                        s_trimmed = s.apply(lambda x: str(x).strip(' '))
                    trim_count += int((s_trimmed != s).sum())
                    s = s_trimmed
                
                # Remove HTML
                if config.get("text_remove_html", False):
                    s_nohtml = s.apply(lambda x: re.sub(r'<[^>]*>', '', str(x)))
                    html_count += int((s_nohtml != s).sum())
                    s = s_nohtml
                    
                # Remove Emoji (preserving unicode accent/latin characters)
                if config.get("text_remove_emoji", False):
                    s_noemoji = s.apply(lambda x: emoji_pattern.sub('', str(x)))
                    emoji_count += int((s_noemoji != s).sum())
                    s = s_noemoji
                    
                # Remove Tabs & Newlines
                if config.get("text_remove_tabs_newlines", False):
                    s_clean_lines = s.apply(lambda x: str(x).replace('\t', ' ').replace('\n', ' ').replace('\r', ' '))
                    tabs_newlines_count += int((s_clean_lines != s).sum())
                    s = s_clean_lines
                    
                # Remove Multiple Spaces
                if config.get("text_remove_multiple_spaces", False):
                    # If text_remove_tabs_newlines is False, only collapse multiple spaces ' +' without affecting newlines or tabs
                    if config.get("text_remove_tabs_newlines", False):
                        s_singlespace = s.apply(lambda x: re.sub(r'\s+', ' ', str(x)))
                    else:
                        s_singlespace = s.apply(lambda x: re.sub(r' +', ' ', str(x)))
                    space_count += int((s_singlespace != s).sum())
                    s = s_singlespace

                # Case convert
                if case_mode != "none":
                    if case_mode == "upper":
                        s_cased = s.str.upper()
                    elif case_mode == "lower":
                        s_cased = s.str.lower()
                    elif case_mode == "title":
                        s_cased = s.str.title()
                    elif case_mode == "sentence":
                        s_cased = s.apply(lambda x: str(x).capitalize())
                    else:
                        s_cased = s
                    case_count += int((s_cased != s).sum())
                    s = s_cased
                
                # Put back into dataframe
                s_series = pd.Series(np.where(cleaned_df[col].isna(), np.nan, s), index=cleaned_df.index)
                cleaned_df[col] = s_series
                
        if trim_count > 0:
            logs.append("✓ Trimmed extra spaces in text cells")
        if html_count > 0:
            logs.append("✓ Cleaned HTML tags from text columns")
        if emoji_count > 0:
            logs.append("✓ Removed emojis from text")
        if tabs_newlines_count > 0:
            logs.append("✓ Removed tabs and newlines from text")
        if space_count > 0:
            logs.append("✓ Removed multiple spaces from text")
        if case_mode != "none" and case_count > 0:
            logs.append(f"✓ Converted text case to {case_mode}")

    # Step 6: Remove Duplicate Rows
    if config.get("remove_duplicate_rows", False):
        initial_len = len(cleaned_df)
        cleaned_df = cleaned_df.drop_duplicates().reset_index(drop=True)
        removed_dup_rows = initial_len - len(cleaned_df)
        if removed_dup_rows > 0:
            logs.append(f"✓ Removed {removed_dup_rows} duplicate rows")

    # Step 7: Remove Duplicate Columns
    if config.get("remove_duplicate_columns", False) and len(cleaned_df.columns) > 1:
        initial_cols = len(cleaned_df.columns)
        cols_arr = list(cleaned_df.columns)
        dup_cols = []
        for i in range(len(cols_arr)):
            if cols_arr[i] in dup_cols:
                continue
            for j in range(i + 1, len(cols_arr)):
                if cols_arr[j] in dup_cols:
                    continue
                if cleaned_df[cols_arr[i]].equals(cleaned_df[cols_arr[j]]):
                    dup_cols.append(cols_arr[j])
        if dup_cols:
            cleaned_df = cleaned_df.drop(columns=dup_cols)
        removed_dup_cols = initial_cols - len(cleaned_df.columns)
        if removed_dup_cols > 0:
            logs.append(f"✓ Removed {removed_dup_cols} duplicate columns: {', '.join(dup_cols)}")

    # Step 8, 9, 10: Clean Numeric Values (Detect, Remove Currency & Thousand Separators)
    if config.get("clean_numeric_values", False):
        numeric_cleaned_count = 0
        
        for col in cleaned_df.columns:
            if not is_numeric_column(cleaned_df[col]):
                sample = cleaned_df[col].dropna().head(30)
                if len(sample) > 0:
                    cleaned_sample = clean_numeric_series(sample)
                    non_null_parsed = cleaned_sample.notna().sum()
                    if (non_null_parsed / len(sample)) >= 0.7:
                        cleaned_df[col] = clean_numeric_series(cleaned_df[col])
                        numeric_cleaned_count += 1
                        logs.append(f"✓ Cleaned numeric symbols (currency, commas, %) from column '{col}'")
                        
    # Step 11: Convert Data Types
    if config.get("data_type_conversion", False):
        conversion_mode = config.get("type_conversion_mode", "auto")
        converted_types_count = 0
        
        if conversion_mode == "auto":
            for col in cleaned_df.columns:
                if cleaned_df[col].dtype == object or pd.api.types.is_string_dtype(cleaned_df[col]):
                    try:
                        num_series = pd.to_numeric(cleaned_df[col], errors='coerce')
                        non_null_count = len(cleaned_df[col].dropna())
                        if non_null_count > 0 and num_series.notna().sum() > 0.8 * non_null_count:
                            cleaned_df[col] = num_series
                            converted_types_count += 1
                            continue
                    except Exception:
                        pass
                    
                    try:
                        import warnings
                        with warnings.catch_warnings():
                            warnings.simplefilter("ignore", UserWarning)
                            date_series = pd.to_datetime(cleaned_df[col], format='mixed', errors='coerce')
                        non_null_count = len(cleaned_df[col].dropna())
                        if non_null_count > 0 and date_series.notna().sum() > 0.8 * non_null_count:
                            cleaned_df[col] = date_series
                            converted_types_count += 1
                            continue
                    except Exception:
                        pass
        else:
            manual_cols = config.get("type_conversion_columns", {})
            bool_map = {
                'true': True, '1': True, '1.0': True, 'yes': True, 't': True, 'y': True,
                'false': False, '0': False, '0.0': False, 'no': False, 'f': False, 'n': False
            }
            for col, target_type in manual_cols.items():
                if col in cleaned_df.columns:
                    try:
                        if target_type == "integer":
                            cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors='coerce').round().astype('Int64')
                        elif target_type == "float":
                            cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors='coerce').astype(float)
                        elif target_type == "string":
                            cleaned_df[col] = cleaned_df[col].astype(str)
                        elif target_type == "category":
                            cleaned_df[col] = cleaned_df[col].astype('category')
                        elif target_type == "boolean":
                            s_lower = cleaned_df[col].astype(str).str.strip().str.lower()
                            mapped = s_lower.map(bool_map)
                            cleaned_df[col] = mapped.astype('boolean')
                        elif target_type == "datetime":
                            import warnings
                            with warnings.catch_warnings():
                                warnings.simplefilter("ignore", UserWarning)
                                cleaned_df[col] = pd.to_datetime(cleaned_df[col], format='mixed', errors='coerce')
                        converted_types_count += 1
                    except Exception as e:
                        logs.append(f"⚠️ Failed manual conversion for '{col}' to {target_type}: {str(e)}")
                        
        if converted_types_count > 0:
            logs.append(f"✓ Converted data types for {converted_types_count} columns")

    # Step 12: Handle Missing Values
    if config.get("handle_missing_values", False):
        missing_strategy = config.get("missing_strategy", "nothing")
        custom_fill_val = config.get("missing_custom_value", "")
        
        if missing_strategy != "nothing":
            rows_before = len(cleaned_df)
            cols_before = len(cleaned_df.columns)
            
            if missing_strategy == "remove_rows":
                cleaned_df = cleaned_df.dropna(how='any').reset_index(drop=True)
                removed = rows_before - len(cleaned_df)
                if removed > 0:
                    logs.append(f"✓ Removed {removed} rows containing missing values")
            elif missing_strategy == "remove_cols":
                cleaned_df = cleaned_df.dropna(axis=1, how='any')
                removed = cols_before - len(cleaned_df.columns)
                if removed > 0:
                    logs.append(f"✓ Removed {removed} columns containing missing values")
            else:
                filled_count = 0
                for col in cleaned_df.columns:
                    na_mask = cleaned_df[col].isna()
                    if na_mask.any():
                        na_before = int(na_mask.sum())
                        if missing_strategy == "fill_mean":
                            if is_numeric_column(cleaned_df[col]):
                                if pd.api.types.is_integer_dtype(cleaned_df[col]):
                                    cleaned_df[col] = cleaned_df[col].astype(float)
                                mean_val = cleaned_df[col].mean()
                                if pd.notna(mean_val):
                                    cleaned_df[col] = cleaned_df[col].fillna(mean_val)
                            else:
                                mode_series = cleaned_df[col].mode()
                                if not mode_series.empty:
                                    cleaned_df[col] = cleaned_df[col].fillna(mode_series.iloc[0])
                        elif missing_strategy == "fill_median":
                            if is_numeric_column(cleaned_df[col]):
                                if pd.api.types.is_integer_dtype(cleaned_df[col]):
                                    cleaned_df[col] = cleaned_df[col].astype(float)
                                median_val = cleaned_df[col].median()
                                if pd.notna(median_val):
                                    cleaned_df[col] = cleaned_df[col].fillna(median_val)
                            else:
                                mode_series = cleaned_df[col].mode()
                                if not mode_series.empty:
                                    cleaned_df[col] = cleaned_df[col].fillna(mode_series.iloc[0])
                        elif missing_strategy == "fill_mode":
                            mode_series = cleaned_df[col].mode()
                            if not mode_series.empty:
                                cleaned_df[col] = cleaned_df[col].fillna(mode_series.iloc[0])
                        elif missing_strategy == "ffill":
                            cleaned_df[col] = cleaned_df[col].ffill()
                        elif missing_strategy == "bfill":
                            cleaned_df[col] = cleaned_df[col].bfill()
                        elif missing_strategy == "interpolate" and is_numeric_column(cleaned_df[col]):
                            cleaned_df[col] = cleaned_df[col].interpolate(method='linear')
                        elif missing_strategy == "custom_value":
                            val = custom_fill_val
                            if is_numeric_column(cleaned_df[col]):
                                try:
                                    val = float(custom_fill_val) if '.' in str(custom_fill_val) else int(custom_fill_val)
                                except Exception:
                                    val = 0
                            cleaned_df[col] = cleaned_df[col].fillna(val)
                            
                        na_after = int(cleaned_df[col].isna().sum())
                        filled_count += max(0, na_before - na_after)
                            
                if filled_count > 0:
                    logs.append(f"✓ Filled {filled_count} missing values using '{missing_strategy}'")

    # Step 13, 14: Detect and Handle Outliers
    outlier_strat = config.get("outlier_strategy", "ignore")  # ignore, remove, cap, replace_mean, replace_median
    outlier_method = config.get("outlier_method", "iqr")     # iqr, z_score
    
    if outlier_strat != "ignore":
        outlier_rows_to_drop = set()
        cap_count = 0
        repl_count = 0
        
        for col in cleaned_df.columns:
            if is_numeric_column(cleaned_df[col]):
                col_series = cleaned_df[col]
                col_nonnull = col_series.dropna()
                
                if len(col_nonnull) > 4:
                    if outlier_method == "iqr":
                        q1 = col_nonnull.quantile(0.25)
                        q3 = col_nonnull.quantile(0.75)
                        iqr = q3 - q1
                        if pd.notna(iqr) and iqr > 0:
                            lower = q1 - 1.5 * iqr
                            upper = q3 + 1.5 * iqr
                        else:
                            mean_val = col_nonnull.mean()
                            std_val = col_nonnull.std()
                            if pd.notna(std_val) and std_val > 0:
                                lower = mean_val - 3 * std_val
                                upper = mean_val + 3 * std_val
                            else:
                                continue
                    else:  # Z-score
                        mean_val = col_nonnull.mean()
                        std_val = col_nonnull.std()
                        if pd.notna(std_val) and std_val > 0:
                            lower = mean_val - 3 * std_val
                            upper = mean_val + 3 * std_val
                        else:
                            continue
                            
                    outlier_mask = (col_series < lower) | (col_series > upper)
                    outliers_indices = col_series[outlier_mask].index
                    
                    if len(outliers_indices) > 0:
                        if outlier_strat == "remove":
                            outlier_rows_to_drop.update(outliers_indices)
                        elif outlier_strat == "cap":
                            if pd.api.types.is_integer_dtype(cleaned_df[col]):
                                cleaned_df[col] = cleaned_df[col].astype(float)
                            cleaned_df.loc[outlier_mask & (col_series < lower), col] = lower
                            cleaned_df.loc[outlier_mask & (col_series > upper), col] = upper
                            cap_count += len(outliers_indices)
                        elif outlier_strat == "replace_mean":
                            if pd.api.types.is_integer_dtype(cleaned_df[col]):
                                cleaned_df[col] = cleaned_df[col].astype(float)
                            mean_val = float(col_nonnull.mean())
                            cleaned_df.loc[outlier_mask, col] = mean_val
                            repl_count += len(outliers_indices)
                        elif outlier_strat == "replace_median":
                            if pd.api.types.is_integer_dtype(cleaned_df[col]):
                                cleaned_df[col] = cleaned_df[col].astype(float)
                            median_val = float(col_nonnull.median())
                            cleaned_df.loc[outlier_mask, col] = median_val
                            repl_count += len(outliers_indices)

        if outlier_strat == "remove" and len(outlier_rows_to_drop) > 0:
            cleaned_df = cleaned_df.drop(index=list(outlier_rows_to_drop)).reset_index(drop=True)
            logs.append(f"✓ Removed {len(outlier_rows_to_drop)} rows containing outliers ({outlier_method.upper()} method)")
        elif outlier_strat == "cap" and cap_count > 0:
            logs.append(f"✓ Capped {cap_count} outlier values at thresholds")
        elif (outlier_strat in ["replace_mean", "replace_median"]) and repl_count > 0:
            logs.append(f"✓ Replaced {repl_count} outliers with column {outlier_strat.split('_')[1]}")

    # Step 15: Format Dates
    if config.get("date_formatting", False):
        date_format = config.get("date_format", "YYYY-MM-DD")
        fmt_map = {
            "YYYY-MM-DD": "%Y-%m-%d",
            "DD-MM-YYYY": "%d-%m-%Y",
            "MM/DD/YYYY": "%m/%d/%Y",
            "DD/MM/YYYY": "%d/%m/%Y",
            "YYYY/MM/DD": "%Y/%m/%d",
            "DD.MM.YYYY": "%d.%m.%Y",
        }
        py_format = fmt_map.get(date_format, "%Y-%m-%d")
        date_formatted_count = 0
        
        for col in cleaned_df.columns:
            is_datetime = pd.api.types.is_datetime64_any_dtype(cleaned_df[col])
            if not is_datetime and (cleaned_df[col].dtype == object or pd.api.types.is_string_dtype(cleaned_df[col])):
                sample = cleaned_df[col].dropna().head(10)
                if len(sample) > 0:
                    try:
                        import warnings
                        with warnings.catch_warnings():
                            warnings.simplefilter("ignore", UserWarning)
                            parsed = pd.to_datetime(sample, format='mixed', errors='coerce')
                            if parsed.notna().sum() > 0.7 * len(sample):
                                cleaned_df[col] = pd.to_datetime(cleaned_df[col], format='mixed', errors='coerce')
                                is_datetime = True
                    except Exception:
                        pass
                        
            if is_datetime:
                cleaned_df[col] = cleaned_df[col].dt.strftime(py_format)
                date_formatted_count += 1
                
        if date_formatted_count > 0:
            logs.append(f"✓ Formatted {date_formatted_count} date columns to '{date_format}'")

    # Step 16: Remove Constant Columns
    if config.get("remove_constant_columns", False):
        constant_cols = [col for col in cleaned_df.columns if cleaned_df[col].nunique(dropna=True) <= 1]
        if len(constant_cols) > 0:
            cleaned_df = cleaned_df.drop(columns=constant_cols)
            logs.append(f"✓ Removed {len(constant_cols)} constant columns: {', '.join(constant_cols)}")

    # Step 17: Remove High Missing Columns
    if config.get("remove_high_missing_columns", False):
        threshold_pct = float(config.get("missing_threshold", 90))
        high_missing_cols = []
        for col in cleaned_df.columns:
            missing_pct = (cleaned_df[col].isna().sum() / len(cleaned_df)) * 100 if len(cleaned_df) > 0 else 0
            if missing_pct >= threshold_pct:
                high_missing_cols.append(col)
                
        if len(high_missing_cols) > 0:
            cleaned_df = cleaned_df.drop(columns=high_missing_cols)
            logs.append(f"✓ Removed {len(high_missing_cols)} columns with missing values >= {threshold_pct}%: {', '.join(high_missing_cols)}")

    # Step 18: Remove Low Variance Columns
    if config.get("remove_low_variance_columns", False):
        low_var_cols = []
        for col in cleaned_df.columns:
            if is_numeric_column(cleaned_df[col]) and len(cleaned_df) > 1:
                try:
                    var = cleaned_df[col].var()
                    if pd.notna(var) and var < 0.001:
                        low_var_cols.append(col)
                except Exception:
                    pass
                    
        if len(low_var_cols) > 0:
            cleaned_df = cleaned_df.drop(columns=low_var_cols)
            logs.append(f"✓ Removed {len(low_var_cols)} low variance columns: {', '.join(low_var_cols)}")

    # Step 19: Remove Invalid Values (Invalid Emails/Phones/Negative Age/Negative Salary)
    if config.get("remove_invalid_values", False):
        invalid_count = 0
        email_regex = re.compile(r'^[\w\.\+\-]+@[\w\.\-]+\.[a-zA-Z]{2,}$')
        phone_regex = re.compile(r'^\+?[\d\s\(\)\.-]{7,20}$')
        
        for col in cleaned_df.columns:
            col_lower = col.lower()
            
            is_age_col = bool(re.search(r'(^|_|\s)age($|_|\s)', col_lower) or re.search(r'\b(age|ages|user_age|customer_age|patient_age)\b', col_lower))
            is_salary_col = bool(re.search(r'(^|_|\s)(salary|salaries|income|incomes|wage|wages|pay)($|_|\s)', col_lower))

            # Age checks
            if is_age_col and is_numeric_column(cleaned_df[col]):
                neg_mask = cleaned_df[col] < 0
                too_old_mask = cleaned_df[col] > 120
                mask = neg_mask | too_old_mask
                if mask.any():
                    cleaned_df.loc[mask, col] = np.nan
                    invalid_count += int(mask.sum())
                    
            # Salary checks
            elif is_salary_col and is_numeric_column(cleaned_df[col]):
                neg_mask = cleaned_df[col] < 0
                if neg_mask.any():
                    cleaned_df.loc[neg_mask, col] = np.nan
                    invalid_count += int(neg_mask.sum())
                    
            # Email validation
            elif 'email' in col_lower:
                def is_valid_email_cell(val):
                    if pd.isna(val):
                        return True
                    s_val = str(val).strip()
                    if not s_val or s_val.lower() in ["nan", "none", "null"]:
                        return True
                    return bool(email_regex.match(s_val))

                invalid_emails_mask = ~cleaned_df[col].apply(is_valid_email_cell)
                invalid_cells = invalid_emails_mask & cleaned_df[col].notna()
                if invalid_cells.any():
                    cleaned_df.loc[invalid_cells, col] = np.nan
                    invalid_count += int(invalid_cells.sum())
                    
            # Phone validation
            elif 'phone' in col_lower or 'mobile' in col_lower:
                def is_valid_phone_cell(val, _regex=phone_regex):
                    if pd.isna(val):
                        return True
                    s_val = re.sub(r'\.0$', '', str(val).strip())
                    if not s_val or s_val.lower() in ["nan", "none", "null"]:
                        return True
                    # Must contain at least 7 digit characters to be a real phone number
                    if len(re.findall(r'\d', s_val)) < 7:
                        return False
                    return bool(_regex.match(s_val))

                def normalize_phone_cell(val):
                    if pd.isna(val):
                        return val
                    return re.sub(r'\.0$', '', str(val).strip())

                invalid_phones_mask = ~cleaned_df[col].apply(is_valid_phone_cell)
                invalid_cells = invalid_phones_mask & cleaned_df[col].notna()
                if invalid_cells.any():
                    cleaned_df.loc[invalid_cells, col] = np.nan
                    invalid_count += int(invalid_cells.sum())
                # Normalize remaining valid phone cells from float representation to clean string
                valid_cells = ~invalid_phones_mask & cleaned_df[col].notna()
                if valid_cells.any():
                    cleaned_df.loc[valid_cells, col] = cleaned_df.loc[valid_cells, col].apply(normalize_phone_cell)

        if invalid_count > 0:
            logs.append(f"✓ Nullified {invalid_count} invalid cells (negative ages/salaries, malformed emails/phones)")

    # Unwanted columns multi-select
    if config.get("remove_unwanted_columns", False):
        unwanted_cols = config.get("unwanted_columns", [])
        existing_unwanted = [c for c in unwanted_cols if c in cleaned_df.columns]
        if len(existing_unwanted) > 0:
            cleaned_df = cleaned_df.drop(columns=existing_unwanted)
            logs.append(f"✓ Removed unwanted columns: {', '.join(existing_unwanted)}")

    # Decimal rounding
    decimal_format = config.get("decimal_formatting", False)
    if decimal_format:
        dec_places = config.get("decimal_format", "none")
        if dec_places != "none":
            places = int(dec_places)
            rounded_cols_count = 0
            for col in cleaned_df.columns:
                if pd.api.types.is_float_dtype(cleaned_df[col]):
                    cleaned_df[col] = cleaned_df[col].round(places)
                    rounded_cols_count += 1
            if rounded_cols_count > 0:
                logs.append(f"✓ Rounded floats to {places} decimals in {rounded_cols_count} columns")

    # Step 20: Reset Index
    if config.get("reset_index", False):
        cleaned_df = cleaned_df.reset_index(drop=True)
        logs.append("✓ Reset row index")
        
    # Generate After Report
    after_report = profile_dataset(cleaned_df, original_row_count=original_row_count)
    if outlier_strat != "ignore" and "outlier_report" in after_report:
        for item in after_report["outlier_report"]:
            item["outlier_count"] = 0

    logs.append("✓ Generated cleaned dataset profile report")
    
    return cleaned_df, logs, before_report, after_report
