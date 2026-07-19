from django.test import TestCase
from .services import recommend_graphs, validate_graph_config
from .code_generator import compile_python_code

class VisualizationEngineTests(TestCase):
    def setUp(self):
        # Set up a mock dataset profile
        self.mock_analysis = {
            "total_rows": 100,
            "total_columns": 5,
            "numeric_columns": ["age", "salary", "experience"],
            "categorical_columns": ["department", "gender"],
            "boolean_columns": [],
            "date_columns": ["hire_date"],
            "text_columns": [],
            "unique_counts": {
                "age": 45,
                "salary": 90,
                "experience": 15,
                "department": 5,
                "gender": 2,
                "hire_date": 80
            },
            "stats": {
                "age": {"min": 18, "max": 65, "mean": 40, "median": 39, "std": 12},
                "salary": {"min": 30000, "max": 150000, "mean": 75000, "median": 70000, "std": 25000},
                "experience": {"min": 0, "max": 40, "mean": 15, "median": 14, "std": 10}
            }
        }

    def test_graph_recommendations(self):
        recs = recommend_graphs(self.mock_analysis)
        self.assertTrue(len(recs) > 0)
        
        # We should have a Line Chart recommended because date_columns exist
        line_chart_rec = [r for r in recs if r["graph_type"] == "Line Chart"]
        self.assertEqual(len(line_chart_rec), 1)
        self.assertEqual(line_chart_rec[0]["recommended_columns"], ["hire_date", "age"])
        
        # We should have a Pie Chart recommended because department has few unique values
        pie_rec = [r for r in recs if r["graph_type"] == "Pie Chart"]
        self.assertEqual(len(pie_rec), 1)

    def test_validation_engine(self):
        # Heatmap validation (requires >=2 numeric) -> Valid
        is_valid, err_msg, rec = validate_graph_config(self.mock_analysis, "Heatmap")
        self.assertTrue(is_valid)
        self.assertIsNone(err_msg)
        
        # Scatter Plot validation (requires X and Y numeric)
        is_valid, err_msg, _ = validate_graph_config(self.mock_analysis, "Scatter Plot", x_col="age", y_col="salary")
        self.assertTrue(is_valid)
        
        # Scatter Plot invalid (Y is categorical)
        is_valid, err_msg, _ = validate_graph_config(self.mock_analysis, "Scatter Plot", x_col="age", y_col="department")
        self.assertFalse(is_valid)
        
        # Pie Chart too many unique categories validation
        # Let's mock a column with high cardinality
        bad_analysis = dict(self.mock_analysis)
        bad_analysis["unique_counts"] = {"departments_large": 25}
        is_valid, err_msg, rec_type = validate_graph_config(bad_analysis, "Pie Chart", x_col="departments_large")
        self.assertFalse(is_valid)
        self.assertEqual(rec_type, "Bar Chart")

    def test_python_code_compiler(self):
        config = {
            "library": "plotly",
            "graph_type": "Bar Chart",
            "x_column": "department",
            "y_column": "salary",
            "aggregation": "sum",
            "sorting": "descending",
            "title": "Salary by Dept"
        }
        code = compile_python_code(config)
        self.assertIn("import plotly.express as px", code)
        self.assertIn("groupby('department'", code)
        self.assertIn("sort_values", code)
        self.assertIn("px.bar", code)
