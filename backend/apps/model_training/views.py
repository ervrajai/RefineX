import os
import io
import threading
import pandas as pd
import numpy as np
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.core.files.base import ContentFile
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from apps.accounts.views import CsrfExemptSessionAuthentication
from apps.cleaning.models import Dataset
from apps.cleaning.utils import make_json_safe, read_dataframe
from apps.core.services import ActivityService
from .models import ModelTrainingJob
from .services import DatasetValidationService, DatasetInspectionService, ModelTrainingService


@method_decorator(csrf_exempt, name='dispatch')
class DatasetMLUploadView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        # Create temporary dataset object to get a file path
        dataset = Dataset.objects.create(
            user=request.user if request.user.is_authenticated else None,
            name=file_obj.name,
            original_file=file_obj,
            file_type=file_obj.name.split('.')[-1].lower(),
            file_size=file_obj.size,
            status="uploaded"
        )

        # Run Validation Service
        success, err_msg, df, encoding = DatasetValidationService.validate_file(
            dataset.original_file.path, dataset.file_type
        )
        if not success:
            # Delete if invalid to preserve space
            dataset.original_file.delete()
            dataset.delete()
            return Response({"error": err_msg}, status=status.HTTP_400_BAD_REQUEST)

        dataset.rows_count = len(df)
        dataset.cols_count = len(df.columns)
        dataset.encoding = encoding
        dataset.save()

        # Run Inspection Service
        is_clean, warnings = DatasetInspectionService.inspect_dataset(df)

        preview_df = df.head(100).replace({pd.NA: None, np.nan: None})
        preview_data = {
            "columns": list(df.columns),
            "rows": make_json_safe(preview_df.to_dict(orient='records'))
        }

        metadata = {
            "id": dataset.id,
            "name": dataset.name,
            "file_type": dataset.file_type,
            "file_size": dataset.file_size,
            "rows": dataset.rows_count,
            "columns": dataset.cols_count,
            "encoding": dataset.encoding,
            "status": dataset.status
        }

        return Response({
            "dataset_id": dataset.id,
            "metadata": metadata,
            "is_clean": is_clean,
            "warnings": warnings,
            "preview": preview_data
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class DatasetMLTrainView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request, pk, *args, **kwargs):
        dataset = get_object_or_404(Dataset, pk=pk)
        
        target = request.data.get("target_column")
        features = request.data.get("selected_features", [])
        algorithms = request.data.get("selected_models", [])
        mode = request.data.get("training_mode", "manual")
        hparams = request.data.get("hyperparameters", {})

        if not target:
            return Response({"error": "Target column (Y) is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not features:
            return Response({"error": "At least one feature column (X) is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not algorithms:
            return Response({"error": "At least one algorithm must be selected."}, status=status.HTTP_400_BAD_REQUEST)

        if dataset.cleaned_file and os.path.exists(dataset.cleaned_file.path):
            file_path = dataset.cleaned_file.path
            # Cleaned files are always stored as parquet; use its actual type
            actual_file_type = "parquet" if file_path.endswith(".parquet") else dataset.file_type
        else:
            file_path = dataset.original_file.path
            actual_file_type = dataset.file_type
        df, _ = read_dataframe(file_path, actual_file_type, encoding=dataset.encoding)
        
        # Check targets validity
        try:
            problem_type = ModelTrainingService.infer_problem_type(df, target)
        except Exception as e:
            return Response({"error": f"Invalid target selection: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        # Check compatibility between target and algorithms
        classification_algos = ["knn_classifier", "decision_tree_classifier", "random_forest_classifier", "svm_classifier"]
        regression_algos = ["linear", "multiple_linear", "polynomial_regression"]

        for algo in algorithms:
            if problem_type == "classification" and algo in regression_algos:
                return Response({
                    "error": f"Algorithm '{algo}' is incompatible with classification targets. Target column '{target}' contains categorical/class values. Use a Classifier model."
                }, status=status.HTTP_400_BAD_REQUEST)
            if problem_type == "regression" and algo in classification_algos:
                return Response({
                    "error": f"Algorithm '{algo}' is incompatible with regression targets. Target column '{target}' is continuous numeric. Use a Regression model."
                }, status=status.HTTP_400_BAD_REQUEST)

        # Create Job DB Entry
        job = ModelTrainingJob.objects.create(
            user=request.user if request.user.is_authenticated else None,
            dataset=dataset,
            dataset_name=dataset.name,
            target_column=target,
            selected_features=features,
            selected_models=algorithms,
            feature_dtypes=request.data.get("feature_dtypes", {}),
            training_mode=mode,
            hyperparameters=hparams,
            status="pending",
            progress_stage="initialized",
            progress_percent=0
        )

        # Start asynchronous training loop in background thread
        thread = threading.Thread(
            target=ModelTrainingService.run_training_in_background,
            args=(job.id,)
        )
        thread.start()

        ActivityService.log_activity(
            user=request.user,
            action_type="train_model",
            title=f"Trained ML model for {job.dataset_name}",
            description=f"Initiated ML training job targeting '{target}' column with mode '{mode}'.",
            metadata={"job_id": job.id, "target": target, "mode": mode},
            request=request
        )

        return Response({
            "message": "Model training initiated in the background.",
            "job_id": job.id,
            "status": job.status
        }, status=status.HTTP_201_CREATED)



class DatasetMLJobStatusView(APIView):
    def get(self, request, pk, *args, **kwargs):
        job = get_object_or_404(ModelTrainingJob, pk=pk)
        return Response({
            "job_id": job.id,
            "status": job.status,
            "progress_stage": job.progress_stage,
            "progress_percent": job.progress_percent,
            "error_message": job.error_message
        }, status=status.HTTP_200_OK)


class DatasetMLJobDetailView(APIView):
    def get(self, request, pk, *args, **kwargs):
        job = get_object_or_404(ModelTrainingJob, pk=pk)
        # Verify ownership
        if request.user.is_authenticated and job.user and job.user != request.user:
            return Response({"error": "Unauthorized access to this training log."}, status=status.HTTP_403_FORBIDDEN)
            
        data = {
            "id": job.id,
            "dataset_id": job.dataset.id,
            "dataset_name": job.dataset_name,
            "target_column": job.target_column,
            "selected_features": job.selected_features,
            "selected_models": job.selected_models,
            "training_mode": job.training_mode,
            "preprocessing_steps": job.preprocessing_steps,
            "hyperparameters": job.hyperparameters,
            "evaluation_metrics": job.evaluation_metrics,
            "best_model_name": job.best_model_name,
            "best_model_score": job.best_model_score,
            "training_duration": job.training_duration,
            "prediction_duration": job.prediction_duration,
            "predictions": job.predictions,
            "status": job.status,
            "notes": job.notes,
            "tags": job.tags,
            "is_favorite": job.is_favorite,
            "created_at": job.created_at
        }
        return Response(make_json_safe(data), status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class DatasetMLHistoryView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]

    def get(self, request, *args, **kwargs):
        # Query filtering
        query = ModelTrainingJob.objects.filter(is_deleted=False)
        if request.user.is_authenticated:
            query = query.filter(user=request.user)
            
        # filters
        task_type = request.query_params.get("type")  # regression, classification
        search = request.query_params.get("search")
        favorite = request.query_params.get("favorite")
        sort = request.query_params.get("sort", "newest")

        if favorite == "true":
            query = query.filter(is_favorite=True)

        if search:
            query = query.filter(dataset_name__icontains=search)

        jobs = list(query)
        
        # Apply task type filter manually on evaluation summaries to be database engine agnostic
        if task_type:
            jobs = [
                j for j in jobs if j.evaluation_metrics and 
                (
                    (task_type == "regression" and "r2" in list(j.evaluation_metrics.values())[0].get("metrics", {})) or
                    (task_type == "classification" and "accuracy" in list(j.evaluation_metrics.values())[0].get("metrics", {}))
                )
            ]

        # Sorting
        if sort == "newest":
            jobs.sort(key=lambda x: x.created_at, reverse=True)
        elif sort == "oldest":
            jobs.sort(key=lambda x: x.created_at)
        elif sort == "highest_score":
            jobs.sort(key=lambda x: x.best_model_score or 0.0, reverse=True)

        results = []
        for job in jobs:
            # Safely grab problem type
            prob_type = "unknown"
            if job.evaluation_metrics:
                first_model = list(job.evaluation_metrics.values())[0]
                prob_type = "classification" if "accuracy" in first_model.get("metrics", {}) else "regression"
                
            results.append({
                "id": job.id,
                "dataset_id": job.dataset.id,
                "dataset_name": job.dataset_name,
                "target_column": job.target_column,
                "problem_type": prob_type,
                "best_model": job.best_model_name,
                "best_score": job.best_model_score,
                "status": job.status,
                "is_favorite": job.is_favorite,
                "created_at": job.created_at
            })

        return Response(make_json_safe(results), status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class DatasetMLJobActionsView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request, pk, *args, **kwargs):
        job = get_object_or_404(ModelTrainingJob, pk=pk)
        action = request.data.get("action")

        if action == "favorite":
            job.is_favorite = not job.is_favorite
            job.save()
            return Response({"is_favorite": job.is_favorite}, status=status.HTTP_200_OK)
            
        elif action == "notes":
            job.notes = request.data.get("notes", "")
            job.tags = request.data.get("tags", [])
            job.save()
            return Response({"message": "Notes and tags updated successfully."}, status=status.HTTP_200_OK)
            
        elif action == "soft_delete":
            job.is_deleted = True
            job.deleted_at = timezone.now()
            job.save()
            return Response({"message": "Training job soft deleted. It can be recovered."}, status=status.HTTP_200_OK)
            
        elif action == "restore":
            job.is_deleted = False
            job.deleted_at = None
            job.save()
            return Response({"message": "Training job restored."}, status=status.HTTP_200_OK)

        return Response({"error": "Invalid action parameter."}, status=status.HTTP_400_BAD_REQUEST)


class DatasetMLDownloadView(APIView):
    def get(self, request, pk, *args, **kwargs):
        job = get_object_or_404(ModelTrainingJob, pk=pk)
        download_type = request.query_params.get("type", "model")

        job.download_count += 1
        job.save(update_fields=["download_count"])

        ActivityService.log_activity(
            user=request.user,
            action_type="download_model",
            title=f"Downloaded ML export for {job.dataset_name}",
            description=f"Downloaded {download_type} for job #{job.id}.",
            metadata={"job_id": job.id, "download_type": download_type},
            request=request
        )

        if download_type == "model":
            if not job.trained_model_file or not os.path.exists(job.trained_model_file.path):
                return Response({"error": "Serialized model file not found."}, status=status.HTTP_404_NOT_FOUND)
            
            response = HttpResponse(open(job.trained_model_file.path, 'rb'), content_type='application/octet-stream')
            filename = os.path.basename(job.trained_model_file.name)
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response

        elif download_type == "predictions":
            if not job.predictions or "actual" not in job.predictions:
                return Response({"error": "No predictions found for this job."}, status=status.HTTP_404_NOT_FOUND)
                
            # Create a dataframe and write to CSV in response
            pred_df = pd.DataFrame({
                "Actual": job.predictions["actual"],
                "Predicted": job.predictions["predicted"]
            })
            
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="predictions_job_{job.id}.csv"'
            pred_df.to_csv(path_or_buf=response, index=False)
            return response

        elif download_type == "report":
            # Serve styled PDF report of model evaluations
            from .reports import generate_ml_pdf_report
            try:
                response = HttpResponse(content_type='application/pdf')
                filename = f"model_evaluation_report_{job.id}.pdf"
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                
                generate_ml_pdf_report(response, job)
                return response
            except Exception as e:
                return Response({"error": f"Failed to generate report PDF: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"error": "Unsupported download type."}, status=status.HTTP_400_BAD_REQUEST)


class DatasetMLPredictView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request, pk, *args, **kwargs):
        import os
        import joblib
        import numpy as np
        import pandas as pd
        
        job = get_object_or_404(ModelTrainingJob, pk=pk)
        if not job.trained_model_file or not os.path.exists(job.trained_model_file.path):
            return Response({"error": "Trained model binary not found. It might have been deleted."}, status=status.HTTP_404_NOT_FOUND)
            
        inputs = request.data.get("inputs", {})
        
        try:
            saved_bundle = joblib.load(job.trained_model_file.path)
            pipeline = saved_bundle["pipeline"]
            features = saved_bundle["features"]
            label_encoder = saved_bundle.get("label_encoder")
            
            # Build input DataFrame
            input_data = {}
            for col in features:
                val = inputs.get(col)
                if val is None or val == "":
                    input_data[col] = [np.nan]
                else:
                    try:
                        input_data[col] = [float(val)]
                    except ValueError:
                        input_data[col] = [val]
            
            df_input = pd.DataFrame(input_data)
            
            # Run prediction through preprocessing and model pipeline
            pred = pipeline.predict(df_input)[0]
            
            if label_encoder and saved_bundle.get("problem_type") == "classification":
                try:
                    pred_label = label_encoder.inverse_transform([pred])[0]
                except Exception:
                    pred_label = pred
            else:
                pred_label = pred
                
            return Response({"prediction": make_json_safe(pred_label)}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Prediction failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
