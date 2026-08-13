import os
import io
import time
import joblib
import numpy as np
import pandas as pd
from django.core.files.base import ContentFile
from django.utils import timezone
from django.conf import settings

# Scikit-learn
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler, PolynomialFeatures, LabelEncoder
from sklearn.metrics import (
    r2_score, mean_squared_error, mean_absolute_error, explained_variance_score,
    accuracy_score, precision_recall_fscore_support, roc_auc_score, confusion_matrix, balanced_accuracy_score
)

# Models
from sklearn.linear_model import LinearRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC

import warnings
warnings.filterwarnings("ignore", category=FutureWarning)

# RefineX Imports
from apps.cleaning.models import Dataset
from apps.cleaning.utils import read_dataframe, make_columns_unique, make_json_safe
from .models import ModelTrainingJob

class DatasetValidationService:
    @staticmethod
    def validate_file(file_path, file_type, encoding="UTF-8"):
        """
        Performs initial rigorous validations on file existence, corruption, size, columns and row bounds.
        Returns: (success, error_message, dataframe, detected_encoding)
        """
        if not os.path.exists(file_path):
            return False, "File does not exist on the server.", None, encoding
            
        # File Size check (limit to 20MB)
        file_size = os.path.getsize(file_path)
        if file_size > 20 * 1024 * 1024:
            return False, "File size exceeds the allowed limit of 20MB.", None, encoding

        try:
            df, detected_encoding = read_dataframe(file_path, file_type, encoding=encoding)
        except UnicodeDecodeError:
            return False, "File encoding error. The character set is unsupported.", None, encoding
        except Exception as e:
            return False, f"The file is corrupted or could not be read: {str(e)}", None, encoding

        if df is None or df.empty:
            return False, "The dataset is empty.", None, detected_encoding

        # Validate dimensions
        if len(df.columns) < 2:
            return False, "Dataset must contain at least two columns to train a model.", None, detected_encoding
        if len(df) < 15:
            return False, f"Dataset contains too few rows ({len(df)}) to split and train a model. Need at least 15 rows.", None, detected_encoding

        return True, "", df, detected_encoding


class DatasetInspectionService:
    @staticmethod
    def inspect_dataset(df):
        """
        Inspects the DataFrame for quality issues and schema warnings.
        Returns: (is_clean, warnings_dict)
        """
        warnings = {
            "missing_values": 0,
            "duplicate_rows": 0,
            "duplicate_columns": [],
            "infinite_values": 0,
            "mixed_data_types": [],
            "constant_columns": [],
            "empty_columns": [],
            "id_like_columns": [],
            "unsupported_columns": [],
            "high_missing_columns": []
        }
        
        is_clean = True
        total_rows = len(df)

        # 1. Missing values
        missing_count = int(df.isna().sum().sum())
        if missing_count > 0:
            warnings["missing_values"] = missing_count
            is_clean = False

        # 2. Duplicate rows
        dup_rows = int(df.duplicated().sum())
        if dup_rows > 0:
            warnings["duplicate_rows"] = dup_rows
            is_clean = False

        # 3. Duplicate columns (exact values)
        # Convert objects to string temporarily to avoid duplicate check hashing issues
        temp_df = df.copy()
        for col in temp_df.columns:
            if temp_df[col].apply(lambda x: isinstance(x, (list, dict))).any():
                temp_df[col] = temp_df[col].astype(str)
        try:
            dup_cols_mask = temp_df.T.duplicated()
            dup_cols = list(temp_df.columns[dup_cols_mask])
            if dup_cols:
                warnings["duplicate_columns"] = dup_cols
                is_clean = False
        except Exception:
            pass

        # 4. Infinite values check
        try:
            numeric_cols = df.select_dtypes(include=np.number)
            inf_count = int(np.isinf(numeric_cols).sum().sum())
            if inf_count > 0:
                warnings["infinite_values"] = inf_count
                is_clean = False
        except Exception:
            pass

        # 5. Mixed types & constant/empty/ID/high-null columns
        for col in df.columns:
            # Empty column check
            col_null_count = df[col].isna().sum()
            if col_null_count == total_rows:
                warnings["empty_columns"].append(col)
                is_clean = False
                continue

            # High missing value check (> 50%)
            missing_pct = (col_null_count / total_rows) * 100
            if missing_pct > 50:
                warnings["high_missing_columns"].append(col)
                is_clean = False

            # Constant column check
            unique_vals = df[col].nunique(dropna=True)
            if unique_vals <= 1:
                warnings["constant_columns"].append(col)
                is_clean = False

            # Mixed data types check
            inferred = pd.api.types.infer_dtype(df[col].dropna())
            if inferred in ['mixed', 'mixed-integer', 'mixed-integer-float']:
                warnings["mixed_data_types"].append(col)
                is_clean = False

            # ID-like column detection
            col_lower = str(col).lower()
            if col_lower in ['id', 'uuid', 'guid', 'index'] or col_lower.endswith('_id'):
                warnings["id_like_columns"].append(col)
                is_clean = False
            elif pd.api.types.is_integer_dtype(df[col]):
                # Sequential or strictly unique check
                if unique_vals == total_rows and df[col].max() - df[col].min() == total_rows - 1:
                    warnings["id_like_columns"].append(col)
                    is_clean = False

            # Unsupported types (Python objects, lists, dictionaries)
            has_objects = df[col].dropna().apply(lambda x: isinstance(x, (list, dict, tuple))).any()
            if has_objects:
                warnings["unsupported_columns"].append(col)
                is_clean = False

        return is_clean, warnings


