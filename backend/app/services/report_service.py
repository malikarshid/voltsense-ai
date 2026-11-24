import io
import os
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
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
        predicted_rul: int = 456,
        cells_data: Optional[List[Dict[str, Any]]] = None
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
            fontSize=20,
            textColor=colors.HexColor('#0B1220'),
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'VoltSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9.5,
            textColor=colors.HexColor('#32B96F'),
            spaceAfter=12
        )
        section_style = ParagraphStyle(
            'VoltSection',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=12,
            textColor=colors.HexColor('#111B2B'),
            spaceBefore=10,
            spaceAfter=5
        )
        body_style = ParagraphStyle(
            'VoltBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            textColor=colors.HexColor('#263449'),
            leading=12
        )

        elements = []

        # Header Title
        elements.append(Paragraph("VOLTSENSE AI — BATTERY HEALTH & DIAGNOSTIC REPORT", title_style))
        elements.append(Paragraph(
            f"Generated on {datetime.now(timezone.utc).strftime('%B %d, %Y - %H:%M:%S UTC')} | Telemetry Source: CAN-BMS 2.0B Interface | Vehicle: {vehicle_name} ({vin})",
            subtitle_style
        ))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#55D889'), spaceAfter=12))

        # Vehicle Information Section
        elements.append(Paragraph("1. Vehicle & Battery Specifications", section_style))
        vehicle_data = [
            ["Vehicle Model:", vehicle_name, "VIN:", vin],
            ["Battery Chemistry:", "NMC (Lithium Nickel Manganese Cobalt)", "Nominal Pack Voltage:", f"{total_voltage} V"],
            ["Original Design Capacity:", f"{original_capacity} Ah ({design_capacity} Ah design max)", "Current Measured Capacity:", f"{current_capacity} Ah"],
            ["Total Completed Cycles:", f"{cycle_count} Cycles", "Pack Operating Status:", "Active / Normal"]
        ]
        t_vehicle = Table(vehicle_data, colWidths=[130, 140, 140, 130])
        t_vehicle.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F4F7FB')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#111B2B')),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1D9E4')),
        ]))
        elements.append(t_vehicle)
        elements.append(Spacer(1, 10))

        # Key Metrics Table
        elements.append(Paragraph("2. Primary State of Health (SOH) & State of Charge (SOC)", section_style))
        status_label = "OPTIMAL (PASS)" if soh >= 80.0 else ("FAIR" if soh >= 70.0 else "DEGRADED (ACTION REQ)")
        metrics_data = [
            ["Metric Parameter", "Measured Value", "Target / Design Threshold", "Engineering Status"],
            ["State of Health (SOH)", f"{soh}%", ">= 80.0% (Automotive EOL Limit)", status_label],
            ["State of Charge (SOC)", f"{soc}%", "20.0% - 80.0% Optimal Range", "NORMAL OPERATION"],
            ["Battery Health Score", f"{health_score} / 100", ">= 80 Good Condition", "ACCEPTABLE"],
            ["Average Operating Temp", f"{avg_temperature} °C", "15.0°C - 45.0°C Optimal Thermal Range", "NORMAL THERMAL"],
            ["Pack Total Impedance", f"{total_impedance} Ω", "< 0.1500 Ω Pack Resistance", "ACCEPTABLE"],
            ["AI Predicted RUL", f"{predicted_rul} Cycles", "Remaining to 70% Capacity Retention", "ON DESIGN TARGET"]
        ]
        t_metrics = Table(metrics_data, colWidths=[150, 110, 160, 120])
        t_metrics.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#111B2B')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1D9E4')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')])
        ]))
        elements.append(t_metrics)
        elements.append(Spacer(1, 10))

        # Cell Diagnostics Table
        elements.append(Paragraph("3. Cell Level Diagnostics (Sub-Module Matrix)", section_style))
        cell_table = [["Cell ID", "Voltage (V)", "Temp (°C)", "Impedance (Ω)", "Status", "Notes"]]
        if cells_data and len(cells_data) > 0:
            for c in cells_data:
                cell_table.append([
                    f"Cell {c.get('cell_index', 1):02d}",
                    f"{c.get('voltage', 3.6):.2f} V",
                    f"{c.get('temperature', 23.5):.1f} °C",
                    f"{c.get('internal_resistance', 0.015):.4f} Ω",
                    c.get('status', 'HEALTHY'),
                    "Nominal balance" if c.get('status') == 'HEALTHY' else "Imbalance detected; balancing active"
                ])
        else:
            cell_table.append(["Cell 01", f"{total_voltage/10:.2f} V", f"{avg_temperature:.1f} °C", f"{total_impedance/10:.4f} Ω", "HEALTHY", "Nominal pack balance"])

        t_cells = Table(cell_table, colWidths=[55, 75, 75, 80, 75, 180])
        t_cells.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#172337')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 7.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1D9E4')),
        ]))
        elements.append(t_cells)
        elements.append(Spacer(1, 10))

        # Directives
        elements.append(Paragraph("4. AI Predictive Analytics & Maintenance Directives", section_style))
        elements.append(Paragraph(
            f"• <b>Capacity Fade Trajectory:</b> Measured SOH is {soh}%. Estimated capacity loss is {round(original_capacity - current_capacity, 1)} Ah ({round(((original_capacity - current_capacity)/original_capacity)*100, 1)}%). The pack is projected to operate safely for approximately {predicted_rul} further equivalent full cycles before reaching the 70.0% second-life transition boundary.<br/>"
            f"• <b>Thermal Stability:</b> Core pack temperature average is {avg_temperature}°C, remaining inside the optimal 15°C - 45°C boundary.<br/>"
            "• <b>Balancing Directive:</b> Maintain standard CC-CV charge termination and periodic Level 2 cell equalisation to prevent intra-pack delta-V dispersion.",
            body_style
        ))
        elements.append(Spacer(1, 12))

        # Footer Notice
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceAfter=6))
        elements.append(Paragraph(
            "<b>Engineering Disclaimer:</b> VoltSense AI diagnostic telemetry is computed from simulated and CAN-bus telemetry. Always adhere to OEM high-voltage maintenance safety standards before manual pack intervention.",
            ParagraphStyle('Notice', parent=body_style, fontSize=7, textColor=colors.HexColor('#64748B'))
        ))

        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes

report_service = ReportService()
