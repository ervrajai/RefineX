import os
import io
import pandas as pd
import numpy as np
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.core.files.base import ContentFile
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from apps.accounts.views import CsrfExemptSessionAuthentication

from .models import Dataset, CleaningJob
from .utils import profile_dataset, clean_dataset, make_json_safe, read_dataframe
from apps.core.services import ActivityService


@method_decorator(csrf_exempt, name='dispatch')
class DatasetUploadView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        # Basic validation
        name, ext = os.path.splitext(file_obj.name)
        file_type = ext.lower().replace('.', '')
        if file_type not in ['csv', 'xlsx', 'xls']:
            return Response({"error": "Unsupported file format. Please upload CSV or Excel files."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Create a temporary file to parse and count dimensions
            temp_content = file_obj.read()
            file_obj.seek(0)
            
            # Read into DataFrame to compute stats and confirm it is not corrupted
            # Create a temp buffer to read
            buffer = io.BytesIO(temp_content)
            if file_type == 'csv':
                # Try UTF-8 first
                try:
                    df = pd.read_csv(io.BytesIO(temp_content), encoding='utf-8', nrows=100)
                    detected_encoding = 'utf-8'
                except UnicodeDecodeError:
                    try:
                        df = pd.read_csv(io.BytesIO(temp_content), encoding='latin-1', nrows=100)
                        detected_encoding = 'latin-1'
                    except Exception:
                        detected_encoding = 'utf-8'
                        
                # Read full file to count rows/cols safely
                df_full = pd.read_csv(io.BytesIO(temp_content), encoding=detected_encoding)
            else:
                detected_encoding = 'UTF-8'
                df_full = pd.read_excel(io.BytesIO(temp_content))

            # Basic dimensions
            rows_count = len(df_full)
            cols_count = len(df_full.columns)
            
            if rows_count == 0:
                return Response({"error": "The uploaded dataset is empty."}, status=status.HTTP_400_BAD_REQUEST)

            # Save dataset model
            dataset = Dataset.objects.create(
                user=request.user if request.user.is_authenticated else None,
                name=file_obj.name,
                original_filename=file_obj.name,
                original_file=file_obj,
                file_type=file_type,
                file_size=len(temp_content),
                rows_count=rows_count,
                cols_count=cols_count,
                encoding=detected_encoding,
                status="uploaded"
            )

            ActivityService.log_activity(
                user=request.user,
                action_type="upload_csv",
                title=f"Uploaded {dataset.name}",
                description=f"Uploaded CSV dataset with {rows_count} rows and {cols_count} columns.",
                metadata={"dataset_id": dataset.id, "rows": rows_count, "cols": cols_count},
                request=request
            )

            # Profile report
            report = profile_dataset(df_full)
            
            # Initial Preview (first 100 rows)
            preview_df = df_full.head(100).replace({np.nan: None})
            preview_data = {
                "columns": list(df_full.columns),
                "rows": make_json_safe(preview_df.to_dict(orient='records'))
            }

            return Response({
                "message": "Dataset uploaded successfully",
                "dataset_id": dataset.id,
                "metadata": {
                    "name": dataset.name,
                    "file_type": dataset.file_type,
                    "file_size": dataset.file_size,
                    "rows": dataset.rows_count,
                    "columns": dataset.cols_count,
                    "encoding": dataset.encoding,
                    "created_at": dataset.created_at,
                    "status": dataset.status
                },
                "report": report,
                "preview": preview_data
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": f"Failed to parse dataset: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class DatasetAnalyzeView(APIView):
    def get(self, request, pk, *args, **kwargs):
        dataset = get_object_or_404(Dataset, pk=pk)
        
        # Read the file
        file_path = dataset.cleaned_file.path if dataset.cleaned_file else dataset.original_file.path
        file_type = dataset.file_type
        
        try:
            df, _ = read_dataframe(file_path, file_type, encoding=dataset.encoding)
            report = profile_dataset(df)
            
            preview_df = df.head(100).replace({np.nan: None})
            preview_data = {
                "columns": list(df.columns),
                "rows": make_json_safe(preview_df.to_dict(orient='records'))
            }
            
            return Response({
                "dataset_id": dataset.id,
                "metadata": {
                    "name": dataset.name,
                    "file_type": dataset.file_type,
                    "file_size": dataset.file_size,
                    "rows": len(df),
                    "columns": len(df.columns),
                    "encoding": dataset.encoding,
                    "status": dataset.status
                },
                "report": report,
                "preview": preview_data
            })
        except Exception as e:
            return Response({"error": f"Failed to analyze dataset: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


def perform_cleaning_operation(dataset, config, user=None):
    """
    Helper function that executes the cleaning pipeline and updates the Dataset model and CleaningJob.
    """
    df, _ = read_dataframe(dataset.original_file.path, dataset.file_type, encoding=dataset.encoding)
    cleaned_df, logs, before_report, after_report = clean_dataset(df, config)
    
    cleaned_name = f"cleaned_{dataset.id}_{os.path.basename(dataset.original_file.name)}"
    if not cleaned_name.endswith(f".{dataset.file_type}"):
        cleaned_name += f".{dataset.file_type}"
        
    out_buffer = io.BytesIO()
    if dataset.file_type == 'csv':
        cleaned_df.to_csv(out_buffer, index=False, encoding=dataset.encoding)
    else:
        cleaned_df.to_excel(out_buffer, index=False)
    
    dataset.cleaned_file.save(cleaned_name, ContentFile(out_buffer.getvalue()), save=False)
    dataset.status = "cleaned"
    dataset.rows_count = len(cleaned_df)
    dataset.cols_count = len(cleaned_df.columns)
    dataset.save()
    
    rows_removed = max(0, len(df) - len(cleaned_df))
    cols_removed = max(0, len(df.columns) - len(cleaned_df.columns))
    missing_before = before_report.get("overview", {}).get("total_missing", 0)
    missing_after = after_report.get("overview", {}).get("total_missing", 0)
    missing_filled = max(0, missing_before - missing_after)

    job = CleaningJob.objects.create(
        user=user if user and user.is_authenticated else None,
        dataset=dataset,
        cleaning_config=config,
        before_stats=before_report,
        after_stats=after_report,
        logs=logs,
        rows_removed=rows_removed,
        cols_removed=cols_removed,
        missing_filled=missing_filled
    )
    
    ActivityService.log_activity(
        user=user,
        action_type="clean_csv",
        title=f"Cleaned {dataset.name}",
        description=f"Cleaned dataset: removed {rows_removed} rows, {cols_removed} columns, filled {missing_filled} missing values.",
        metadata={"dataset_id": dataset.id, "job_id": job.id, "rows_removed": rows_removed, "cols_removed": cols_removed}
    )

    preview_df = cleaned_df.head(100).replace({np.nan: None})
    preview_data = {
        "columns": list(cleaned_df.columns),
        "rows": make_json_safe(preview_df.to_dict(orient='records'))
    }
    
    return {
        "message": "Dataset cleaned successfully",
        "dataset_id": dataset.id,
        "metadata": {
            "name": dataset.name,
            "file_type": dataset.file_type,
            "file_size": dataset.cleaned_file.size,
            "rows": dataset.rows_count,
            "columns": dataset.cols_count,
            "encoding": dataset.encoding,
            "status": dataset.status
        },
        "job_id": job.id,
        "before_report": before_report,
        "after_report": after_report,
        "logs": logs,
        "preview": preview_data
    }



@method_decorator(csrf_exempt, name='dispatch')
class DatasetCleanView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request, pk, *args, **kwargs):
        dataset = get_object_or_404(Dataset, pk=pk)
        config = request.data.get("config", {})
        try:
            res_data = perform_cleaning_operation(dataset, config, user=request.user)
            return Response(res_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Failed to clean dataset: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class DatasetDecideView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request, pk, *args, **kwargs):
        dataset = get_object_or_404(Dataset, pk=pk)
        
        config = {
            "standardize_column_names": True,
            "standardize_trim": True,
            "standardize_replace_spaces": True,
            "standardize_lowercase": True,
            "standardize_remove_special": True,
            "standardize_replace_multiple_underscores": True,
            "standardize_remove_outer_underscores": True,
            "blank_value_detection": True,
            "text_cleaning": True,
            "text_trim": True,
            "text_remove_multiple_spaces": True,
            "text_remove_html": True,
            "text_remove_emoji": True,
            "text_remove_tabs_newlines": True,
            "text_case_mode": "none",
            "remove_duplicate_rows": True,
            "remove_duplicate_columns": True,
            "clean_numeric_values": True,
            "data_type_conversion": True,
            "type_conversion_mode": "auto",
            "date_formatting": True,
            "date_format": "YYYY-MM-DD",
            "remove_constant_columns": True,
            "remove_high_missing_columns": True,
            "missing_threshold": 90,
            "decimal_formatting": True,
            "decimal_format": "2",
            "reset_index": True,
            "handle_missing_values": True,
            "missing_strategy": "fill_median",
            "remove_invalid_values": True,
            "remove_low_variance_columns": True
        }
        
        try:
            res_data = perform_cleaning_operation(dataset, config, user=request.user)
            return Response(res_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Failed to clean dataset: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class DatasetResetView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request, pk, *args, **kwargs):
        dataset = get_object_or_404(Dataset, pk=pk)
        
        if dataset.cleaned_file:
            # Delete cleaned file on disk
            if os.path.exists(dataset.cleaned_file.path):
                try:
                    os.remove(dataset.cleaned_file.path)
                except:
                    pass
            dataset.cleaned_file = None
            
        dataset.status = "uploaded"
        
        # Reset count metadata back to original file stats
        try:
            df, _ = read_dataframe(dataset.original_file.path, dataset.file_type, encoding=dataset.encoding)
            dataset.rows_count = len(df)
            dataset.cols_count = len(df.columns)
            dataset.save()
            
            report = profile_dataset(df)
            preview_df = df.head(100).replace({np.nan: None})
            preview_data = {
                "columns": list(df.columns),
                "rows": make_json_safe(preview_df.to_dict(orient='records'))
            }
            
            return Response({
                "message": "Dataset reset to original state successfully",
                "dataset_id": dataset.id,
                "metadata": {
                    "name": dataset.name,
                    "file_type": dataset.file_type,
                    "file_size": dataset.original_file.size,
                    "rows": dataset.rows_count,
                    "columns": dataset.cols_count,
                    "encoding": dataset.encoding,
                    "status": dataset.status
                },
                "report": report,
                "preview": preview_data
            })
        except Exception as e:
            dataset.save()
            return Response({"error": f"Failed to reset dataset: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class DatasetDownloadView(APIView):
    def get(self, request, pk, *args, **kwargs):
        dataset = get_object_or_404(Dataset, pk=pk)
        download_type = request.query_params.get("type", "csv")  # csv, excel, report, log
        
        # Increment download counter and log user activity
        dataset.download_count += 1
        dataset.save(update_fields=["download_count"])

        ActivityService.log_activity(
            user=request.user,
            action_type="download_csv",
            title=f"Downloaded {dataset.name}",
            description=f"Downloaded {download_type.upper()} export for dataset {dataset.name}.",
            metadata={"dataset_id": dataset.id, "download_type": download_type},
            request=request
        )

        # Determine path
        file_path = dataset.cleaned_file.path if dataset.cleaned_file else dataset.original_file.path
        if not os.path.exists(file_path):
            return Response({"error": "Dataset file not found on disk"}, status=status.HTTP_404_NOT_FOUND)
            
        if download_type == "csv":
            # Serve CSV
            try:
                df, _ = read_dataframe(file_path, dataset.file_type, encoding=dataset.encoding)
                response = HttpResponse(content_type='text/csv')
                filename = f"cleaned_{dataset.name}" if dataset.cleaned_file else dataset.name
                if not filename.endswith('.csv'):
                    filename = os.path.splitext(filename)[0] + '.csv'
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                df.to_csv(path_or_buf=response, index=False, encoding=dataset.encoding)
                return response
            except Exception as e:
                return Response({"error": f"Failed to export CSV: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
                
        elif download_type == "excel":
            # Serve Excel
            try:
                df, _ = read_dataframe(file_path, dataset.file_type, encoding=dataset.encoding)
                response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                filename = f"cleaned_{dataset.name}" if dataset.cleaned_file else dataset.name
                filename = os.path.splitext(filename)[0] + '.xlsx'
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                
                # Write to response using Pandas excel engine
                df.to_excel(response, index=False, engine='openpyxl')
                return response
            except Exception as e:
                return Response({"error": f"Failed to export Excel: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
                
        elif download_type == "log":
            # Fetch latest cleaning job logs
            latest_job = CleaningJob.objects.filter(dataset=dataset).order_by('-created_at').first()
            log_content = ""
            if latest_job and latest_job.logs:
                log_content = "\n".join(latest_job.logs)
            else:
                log_content = "No cleaning logs found. This dataset has not been cleaned yet."
                
            response = HttpResponse(log_content, content_type='text/plain')
            response['Content-Disposition'] = f'attachment; filename="cleaning_log_{dataset.id}.txt"'
            return response
            
        elif download_type == "report":
            latest_job = CleaningJob.objects.filter(dataset=dataset).order_by('-created_at').first()
            try:
                response = HttpResponse(content_type='application/pdf')
                filename = f"cleaning_report_{dataset.id}.pdf"
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                
                from .reports import generate_pdf_report
                generate_pdf_report(response, dataset, latest_job)
                return response
            except Exception as e:
                return Response({"error": f"Failed to generate PDF report: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
            
        else:
            return Response({"error": "Invalid download type"}, status=status.HTTP_400_BAD_REQUEST)


class DatasetPreviewView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]

    def get(self, request, pk, *args, **kwargs):
        dataset = get_object_or_404(Dataset, pk=pk)
        offset = int(request.query_params.get("offset", 0))
        limit = int(request.query_params.get("limit", 100))
        
        try:
            file_path = dataset.cleaned_file.path if dataset.cleaned_file else dataset.original_file.path
            if not os.path.exists(file_path):
                return Response({"error": "Dataset file not found"}, status=status.HTTP_404_NOT_FOUND)
                
            df, _ = read_dataframe(file_path, dataset.file_type, encoding=dataset.encoding)
            sliced_df = df.iloc[offset:offset+limit].replace({np.nan: None})
            
            return Response({
                "metadata": {
                    "id": dataset.id,
                    "name": dataset.name,
                    "file_type": dataset.file_type,
                    "file_size": dataset.file_size,
                    "rows": dataset.rows_count or len(df),
                    "columns": dataset.cols_count or len(df.columns),
                    "encoding": dataset.encoding,
                    "status": dataset.status
                },
                "columns": list(df.columns),
                "rows": make_json_safe(sliced_df.to_dict(orient='records')),
                "total_rows": len(df)
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Failed to retrieve preview: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
