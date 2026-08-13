import os
import io
import re
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
from datetime import timedelta
from django.utils import timezone
from apps.accounts.views import CsrfExemptSessionAuthentication

from .models import Dataset, CleaningJob, GuestUsage
from .utils import profile_dataset, clean_dataset, auto_clean_dataset, make_json_safe, read_dataframe, read_dataframe_from_bytes
from apps.core.services import ActivityService


def get_versioned_filename(dataset, extension="csv"):
    """
    Generates a clean versioned filename if same or multiple cleanings exist.
    Example: 'sales_cleaned_v1.csv', 'sales_cleaned_v2.xlsx'.
    """
    clean_base = os.path.splitext(dataset.name)[0]
    clean_base = re.sub(r'^(cleaned_|_cleaned)', '', clean_base, flags=re.IGNORECASE)
    clean_base = re.sub(r'_cleaned_v\d+$', '', clean_base, flags=re.IGNORECASE)
    
    # Calculate version based on existing cleaning jobs count
    job_count = CleaningJob.objects.filter(dataset=dataset).count()
    version = max(1, job_count)
    return f"{clean_base}_cleaned_v{version}.{extension}"



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
            # Ensure seek pointer is at start before reading content
            file_obj.seek(0)
            temp_content = file_obj.read()
            file_obj.seek(0)

            try:
                df_full, detected_encoding = read_dataframe_from_bytes(temp_content, file_type)
            except ValueError as ve:
                return Response({"error": str(ve)}, status=status.HTTP_400_BAD_REQUEST)

            # Basic dimensions
            rows_count = len(df_full)
            cols_count = len(df_full.columns)
            
            if rows_count == 0:
                return Response({"error": "The uploaded dataset is empty."}, status=status.HTTP_400_BAD_REQUEST)

            guest_id = request.data.get('guest_id') or request.headers.get('X-Guest-ID') or request.query_params.get('guest_id')

            if not request.user or not request.user.is_authenticated:
                purge_expired_guest_data()
                allowed, err_resp = check_guest_usage_limit(request)
                if not allowed:
                    resp_data = err_resp.copy() if isinstance(err_resp, dict) else {"error": str(err_resp)}
                    if "message" in resp_data and "error" not in resp_data:
                        resp_data["error"] = resp_data["message"]
                    return Response(resp_data, status=status.HTTP_403_FORBIDDEN)

            # Save dataset model
            dataset = Dataset.objects.create(
                user=request.user if request.user.is_authenticated else None,
                guest_id=guest_id,
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

            return Response(make_json_safe({
                "message": "Dataset uploaded successfully",
                "dataset_id": dataset.id,
                "metadata": {
                    "name": dataset.name,
                    "file_type": dataset.file_type,
                    "file_size": dataset.file_size,
                    "rows": dataset.rows_count,
                    "columns": dataset.cols_count,
                    "encoding": dataset.encoding,
                    "created_at": dataset.created_at.isoformat() if dataset.created_at else None,
                    "status": dataset.status
                },
                "report": report,
                "preview": preview_data
            }), status=status.HTTP_201_CREATED)


        except Exception as e:
            # Clean up disk file and DB record if upload or profiling failed
            if 'dataset' in locals() and dataset and dataset.pk:
                try:
                    if dataset.original_file:
                        dataset.original_file.delete(save=False)
                    if dataset.cleaned_file:
                        dataset.cleaned_file.delete(save=False)
                    dataset.delete()
                except Exception:
                    pass

            return Response({"error": f"Failed to parse dataset: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class DatasetAnalyzeView(APIView):
    def get(self, request, pk, *args, **kwargs):
        dataset = get_object_or_404(Dataset, pk=pk)
        
        # Read the file (Check if cleaned_file is parquet for millisecond load)
        file_path = dataset.cleaned_file.path if dataset.cleaned_file else dataset.original_file.path
        file_type = "parquet" if (dataset.cleaned_file and dataset.cleaned_file.name.endswith(".parquet")) else dataset.file_type
        
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
    Strictly branches: Auto-Decide mode (auto_clean_dataset) vs Manual mode (clean_dataset).
    Always cleans from dataset.original_file to ensure idempotency and prevent config drift.
    Stores cleaned binary artifact as fast .parquet format with safe CSV fallback.
    """
    input_file_path = dataset.original_file.path
    input_file_type = dataset.file_type

    # Delete existing physical cleaned file if present before saving new output
    if dataset.cleaned_file and os.path.exists(dataset.cleaned_file.path):
        try:
            os.remove(dataset.cleaned_file.path)
        except Exception:
            pass

    df, _ = read_dataframe(input_file_path, input_file_type, encoding=dataset.encoding)

    if config.get("is_auto_decide", False):
        cleaned_df, logs, before_report, after_report = auto_clean_dataset(df)
    else:
        cleaned_df, logs, before_report, after_report = clean_dataset(df, config)
    
    out_buffer = io.BytesIO()
    version = CleaningJob.objects.filter(dataset=dataset).count() + 1
    clean_base = os.path.splitext(dataset.name)[0]
    clean_base = re.sub(r'^(cleaned_|_cleaned)', '', clean_base, flags=re.IGNORECASE)
    clean_base = re.sub(r'_cleaned_v\d+$', '', clean_base, flags=re.IGNORECASE)
    
    cleaned_name = f"{clean_base}_cleaned_v{version}.parquet"
    
    # Ensure column headers are all string type for PyArrow Parquet engine
    cleaned_df.columns = [str(col) for col in cleaned_df.columns]

    try:
        cleaned_df.to_parquet(out_buffer, index=False)
    except Exception:
        try:
            temp_df = cleaned_df.copy()
            for col in temp_df.select_dtypes(include=['object']).columns:
                temp_df[col] = temp_df[col].astype(str)
            out_buffer = io.BytesIO()
            temp_df.to_parquet(out_buffer, index=False)
        except Exception:
            out_buffer = io.BytesIO()
            cleaned_name = f"{clean_base}_cleaned_v{version}.csv"
            cleaned_df.to_csv(out_buffer, index=False, encoding=dataset.encoding)
        
    dataset.cleaned_file.save(cleaned_name, ContentFile(out_buffer.getvalue()), save=False)
    dataset.status = "cleaned"
    dataset.rows_count = len(cleaned_df)
    dataset.cols_count = len(cleaned_df.columns)
    dataset.save()
    
    rows_removed = max(0, len(df) - len(cleaned_df))
    cols_removed = max(0, len(df.columns) - len(cleaned_df.columns))
    missing_before = before_report.get("missing_summary", {}).get("total_missing", 0)
    missing_after = after_report.get("missing_summary", {}).get("total_missing", 0)
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
    
    return make_json_safe({
        "message": "Dataset cleaned successfully",
        "dataset_id": dataset.id,
        "metadata": {
            "name": dataset.name,
            "file_type": dataset.file_type,
            "file_size": dataset.cleaned_file.size if dataset.cleaned_file else dataset.file_size,
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
    })




def purge_expired_guest_data():
    """
    Purges guest datasets (where user is null) that are older than 24 hours.
    Deletes original and cleaned physical files from disk and deletes DB records.
    """
    cutoff = timezone.now() - timedelta(hours=24)
    expired_datasets = Dataset.objects.filter(user__isnull=True, created_at__lt=cutoff)
    for ds in expired_datasets:
        if ds.original_file:
            try:
                if os.path.isfile(ds.original_file.path):
                    os.remove(ds.original_file.path)
            except Exception:
                pass
        if ds.cleaned_file:
            try:
                if os.path.isfile(ds.cleaned_file.path):
                    os.remove(ds.cleaned_file.path)
            except Exception:
                pass
        ds.delete()


def check_guest_usage_limit(request, dataset=None):
    """
    Checks if guest (by guest_id or IP address) has reached 3 cleans today without incrementing.
    """
    if (request.user and request.user.is_authenticated) or (dataset and dataset.user is not None):
        return True, None

    guest_id = request.data.get("guest_id") or request.headers.get("X-Guest-ID") or (dataset.guest_id if dataset else None)
    ip_address = get_client_ip(request)
    today = timezone.now().date()

    if not guest_id:
        guest_id = f"ip_{ip_address}"

    usage = GuestUsage.objects.filter(guest_id=guest_id).first()
    clean_count = 0
    if usage and usage.last_clean_date == today:
        clean_count = usage.clean_count

    ip_usages = GuestUsage.objects.filter(ip_address=ip_address, last_clean_date=today)
    max_ip_count = max([u.clean_count for u in ip_usages], default=0)
    effective_count = max(clean_count, max_ip_count)

    if effective_count >= 3:
        return False, {
            "limit_reached": True,
            "message": "Daily guest limit reached. Maximum 3 dataset cleans allowed per 24 hours."
        }
    return True, None


@method_decorator(csrf_exempt, name='dispatch')
def check_and_increment_guest_usage(request, dataset=None):
    # If user is authenticated OR dataset belongs to a registered user, bypass limit checks
    if (request.user and request.user.is_authenticated) or (dataset and dataset.user is not None):
        return True, None

    guest_id = request.data.get("guest_id") or request.headers.get("X-Guest-ID") or (dataset.guest_id if dataset else None)
    ip_address = get_client_ip(request)
    today = timezone.now().date()

    if not guest_id:
        guest_id = f"ip_{ip_address}"

    usage, _ = GuestUsage.objects.get_or_create(
        guest_id=guest_id,
        defaults={"ip_address": ip_address, "clean_count": 0}
    )
    if usage.last_clean_date != today:
        usage.clean_count = 0
        usage.last_clean_date = today
        usage.ip_address = ip_address
        usage.save()

    ip_usages = GuestUsage.objects.filter(ip_address=ip_address, last_clean_date=today)
    max_ip_count = max([u.clean_count for u in ip_usages], default=0)
    effective_count = max(usage.clean_count, max_ip_count)

    if effective_count >= 3:
        return False, {
            "limit_reached": True,
            "message": "Daily guest limit reached. Maximum 3 dataset cleans allowed per 24 hours."
        }

    new_count = effective_count + 1
    for u in ip_usages:
        u.clean_count = new_count
        u.save(update_fields=["clean_count"])

    usage.clean_count = new_count
    usage.save(update_fields=["clean_count"])
    return True, None



@method_decorator(csrf_exempt, name='dispatch')
class DatasetCleanView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request, pk, *args, **kwargs):
        dataset = get_object_or_404(Dataset, pk=pk)
        allowed, err_resp = check_and_increment_guest_usage(request, dataset)
        if not allowed:
            return Response(err_resp, status=status.HTTP_403_FORBIDDEN)

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
        allowed, err_resp = check_and_increment_guest_usage(request, dataset)
        if not allowed:
            return Response(err_resp, status=status.HTTP_403_FORBIDDEN)
        
        config = {
            "is_auto_decide": True
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

        # Determine path and type
        file_path = dataset.cleaned_file.path if dataset.cleaned_file else dataset.original_file.path
        file_type = "parquet" if (dataset.cleaned_file and dataset.cleaned_file.name.endswith(".parquet")) else dataset.file_type
        
        if not os.path.exists(file_path):
            return Response({"error": "Dataset file not found on disk"}, status=status.HTTP_404_NOT_FOUND)
            
        if download_type == "csv":
            # Serve CSV export with versioned filename
            try:
                df, _ = read_dataframe(file_path, file_type, encoding=dataset.encoding)
                response = HttpResponse(content_type='text/csv')
                filename = get_versioned_filename(dataset, "csv")
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                df.to_csv(path_or_buf=response, index=False, encoding=dataset.encoding)
                return response
            except Exception as e:
                return Response({"error": f"Failed to export CSV: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
                
        elif download_type == "excel":
            # Serve Excel export with versioned filename
            try:
                df, _ = read_dataframe(file_path, file_type, encoding=dataset.encoding)
                
                # Convert timezone-aware datetimes to tz-naive for openpyxl compatibility
                for col in df.columns:
                    if pd.api.types.is_datetime64_any_dtype(df[col]):
                        try:
                            if hasattr(df[col].dt, 'tz') and df[col].dt.tz is not None:
                                df[col] = df[col].dt.tz_localize(None)
                        except Exception:
                            df[col] = df[col].astype(str)

                response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                filename = get_versioned_filename(dataset, "xlsx")
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
            file_type = "parquet" if (dataset.cleaned_file and dataset.cleaned_file.name.endswith(".parquet")) else dataset.file_type
            if not os.path.exists(file_path):
                return Response({"error": "Dataset file not found"}, status=status.HTTP_404_NOT_FOUND)
                
            df, _ = read_dataframe(file_path, file_type, encoding=dataset.encoding)
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


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
    return ip


@method_decorator(csrf_exempt, name='dispatch')
class GuestSessionView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]

    def get(self, request, *args, **kwargs):
        purge_expired_guest_data()
        guest_id = request.query_params.get("guest_id") or request.headers.get("X-Guest-ID")
        
        # 1. If user is authenticated, bypass limit completely and auto-migrate
        if request.user and request.user.is_authenticated:
            if guest_id:
                Dataset.objects.filter(guest_id=guest_id, user__isnull=True).update(user=request.user)
                CleaningJob.objects.filter(dataset__guest_id=guest_id, user__isnull=True).update(user=request.user)
            return Response({
                "guest_id": None,
                "clean_count": 0,
                "remaining_cleans": 999,
                "limit_reached": False,
                "datasets": []
            }, status=status.HTTP_200_OK)

        ip_address = get_client_ip(request)
        today = timezone.now().date()

        clean_count = 0
        ip_usages = GuestUsage.objects.filter(ip_address=ip_address, last_clean_date=today)
        max_ip_count = max([u.clean_count for u in ip_usages], default=0)

        if guest_id:
            usage = GuestUsage.objects.filter(guest_id=guest_id).first()
            if usage:
                if usage.last_clean_date != today:
                    usage.clean_count = 0
                    usage.last_clean_date = today
                    usage.save(update_fields=["clean_count", "last_clean_date"])
                clean_count = usage.clean_count

        clean_count = max(clean_count, max_ip_count)

        datasets_data = []
        if guest_id:
            cutoff = timezone.now() - timedelta(hours=24)
            guest_datasets = Dataset.objects.filter(
                guest_id=guest_id,
                user__isnull=True,
                created_at__gte=cutoff,
                is_deleted=False
            ).order_by("-created_at")

            for ds in guest_datasets:
                latest_job = CleaningJob.objects.filter(dataset=ds, is_deleted=False).order_by("-created_at").first()
                logs = latest_job.logs if latest_job else []
                datasets_data.append({
                    "id": ds.id,
                    "uuid": str(ds.uuid),
                    "name": ds.name,
                    "original_filename": ds.original_filename or ds.name,
                    "file_type": ds.file_type,
                    "file_size": ds.file_size,
                    "rows": ds.rows_count,
                    "columns": ds.cols_count,
                    "status": ds.status,
                    "created_at": ds.created_at.isoformat(),
                    "logs": logs,
                    "download_url": f"/api/cleaning/{ds.id}/download/?type=csv"
                })

        return Response({
            "guest_id": guest_id,
            "clean_count": clean_count,
            "remaining_cleans": max(0, 3 - clean_count),
            "limit_reached": clean_count >= 3,
            "datasets": datasets_data
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class GuestUploadAndCleanView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        # 1. Check Authentication First
        if request.user and request.user.is_authenticated:
            user = request.user
            guest_id = None
        else:
            user = None
            guest_id = request.data.get("guest_id") or request.headers.get("X-Guest-ID") or request.query_params.get("guest_id")
            if not guest_id:
                return Response({"error": "guest_id is required for unauthenticated sessions."}, status=status.HTTP_400_BAD_REQUEST)

            ip_address = get_client_ip(request)
            today = timezone.now().date()

            usage, _ = GuestUsage.objects.get_or_create(
                guest_id=guest_id,
                defaults={"ip_address": ip_address, "clean_count": 0}
            )
            if usage.last_clean_date != today:
                usage.clean_count = 0
                usage.last_clean_date = today
                usage.ip_address = ip_address
                usage.save()

            ip_usage = GuestUsage.objects.filter(ip_address=ip_address, last_clean_date=today).first()
            effective_count = usage.clean_count
            if ip_usage and ip_usage.clean_count > effective_count:
                effective_count = ip_usage.clean_count

            if effective_count >= 3:
                return Response(
                    {
                        "limit_reached": True,
                        "message": "Daily guest limit reached. Please log in or sign up to continue."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        name, ext = os.path.splitext(file_obj.name)
        file_type = ext.lower().replace(".", "")
        if file_type not in ["csv", "xlsx", "xls"]:
            return Response({"error": "Unsupported file format. Please upload CSV or Excel files."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            file_obj.seek(0)
            temp_content = file_obj.read()
            file_obj.seek(0)
            
            try:
                df_full, detected_encoding = read_dataframe_from_bytes(temp_content, file_type)
            except ValueError as ve:
                return Response({"error": str(ve)}, status=status.HTTP_400_BAD_REQUEST)

            rows_count = len(df_full)
            cols_count = len(df_full.columns)
            if rows_count == 0:
                return Response({"error": "The uploaded dataset is empty."}, status=status.HTTP_400_BAD_REQUEST)

            dataset = Dataset.objects.create(
                user=user,
                guest_id=guest_id if not user else None,
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

            res_data = perform_cleaning_operation(dataset, config, user=user)

            if not user and guest_id:
                usage.clean_count += 1
                usage.save()
                if ip_usage and ip_usage.id != usage.id:
                    ip_usage.clean_count = max(ip_usage.clean_count, usage.clean_count)
                    ip_usage.save()

                res_data["limit_info"] = {
                    "clean_count": usage.clean_count,
                    "remaining_cleans": max(0, 3 - usage.clean_count),
                    "limit_reached": usage.clean_count >= 3
                }
            
            res_data["download_url"] = f"/api/cleaning/{dataset.id}/download/?type=csv"
            return Response(res_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": f"Failed to clean dataset: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


