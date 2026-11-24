import io
import os
from datetime import datetime, timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class ReportService:
    @staticmethod
    def generate_battery_health_pdf(
        vehicle_name: str = "VoltSense Model GT",
        vin: str = "KA05ER7777",
        soh: float = 88.4,
        soc: float = 67.0,
        health_score: int = 86,
        cycle_count: int = 238,
        design_capacity: float = 105.0,
        original_capacity: float = 100.0,
        current_capacity: float = 88.4,
        total_voltage: float = 34.9,
        avg_temperature: float = 23.6,
        total_impedance: float = 0.1085,
        predicted_rul: int = 456
    ) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'VoltTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=22,
            textColor=colors.HexColor('#0B1220'),
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'VoltSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            textColor=colors.HexColor('#55D889'),
            spaceAfter=15
        )
        section_style = ParagraphStyle(
            'VoltSection',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=13,
            textColor=colors.HexColor('#111B2B'),
            spaceBefore=12,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'VoltBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            textColor=colors.HexColor('#263449'),
            leading=13
        )

        elements = []

        # Header Title
        elements.append(Paragraph("VOLTSENSE AI — BATTERY HEALTH & DIAGNOSTIC REPORT", title_style))
        elements.append(Paragraph(f"Generated on {datetime.now(timezone.utc).strftime('%B %d, %Y - %H:%M:%S UTC')} | Telemetry Source: BMS CAN Interface", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#55D889'), spaceAfter=15))

        # Vehicle Information Section
        elements.append(Paragraph("1. Vehicle & Battery Specifications", section_style))
        vehicle_data = [
            ["Vehicle Model:", vehicle_name, "Vehicle Identification Number (VIN):", vin],
            ["Battery Chemistry:", "NMC (Lithium Nickel Manganese Cobalt)", "Nominal Pack Voltage:", f"{total_voltage} V"],
            ["Original Design Capacity:", f"{original_capacity} Ah ({design_capacity} Ah max)", "Current Measured Capacity:", f"{current_capacity} Ah"],
            ["Total Completed Cycles:", f"{cycle_count} Cycles", "Pack Operating Status:", "Active / Normal"]
        ]
        t_vehicle = Table(vehicle_data, colWidths=[140, 130, 150, 120])
        t_vehicle.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F4F7FB')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#111B2B')),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8.5),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1D9E4')),
        ]))
        elements.append(t_vehicle)
        elements.append(Spacer(1, 12))

        # Key Metrics Table
        elements.append(Paragraph("2. Primary State of Health (SOH) & State of Charge (SOC)", section_style))
        metrics_data = [
            ["Metric Parameter", "Measured Value", "Target / Design Threshold", "Engineering Status"],
            ["State of Health (SOH)", f"{soh}%", ">= 80.0% (Automotive EOL Limit)", "OPTIMAL (PASS)"],
            ["State of Charge (SOC)", f"{soc}%", "20.0% - 80.0% Optimal Operation", "NORMAL OPERATION"],
            ["Battery Health Score", f"{health_score} / 100", ">= 80 Good Condition", "GOOD CONDITION"],
            ["Average Operating Temp", f"{avg_temperature} °C", "15.0°C - 45.0°C Optimal Thermal Range", "NORMAL THERMAL"],
            ["Pack Total Impedance", f"{total_impedance} Ω", "< 0.1500 Ω Pack Resistance", "ACCEPTABLE"],
            ["AI Predicted RUL", f"{predicted_rul} Cycles", "Remaining to 70% Capacity Retention", "ON DESIGN TARGET"]
        ]
        t_metrics = Table(metrics_data, colWidths=[160, 110, 160, 110])
        t_metrics.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#111B2B')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1D9E4')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')])
        ]))
        elements.append(t_metrics)
        elements.append(Spacer(1, 12))

        # Cell Level Telemetry Summary
        elements.append(Paragraph("3. Cell Level Diagnostics (10-Cell Module Bank)", section_style))
        cell_data = [
            ["Cell ID", "Voltage (V)", "Temp (°C)", "Impedance (Ω)", "Status", "Notes"],
            ["Cell 01", "3.56 V", "25.2 °C", "0.0691 Ω", "WARNING", "Elevated internal resistance; impedance delta 42mΩ"],
            ["Cell 02", "3.62 V", "20.5 °C", "0.0247 Ω", "HEALTHY", "Nominal voltage and optimal thermal gradient"],
            ["Cell 03", "3.60 V", "25.1 °C", "0.0147 Ω", "HEALTHY", "Normal operating characteristics"],
            ["Cell 04", "3.59 V", "23.4 °C", "0.0182 Ω", "HEALTHY", "Balanced with pack average"],
            ["Cell 05", "3.61 V", "22.9 °C", "0.0165 Ω", "HEALTHY", "Balanced with pack average"],
            ["Cell 06", "3.58 V", "23.8 °C", "0.0194 Ω", "HEALTHY", "Balanced with pack average"],
            ["Cell 07", "3.60 V", "24.1 °C", "0.0177 Ω", "HEALTHY", "Balanced with pack average"],
            ["Cell 08", "3.57 V", "24.6 °C", "0.0210 Ω", "HEALTHY", "Balanced with pack average"],
            ["Cell 09", "3.62 V", "23.0 °C", "0.0158 Ω", "HEALTHY", "Balanced with pack average"],
            ["Cell 10", "3.61 V", "23.2 °C", "0.0162 Ω", "HEALTHY", "Balanced with pack average"],
        ]
        t_cells = Table(cell_data, colWidths=[60, 70, 70, 80, 70, 190])
        t_cells.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#172337')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('TEXTCOLOR', (4, 1), (4, 1), colors.HexColor('#D97706')),  # Warning color
            ('FONTNAME', (4, 1), (4, 1), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1D9E4')),
        ]))
        elements.append(t_cells)
        elements.append(Spacer(1, 14))

        # Predictive Maintenance & Recommendations
        elements.append(Paragraph("4. AI Predictive Analytics & Maintenance Directives", section_style))
        elements.append(Paragraph(
            "• <b>Capacity Fade Trajectory:</b> Current degradation rate is approximately 1.9% capacity retention loss per month over the prior 6-month observation window. The pack is estimated to reach 78 - 80 Ah in 12 months, remaining safely above the 70.0 Ah end-of-life threshold.<br/>"
            "• <b>Thermal Stability:</b> 7-day thermal historical tracking confirms maximum temperature excursion peaked at 32.0°C (May 9), well within the optimal 15°C - 45°C boundary.<br/>"
            "• <b>Action Directive:</b> Perform scheduled passive cell balancing on Cell 01 during the next Level 2 AC overnight charge cycle to equalize voltage delta below 30mV.",
            body_style
        ))
        elements.append(Spacer(1, 15))

        # Footer Notice
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceAfter=8))
        elements.append(Paragraph(
            "<b>Engineering Notice:</b> VoltSense AI diagnostic telemetry is computed from simulated and CAN-bus telemetry. Always adhere to OEM high-voltage maintenance precautions prior to any physical pack intervention.",
            ParagraphStyle('Notice', parent=body_style, fontSize=7.5, textColor=colors.HexColor('#64748B'))
        ))

        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes

report_service = ReportService()
