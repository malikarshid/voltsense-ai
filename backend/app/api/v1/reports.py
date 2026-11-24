from fastapi import APIRouter, Response, HTTPException
from app.services.report_service import report_service
from app.services.simulator_service import simulator

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/{vehicle_id}/pdf")
async def download_pdf_report(vehicle_id: str):
    """Generates and streams a professional battery health diagnostic PDF."""
    pdf_bytes = report_service.generate_battery_health_pdf(
        vehicle_name="VoltSense Model GT",
        vin="KA05ER7777",
        soh=simulator.soh,
        soc=simulator.soc,
        health_score=86,
        cycle_count=238,
        total_voltage=simulator.pack_voltage,
        avg_temperature=simulator.avg_temperature,
        total_impedance=simulator.total_impedance,
        predicted_rul=456
    )
    
    filename = f"VoltSense_Battery_Report_{vehicle_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
