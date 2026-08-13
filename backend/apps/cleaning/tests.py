import io
import pandas as pd
import numpy as np
from django.test import TestCase, RequestFactory
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model

from apps.cleaning.models import Dataset, CleaningJob
from apps.cleaning.utils import (
    is_numeric_column,
    make_columns_unique,
    clean_numeric_series,
    make_json_safe,
    calculate_quality_score,
    profile_dataset,
    auto_clean_dataset,
    clean_dataset,
)
from apps.cleaning.reports import generate_pdf_report

User = get_user_model()

class CleaningUtilsTestCase(TestCase):
    def test_is_numeric_column(self):
        self.assertTrue(is_numeric_column(pd.Series([1, 2, 3])))
        self.assertTrue(is_numeric_column(pd.Series([1.5, 2.5])))
        self.assertFalse(is_numeric_column(pd.Series([True, False])))
        self.assertFalse(is_numeric_column(pd.Series(["a", "b", "c"])))

    def test_make_columns_unique(self):
        cols = ["name", "age", "name", "", "age"]
        unique = make_columns_unique(cols)
        self.assertEqual(unique, ["name", "age", "name_1", "unnamed", "age_1"])

    def test_clean_numeric_series(self):
        s = pd.Series(["$1,000.50", "₹500", " (100.25) ", "Rs. 200", "INVALID"])
        cleaned = clean_numeric_series(s)
        self.assertEqual(cleaned.iloc[0], 1000.50)
        self.assertEqual(cleaned.iloc[1], 500.0)
        self.assertEqual(cleaned.iloc[2], -100.25)
        self.assertEqual(cleaned.iloc[3], 200.0)
        self.assertTrue(pd.isna(cleaned.iloc[4]))

    def test_make_json_safe(self):
        data = {
            "series": pd.Series([1, 2, np.nan]),
            "index": pd.Index(["a", "b"]),
            "float_nan": np.nan,
            "int_val": np.int64(42),
            "bool_val": np.bool_(True),
        }
        safe_data = make_json_safe(data)
        self.assertEqual(safe_data["series"], [1.0, 2.0, None])
        self.assertEqual(safe_data["index"], ["a", "b"])
        self.assertIsNone(safe_data["float_nan"])
        self.assertEqual(safe_data["int_val"], 42)
        self.assertTrue(safe_data["bool_val"])

    def test_age_column_vs_percentage_column_invalid_checks(self):
        df = pd.DataFrame({
            "user_age": [25, 150, -5, 30],
            "percentage": [95.5, 150.0, 80.0, 99.9],
            "coverage": [10.0, 200.0, 30.0, 40.0],
            "email": ["user+tag@domain.com", "invalid-email", 123.45, np.nan],
            "phone": ["(123) 456-7890", 9876543210.0, np.nan, "invalid-phone"]
        })
        config = {
            "remove_invalid_values": True
        }
        cleaned_df, logs, before_report, after_report = clean_dataset(df, config)
        
        # user_age should have 150 and -5 nullified
        self.assertTrue(pd.isna(cleaned_df["user_age"].iloc[1]))
        self.assertTrue(pd.isna(cleaned_df["user_age"].iloc[2]))
        
        # percentage & coverage should NOT be touched by age checks
        self.assertEqual(cleaned_df["percentage"].iloc[1], 150.0)
        self.assertEqual(cleaned_df["coverage"].iloc[1], 200.0)
        
        # email with + tag should pass, invalid-email and float nullified
        self.assertEqual(cleaned_df["email"].iloc[0], "user+tag@domain.com")
        self.assertTrue(pd.isna(cleaned_df["email"].iloc[1]))
        self.assertTrue(pd.isna(cleaned_df["email"].iloc[2]))
        
        # phone formats should pass, invalid-phone nullified
        self.assertEqual(cleaned_df["phone"].iloc[0], "(123) 456-7890")
        self.assertEqual(cleaned_df["phone"].iloc[1], "9876543210")
        self.assertTrue(pd.isna(cleaned_df["phone"].iloc[3]))

    def test_auto_clean_dataset(self):
        df = pd.DataFrame({
            " Name ": [" Alice ", " Bob ", " Alice ", "  "],
            " AGE ": [25, np.nan, 25, np.nan],
            " Salary ": [" $5,000 ", " $6,000 ", " $5,000 ", " N/A "],
            " Constant ": [1, 1, 1, 1]
        })
        cleaned_df, logs, before_report, after_report = auto_clean_dataset(df)
        self.assertIn("name", cleaned_df.columns)
        self.assertIn("age", cleaned_df.columns)
        self.assertIn("salary", cleaned_df.columns)
        self.assertNotIn("constant", cleaned_df.columns)  # Constant dropped
        self.assertGreaterEqual(after_report["quality_score"], 0)

    def test_text_and_blank_cleaning_emoji_and_tabs_newlines(self):
        df = pd.DataFrame({
            "text": ["Hello 😀 World! 🔥", "Line1\nLine2\tTabbed", "  Extra spaces  ", "NA"],
        })

        # Test case 1: text_remove_emoji=True, text_remove_tabs_newlines=False
        config1 = {
            "blank_value_detection": True,
            "text_cleaning": True,
            "text_trim": True,
            "text_remove_multiple_spaces": True,
            "text_remove_emoji": True,
            "text_remove_tabs_newlines": False,
        }
        cleaned_df1, logs1, _, _ = clean_dataset(df, config1)

        # Row 0: Emojis removed, spaces handled
        self.assertEqual(cleaned_df1["text"].iloc[0], "Hello World!")
        # Row 1: \n and \t MUST NOT be removed
        self.assertIn("\n", cleaned_df1["text"].iloc[1])
        self.assertIn("\t", cleaned_df1["text"].iloc[1])
        # Row 3: Sentinel "NA" converted to NaN
        self.assertTrue(pd.isna(cleaned_df1["text"].iloc[3]))

        # Test case 2: text_remove_tabs_newlines=True
        config2 = {
            "blank_value_detection": True,
            "text_cleaning": True,
            "text_remove_tabs_newlines": True,
        }
        cleaned_df2, logs2, _, _ = clean_dataset(df, config2)
        self.assertNotIn("\n", cleaned_df2["text"].iloc[1])
        self.assertNotIn("\t", cleaned_df2["text"].iloc[1])

    def test_pdf_report_generation(self):
        user = User.objects.create_user(username="testuser", password="password123")
        dataset = Dataset.objects.create(
            user=user,
            name="test.csv",
            original_file=SimpleUploadedFile("test.csv", b"col1,col2\n1,2\n3,4"),
            file_type="csv",
            file_size=20,
            rows_count=2,
            cols_count=2
        )
        job = CleaningJob.objects.create(
            user=user,
            dataset=dataset,
            before_stats={"quality_score": 80, "missing_summary": {"columns": []}},
            after_stats={"quality_score": 95, "missing_summary": {"columns": []}},
            logs=["✓ Log entry 1"]
        )
        out_stream = io.BytesIO()
        generate_pdf_report(out_stream, dataset, job)
        pdf_bytes = out_stream.getvalue()
        self.assertTrue(pdf_bytes.startswith(b"%PDF"))


