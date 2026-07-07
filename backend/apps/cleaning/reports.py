import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from .utils import profile_dataset, read_dataframe

def generate_pdf_report(output_stream, dataset, latest_job=None):
    """
    Generates a beautifully structured PDF audit and cleaning report for the dataset.
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
    
    # Custom Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#673AB7'),
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#555555'),
        spaceAfter=20
    )
    
    h1_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1C1C1E'),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#333333'),
        spaceAfter=4
    )
    
    bold_body_style = ParagraphStyle(
        'BoldBody',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    # Title Header
    story.append(Paragraph("RefineX Dataset Quality & Cleaning Report", title_style))
    story.append(Paragraph("Generated automatically by RefineX Platform — Dataset Cleaning Module", subtitle_style))
    story.append(Spacer(1, 8))
    
    # Metadata Card Table
    story.append(Paragraph("Dataset Profile Summary", h1_style))
    meta_data = [
        [Paragraph("Dataset Name:", bold_body_style), Paragraph(dataset.name, body_style)],
        [Paragraph("File Format:", bold_body_style), Paragraph(dataset.file_type.upper(), body_style)],
        [Paragraph("Dataset Size:", bold_body_style), Paragraph(f"{dataset.file_size / 1024:.2f} KB" if dataset.file_size else "N/A", body_style)],
        [Paragraph("Character Encoding:", bold_body_style), Paragraph(dataset.encoding, body_style)],
        [Paragraph("Workflow Status:", bold_body_style), Paragraph(dataset.status.upper(), body_style)],
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
    
    # Quality Score Card
    story.append(Paragraph("Quality Audit Score", h1_style))
    if latest_job:
        before_score = latest_job.before_stats.get("quality_score", 0)
        after_score = latest_job.after_stats.get("quality_score", 0)
        score_diff = after_score - before_score
        
        score_text = f"Quality Score: Before Cleaning <b>{before_score}/100</b>  →  After Cleaning <b>{after_score}/100</b> (+{score_diff} pts)"
        score_desc = "The data quality score represents dataset cleanliness. A higher score indicates resolved duplicates, handled null values, formatted dates, capped outliers, and normalized column names."
    else:
        # Profile original
        try:
            df, _ = read_dataframe(dataset.original_file.path, dataset.file_type, encoding=dataset.encoding)
            report = profile_dataset(df)
            score = report.get("quality_score", 0)
        except Exception:
            score = "N/A"
        score_text = f"Current Quality Score: <b>{score}/100</b>"
        score_desc = "Initial profile complete. Run cleaning configurations inside the RefineX workspace to remove redundancies and improve quality score."
        
    story.append(Paragraph(score_text, ParagraphStyle('ScoreText', parent=body_style, fontSize=10, leading=14, textColor=colors.HexColor('#673AB7'))))
    story.append(Paragraph(score_desc, body_style))
    story.append(Spacer(1, 15))
    
    # Missing Value Report
    story.append(Paragraph("Missing Values Analysis", h1_style))
    
    report_source = latest_job.after_stats if latest_job else None
    if not report_source:
        try:
            df, _ = read_dataframe(dataset.original_file.path, dataset.file_type, encoding=dataset.encoding)
            report_source = profile_dataset(df)
        except Exception:
            pass
            
    if report_source and "missing_summary" in report_source:
        missing_data = [[
            Paragraph("Column Name", bold_body_style),
            Paragraph("Missing Count", bold_body_style),
            Paragraph("Missing Percentage", bold_body_style)
        ]]
        for m in report_source["missing_summary"].get("columns", []):
            missing_data.append([
                Paragraph(m["column"], body_style),
                Paragraph(str(m["missing_count"]), body_style),
                Paragraph(f"{m['missing_percent']:.2f}%", body_style)
            ])
            
        missing_table = Table(missing_data, colWidths=[240, 130, 130])
        missing_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F2F2F7')),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#D1D1D6')),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(missing_table)
    else:
        story.append(Paragraph("No missing value analysis available.", body_style))
        
    story.append(Spacer(1, 15))
    
    # Redundancies card
    story.append(Paragraph("Redundancy Assessment", h1_style))
    if report_source and "duplicate_summary" in report_source:
        dup = report_source["duplicate_summary"]
        dup_text = f"• Duplicate Rows Detected: <b>{dup.get('duplicate_rows_count', 0)}</b> ({dup.get('duplicate_rows_percentage', 0.0):.2f}%)<br/>• Duplicate Columns Detected: <b>{dup.get('duplicate_columns_count', 0)}</b>"
        story.append(Paragraph(dup_text, body_style))
    else:
        story.append(Paragraph("No redundancy report available.", body_style))
        
    # Cleaning Log page break
    if latest_job and latest_job.logs:
        story.append(PageBreak())
        story.append(Paragraph("Cleaning Execution Pipeline Logs", h1_style))
        story.append(Paragraph("The following cleaning operations were sequentially executed on the raw dataset:", body_style))
        story.append(Spacer(1, 4))
        
        log_style = ParagraphStyle(
            'LogItem',
            parent=body_style,
            fontName='Courier',
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#2C2C2E')
        )
        
        log_data = []
        for log in latest_job.logs:
            log_data.append([Paragraph("✓", log_style), Paragraph(log, log_style)])
            
        log_table = Table(log_data, colWidths=[15, 485])
        log_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
            ('TOPPADDING', (0,0), (-1,-1), 2),
        ]))
        story.append(log_table)
        
    doc.build(story)