class ModelTrainingService:
    @staticmethod
    def infer_problem_type(df, target_column):
        """
        Determines if task is regression or classification based on data type and cardinality.
        """
        col_series = df[target_column].dropna()
        if col_series.empty:
            raise ValueError("Target column contains only missing values.")

        # Check unique categories
        unique_count = col_series.nunique()
        dtype = col_series.dtype

        # Classification heuristics
        if pd.api.types.is_bool_dtype(col_series) or pd.api.types.infer_dtype(col_series) == 'boolean':
            return "classification"
        if not pd.api.types.is_numeric_dtype(col_series) or unique_count <= 10:
            return "classification"
        if pd.api.types.is_integer_dtype(col_series) and unique_count < 15 and (unique_count / len(df)) < 0.05:
            return "classification"
            
        return "regression"

    @staticmethod
    def build_preprocessing_pipeline(X, algorithm_name):
        """
        Creates custom independent ColumnTransformer mapping preprocessing pipelines for each algorithm.
        """
        numeric_features = [col for col in X.columns if pd.api.types.is_numeric_dtype(X[col])]
        categorical_features = [col for col in X.columns if not pd.api.types.is_numeric_dtype(X[col])]

        # Scaling requirements
        needs_scaling = algorithm_name in ["knn_classifier", "svm_classifier"]

        # Numeric transformations
        num_steps = [('imputer', SimpleImputer(strategy='median'))]
        if needs_scaling:
            num_steps.append(('scaler', StandardScaler()))
        if algorithm_name == "polynomial_regression":
            num_steps.append(('poly', PolynomialFeatures(degree=2, include_bias=False)))

        numeric_transformer = Pipeline(steps=num_steps)

        # Categorical transformations
        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])

        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numeric_features),
                ('cat', categorical_transformer, categorical_features)
            ],
            remainder='drop'
        )
        return preprocessor

    @staticmethod
    def get_model_instance(algorithm_name, problem_type):
        """
        Instantiates appropriate scikit-learn estimators.
        """
        if problem_type == "regression":
            if algorithm_name in ["linear", "multiple_linear", "polynomial_regression"]:
                return LinearRegression()
            raise ValueError(f"Regression does not support '{algorithm_name}'.")
        else:
            if algorithm_name == "knn_classifier":
                return KNeighborsClassifier()
            elif algorithm_name == "decision_tree_classifier":
                return DecisionTreeClassifier(random_state=42)
            elif algorithm_name == "random_forest_classifier":
                return RandomForestClassifier(random_state=42)
            elif algorithm_name == "svm_classifier":
                return SVC(kernel='rbf', probability=True, random_state=42)
            raise ValueError(f"Classification does not support '{algorithm_name}'.")

    @staticmethod
    def get_search_space(algorithm_name):
        """
        Returns parameter spaces for GridSearchCV tuning.
        """
        if algorithm_name == "knn_classifier":
            return {
                'model__n_neighbors': [3, 5, 7, 9],
                'model__weights': ['uniform', 'distance']
            }
        elif algorithm_name == "decision_tree_classifier":
            return {
                'model__max_depth': [None, 5, 10, 15],
                'model__min_samples_split': [2, 5, 10]
            }
        elif algorithm_name == "random_forest_classifier":
            return {
                'model__n_estimators': [50, 100],
                'model__max_depth': [None, 10, 20],
                'model__min_samples_split': [2, 5]
            }
        elif algorithm_name == "svm_classifier":
            return {
                'model__C': [0.1, 1, 10],
                'model__gamma': ['scale', 'auto']
            }
        return {}  # Linear regression doesn't tune hyperparameters

    @staticmethod
    def run_training_in_background(job_id):
        """
        Background task thread running validation, split, pipeline execution, metrics scoring, tuning, and results saving.
        """
        job = ModelTrainingJob.objects.get(pk=job_id)
        job.status = "training"
        job.progress_stage = "loading_dataset"
        job.progress_percent = 10
        job.save()

        try:
            dataset = job.dataset
            file_path = dataset.cleaned_file.path if dataset.cleaned_file else dataset.original_file.path
            
            # Load Data
            df, _ = read_dataframe(file_path, dataset.file_type, encoding=dataset.encoding)
            
            # Extract configuration
            target = job.target_column
            features = job.selected_features
            algorithms = job.selected_models
            mode = job.training_mode
            
            # Clean indices
            df.columns = make_columns_unique(df.columns)
            
            X = df[features]
            y = df[target]

            # Compute feature encodings and dtypes for frontend prediction dropdowns
            feature_dtypes = {}
            feature_encodings = {}

            for col in features:
                col_series = df[col].dropna()
                if pd.api.types.is_numeric_dtype(col_series) and col_series.nunique() > 10:
                    feature_dtypes[col] = "numeric"
                else:
                    feature_dtypes[col] = "categorical"
                    unique_vals = sorted([str(v) for v in col_series.unique() if pd.notna(v)])
                    mapping = []
                    for idx, val in enumerate(unique_vals):
                        mapping.append({
                            "label": val,
                            "value": idx
                        })
                    feature_encodings[col] = mapping

            job.feature_dtypes = feature_dtypes
            job.feature_encodings = feature_encodings
            job.save(update_fields=["feature_dtypes", "feature_encodings"])

            problem_type = ModelTrainingService.infer_problem_type(df, target)

            # Check target encodings if classification
            label_encoder = None
            if problem_type == "classification":
                job.progress_stage = "encoding_labels"
                job.progress_percent = 25
                job.save()
                
                label_encoder = LabelEncoder()
                y = pd.Series(label_encoder.fit_transform(y.astype(str)), index=y.index)

            # 20% Test size default
            test_size = job.hyperparameters.get("test_size", 0.2)
            random_state = job.hyperparameters.get("random_state", 42)
            shuffle = job.hyperparameters.get("shuffle", True)
            cv_folds = job.hyperparameters.get("cv_folds", 5)

            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=random_state, shuffle=shuffle
            )

            job.progress_stage = "building_pipelines"
            job.progress_percent = 35
            job.save()

            trained_models_summary = {}
            all_pipelines = {}
            best_score = -99999.0
            best_model_name = None
            best_pipeline = None
            
            total_algorithms = len(algorithms)

            for idx, algo in enumerate(algorithms):
                # Check if job was cancelled by user
                job.refresh_from_db()
                if job.status == "cancelled":
                    return

                job.progress_stage = f"training_{algo}"
                job.progress_percent = int(35 + (idx / total_algorithms) * 45)
                job.save()

                preprocessor = ModelTrainingService.build_preprocessing_pipeline(X_train, algo)
                model = ModelTrainingService.get_model_instance(algo, problem_type)
                
                pipeline = Pipeline(steps=[
                    ('preprocessor', preprocessor),
                    ('model', model)
                ])

                # Train with timing
                t0 = time.time()
                
                # Check tuning in RefineX Decide mode
                if mode == "decide" and algo in ["knn_classifier", "decision_tree_classifier", "random_forest_classifier", "svm_classifier"]:
                    param_grid = ModelTrainingService.get_search_space(algo)
                    grid = GridSearchCV(pipeline, param_grid, cv=cv_folds, n_jobs=-1, scoring='accuracy')
                    grid.fit(X_train, y_train)
                    pipeline = grid.best_estimator_
                    best_params = grid.best_params_
                else:
                    pipeline.fit(X_train, y_train)
                    best_params = {}

                t_train = time.time() - t0
                all_pipelines[algo] = pipeline

                # Predict with timing
                t0_pred = time.time()
                y_pred = pipeline.predict(X_test)
                t_pred = time.time() - t0_pred

                # Metric scoring
                metrics = {}
                cv_score = 0.0
                
                if problem_type == "regression":
                    r2 = r2_score(y_test, y_pred)
                    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
                    mae = mean_absolute_error(y_test, y_pred)
                    mse = mean_squared_error(y_test, y_pred)
                    evs = explained_variance_score(y_test, y_pred)
                    
                    # Cross Val Score
                    try:
                        scores = cross_val_score(pipeline, X_train, y_train, cv=cv_folds, scoring='r2')
                        cv_score = float(np.mean(scores))
                    except:
                        cv_score = float(r2)
                    
                    # Adjusted R2 calculation
                    n_samples = len(y_test)
                    p_features = X_test.shape[1]
                    adj_r2 = 1 - (1 - r2) * (n_samples - 1) / (n_samples - p_features - 1) if n_samples > (p_features + 1) else r2
                    train_score = pipeline.score(X_train, y_train)
                    generalization = float(train_score - r2)

                    metrics = {
                        "r2": float(r2),
                        "rmse": float(rmse),
                        "mae": float(mae),
                        "mse": float(mse),
                        "explained_variance": float(evs),
                        "adjusted_r2": float(adj_r2),
                        "cv_score": cv_score,
                        "generalization_diff": generalization
                    }
                    
                    # Score rank formula: R2 score
                    overall_score = r2
                    
                else:  # Classification
                    acc = accuracy_score(y_test, y_pred)
                    bal_acc = balanced_accuracy_score(y_test, y_pred)
                    
                    precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='weighted', zero_division=0)
                    
                    cm = confusion_matrix(y_test, y_pred).tolist()
                    
                    try:
                        scores = cross_val_score(pipeline, X_train, y_train, cv=cv_folds, scoring='accuracy')
                        cv_score = float(np.mean(scores))
                    except:
                        cv_score = float(acc)

                    roc_auc = 0.5
                    try:
                        if hasattr(pipeline, "predict_proba"):
                            y_prob = pipeline.predict_proba(X_test)
                            if len(np.unique(y_train)) == 2:
                                roc_auc = roc_auc_score(y_test, y_prob[:, 1])
                            else:
                                roc_auc = roc_auc_score(y_test, y_prob, multi_class='ovr')
                    except:
                        pass

                    train_score = pipeline.score(X_train, y_train)
                    generalization = float(train_score - acc)

                    metrics = {
                        "accuracy": float(acc),
                        "balanced_accuracy": float(bal_acc),
                        "precision": float(precision),
                        "recall": float(recall),
                        "f1_score": float(f1),
                        "roc_auc": float(roc_auc),
                        "cv_score": cv_score,
                        "confusion_matrix": cm,
                        "generalization_diff": generalization
                    }

                    # Classification Rank Score: accuracy
                    overall_score = acc

                trained_models_summary[algo] = {
                    "algorithm": algo,
                    "metrics": metrics,
                    "overall_score": float(overall_score),
                    "training_time": float(t_train),
                    "prediction_time": float(t_pred),
                    "tuned_params": best_params
                }

                # Evaluate best model candidate
                if overall_score > best_score:
                    best_score = overall_score
                    best_model_name = algo
                    best_pipeline = pipeline

            # Check if cancelled before saving final files
            job.refresh_from_db()
            if job.status == "cancelled":
                return

            # Stage: saving model
            job.progress_stage = "saving_results"
            job.progress_percent = 90
            job.save()

            # Save the best model
            model_dir = os.path.join(settings.MEDIA_ROOT, "models")
            os.makedirs(model_dir, exist_ok=True)
            model_filename = f"model_job_{job.id}.joblib"
            model_path = os.path.join(model_dir, model_filename)

            # Package estimator alongside encoders
            saved_bundle = {
                "pipeline": best_pipeline,
                "all_pipelines": all_pipelines,
                "label_encoder": label_encoder,
                "features": features,
                "target": target,
                "problem_type": problem_type
            }
            joblib.dump(saved_bundle, model_path)

            # Check if cancelled after joblib dump
            job.refresh_from_db()
            if job.status == "cancelled":
                if os.path.exists(model_path):
                    try:
                        os.remove(model_path)
                    except Exception:
                        pass
                return

            # Store predictions data
            # Map predictions back to label classes
            predicted_labels = list(best_pipeline.predict(X_test))
            actual_labels = list(y_test)
            
            if label_encoder:
                predicted_labels = list(label_encoder.inverse_transform(predicted_labels))
                actual_labels = list(label_encoder.inverse_transform(actual_labels))

            pred_data = make_json_safe({
                "actual": actual_labels,
                "predicted": predicted_labels
            })

            # Update Job DB Record
            job.status = "completed"
            job.progress_stage = "completed"
            job.progress_percent = 100
            job.evaluation_metrics = make_json_safe(trained_models_summary)
            job.best_model_name = best_model_name
            job.best_model_score = float(best_score)
            job.training_duration = float(sum(m["training_time"] for m in trained_models_summary.values()))
            job.prediction_duration = float(sum(m["prediction_time"] for m in trained_models_summary.values()))
            job.trained_model_file = f"models/{model_filename}"
            job.predictions = pred_data
            job.save()

        except Exception as e:
            try:
                job.refresh_from_db()
                if job.status == "cancelled":
                    return
                job.status = "failed"
                job.progress_stage = "failed"
                job.progress_percent = 100
                job.error_message = str(e)
                job.predictions = {}
                job.save()
            except Exception:
                pass
