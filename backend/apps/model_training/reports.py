import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

def generate_ml_pdf_report(output_stream, job):
    """
    Generates a beautifully structured PDF summary of the machine learning training run.
    """
    doc = SimpleDocTemplate(
        output_stream,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    story = []
    styles = getSampleStyleSheet()
    
    # Custom Colors
    primary_color = colors.HexColor('#673AB7')
    dark_gray = colors.HexColor('#1C1C1E')
    light_bg = colors.HexColor('#F2F2F7')
    border_color = colors.HexColor('#D1D1D6')
    text_color = colors.HexColor('#333333')

    # Custom Styles
    title_style = ParagraphStyle(
        'MLDocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=primary_color,
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'MLDocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#555555'),
        spaceAfter=20
    )
    
    h1_style = ParagraphStyle(
        'MLSectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=dark_gray,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'MLBodyText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=text_color,
        spaceAfter=4
    )
    
    bold_body_style = ParagraphStyle(
        'MLBoldBody',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    # Title Header
    story.append(Paragraph("RefineX ML Training & Model Evaluation Report", title_style))
    story.append(Paragraph(f"Generated automatically by RefineX Platform — Machine Learning Module", subtitle_style))
    story.append(Spacer(1, 8))

    # Job Metadata Table
    story.append(Paragraph("Training Session Profile", h1_style))
    
    # Determine problem type based on metrics keys
    prob_type = "Regression"
    if job.evaluation_metrics:
        first_model_metrics = list(job.evaluation_metrics.values())[0].get("metrics", {})
        if "accuracy" in first_model_metrics:
            prob_type = "Classification"
            
    meta_data = [
        [Paragraph("Dataset Name:", bold_body_style), Paragraph(job.dataset_name, body_style)],
        [Paragraph("Task Type:", bold_body_style), Paragraph(prob_type, body_style)],
        [Paragraph("Target Column (Y):", bold_body_style), Paragraph(job.target_column, body_style)],
        [Paragraph("Features Count (X):", bold_body_style), Paragraph(str(len(job.selected_features)), body_style)],
        [Paragraph("Training Mode:", bold_body_style), Paragraph(job.training_mode.upper(), body_style)],
        [Paragraph("Training Date:", bold_body_style), Paragraph(job.created_at.strftime("%Y-%m-%d %H:%M:%S UTC"), body_style)],
    ]
    meta_table = Table(meta_data, colWidths=[130, 370])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E5EA')),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))

    # Best Model Summary Card
    story.append(Paragraph("Champion Model Summary", h1_style))
    score_label = "F1-Score" if prob_type == "Classification" else "Adjusted R²"
    
    best_score_display = f"{job.best_model_score * 100:.2f}%" if job.best_model_score else "N/A"
    
    score_text = f"Best Algorithm: <b>{job.best_model_name}</b>  ({score_label}: <b>{best_score_display}</b>)"
    score_desc = f"RefineX executed the training pipeline across selected estimators, parsed feature engineering vectors, computed cross-validation bounds, and evaluated scores. The model listed above achieved the highest generalization score and has been serialized as default pipeline."
    
    story.append(Paragraph(score_text, ParagraphStyle('MLScoreText', parent=body_style, fontSize=10, leading=14, textColor=primary_color)))
    story.append(Paragraph(score_desc, body_style))
    story.append(Spacer(1, 15))

    # Detailed Model Comparison Table
    story.append(Paragraph("Estimator Performance Comparison", h1_style))
    if job.evaluation_metrics:
        # Construct header columns dynamically based on task type
        if prob_type == "Classification":
            headers = [
                Paragraph("Algorithm", bold_body_style),
                Paragraph("Accuracy", bold_body_style),
                Paragraph("F1-Score", bold_body_style),
                Paragraph("CV Score", bold_body_style),
                Paragraph("Train Time", bold_body_style)
            ]
            rows = [headers]
            for algo, item in job.evaluation_metrics.items():
                m = item["metrics"]
                rows.append([
                    Paragraph(algo, body_style),
                    Paragraph(f"{m.get('accuracy', 0.0):.4f}", body_style),
                    Paragraph(f"{m.get('f1_score', 0.0):.4f}", body_style),
                    Paragraph(f"{m.get('cv_score', 0.0):.4f}", body_style),
                    Paragraph(f"{item.get('training_time', 0.0):.3f}s", body_style)
                ])
            col_widths = [160, 85, 85, 85, 85]
        else:
            headers = [
                Paragraph("Algorithm", bold_body_style),
                Paragraph("R² Score", bold_body_style),
                Paragraph("Adj R²", bold_body_style),
                Paragraph("CV Score", bold_body_style),
                Paragraph("RMSE", bold_body_style)
            ]
            rows = [headers]
            for algo, item in job.evaluation_metrics.items():
                m = item["metrics"]
                rows.append([
                    Paragraph(algo, body_style),
                    Paragraph(f"{m.get('r2', 0.0):.4f}", body_style),
                    Paragraph(f"{m.get('adjusted_r2', 0.0):.4f}", body_style),
                    Paragraph(f"{m.get('cv_score', 0.0):.4f}", body_style),
                    Paragraph(f"{m.get('rmse', 0.0):.4f}", body_style)
                ])
            col_widths = [160, 85, 85, 85, 85]

        comparison_table = Table(rows, colWidths=col_widths)
        comparison_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), light_bg),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('GRID', (0,0), (-1,-1), 0.5, border_color),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(comparison_table)
    else:
        story.append(Paragraph("No evaluation metrics summaries found.", body_style))

    # Notes section if any notes exist
    if job.notes:
        story.append(Spacer(1, 15))
        story.append(Paragraph("User Configuration Notes", h1_style))
        story.append(Paragraph(job.notes, body_style))
        
    doc.build(story)
