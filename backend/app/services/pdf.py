"""Generacion de PDFs para recetas y ordenes medicas.

Usa reportlab (pure Python, sin dependencias nativas) compatible con
Windows y Control de Aplicaciones.
"""
from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.core.config import get_settings
from app.models.enums import MedicalOrderType, PrescriptionStatus


settings = get_settings()
CLINIC_TZ = "America/Argentina/Buenos_Aires"


def _format_dt(dt: datetime) -> str:
    """Formatea datetime en zona de la clinica."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=datetime.now().astimezone().tzinfo)
    return dt.strftime("%d/%m/%Y %H:%M")


def _format_date(dt: datetime) -> str:
    """Formatea solo fecha en zona de la clinica."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=datetime.now().astimezone().tzinfo)
    return dt.strftime("%d/%m/%Y")


def _sha256_file(path: Path) -> str:
    """Calcula SHA256 de un archivo."""
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def _build_header_story(clinic_name: str = "Clinica Virtual"):
    """Construye el encabezado comun (logo/titulo)."""
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ClinicTitle",
        parent=styles["Heading1"],
        fontSize=16,
        textColor=colors.HexColor("#0C4A6E"),  # sky-900
        spaceAfter=2,
        alignment=1,  # center
    )
    subtitle_style = ParagraphStyle(
        "ClinicSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#475569"),  # slate-600
        spaceAfter=12,
        alignment=1,
    )
    return [
        Paragraph(clinic_name, title_style),
        Paragraph("Historia clinica digital", subtitle_style),
        Spacer(1, 6),
    ]


def _build_info_table(
    data: list[list[str]], col_widths: list[float] = None
) -> Table:
    """Crea una tabla de info con estilo consistente."""
    if col_widths is None:
        col_widths = [4 * cm, 14 * cm]
    table = Table(data, colWidths=col_widths)
    table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#475569")),
                ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#1E293B")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return table


def generate_prescription_pdf(
    prescription_data: dict[str, Any],
    output_path: Path,
) -> str:
    """Genera PDF de receta/indicacion medica.

    Args:
        prescription_data: Dict con claves:
            - folio, issued_at, status
            - doctor_snapshot: {name, license_number, specialty}
            - patient_snapshot: {name, dni, insurance_provider}
            - items: [{medication, dose, frequency, duration, instructions}]
            - cancel_reason (opcional)
        output_path: Path donde guardar el PDF

    Returns:
        SHA256 del archivo generado.
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    story = []

    # Encabezado
    story.extend(_build_header_story())

    # Linea separadora
    story.append(
        Table(
            [[""]],
            colWidths=[18 * cm],
            style=TableStyle(
                [
                    ("LINEBELOW", (0, 0), (-1, -1), 1.5, colors.HexColor("#0C4A6E")),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ]
            ),
        )
    )
    story.append(Spacer(1, 8))

    # Titulo del documento
    title_style = ParagraphStyle(
        "DocTitle",
        parent=getSampleStyleSheet()["Heading2"],
        fontSize=13,
        textColor=colors.HexColor("#0C4A6E"),
        alignment=1,
        spaceAfter=12,
    )
    legend = settings.PDF_FOOTER_LEGEND or "Indicacion medica"
    story.append(Paragraph(f"INDICACION MEDICA - {legend.upper()}", title_style))

    # Folio y fecha
    meta_data = [
        ["Folio:", prescription_data["folio"]],
        ["Fecha de emision:", _format_dt(prescription_data["issued_at"])],
        ["Estado:", prescription_data["status"].value if hasattr(prescription_data["status"], "value") else str(prescription_data["status"])],
    ]
    if prescription_data.get("cancel_reason"):
        meta_data.append(["Motivo de anulacion:", prescription_data["cancel_reason"]])
    story.append(_build_info_table(meta_data))
    story.append(Spacer(1, 10))

    # Datos del medico
    story.append(Paragraph("<b>Medico emisor</b>", styles["Heading3"]))
    doc_snap = prescription_data.get("doctor_snapshot", {})
    doc_data = [
        ["Nombre:", doc_snap.get("name", "—")],
        ["Matricula:", doc_snap.get("license_number", "—")],
        ["Especialidad:", doc_snap.get("specialty", "—")],
    ]
    story.append(_build_info_table(doc_data))
    story.append(Spacer(1, 10))

    # Datos del paciente
    story.append(Paragraph("<b>Paciente</b>", styles["Heading3"]))
    pat_snap = prescription_data.get("patient_snapshot", {})
    pat_data = [
        ["Nombre:", pat_snap.get("name", "—")],
        ["DNI:", pat_snap.get("dni", "—")],
        ["Obra social:", pat_snap.get("insurance_provider", "—")],
    ]
    story.append(_build_info_table(pat_data))
    story.append(Spacer(1, 12))

    # Items (medicamentos)
    story.append(Paragraph("<b>Medicamentos indicados</b>", styles["Heading3"]))

    items = prescription_data.get("items", [])
    table_data = [
        ["Medicamento", "Dosis", "Frecuencia", "Duracion", "Indicaciones"],
    ]
    for item in items:
        table_data.append(
            [
                item.get("medication", ""),
                item.get("dose", ""),
                item.get("frequency", ""),
                item.get("duration", ""),
                item.get("instructions", "") or "-",
            ]
        )

    items_table = Table(
        table_data,
        colWidths=[4.5 * cm, 2.5 * cm, 3.5 * cm, 2.5 * cm, 5 * cm],
        repeatRows=1,
    )
    items_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E0F2FE")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0C4A6E")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(items_table)
    story.append(Spacer(1, 16))

    # Pie de pagina con leyenda legal
    footer_style = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontSize=8,
        textColor=colors.HexColor("#64748B"),
        alignment=1,
        spaceBefore=20,
    )
    footer_text = (
        f"{settings.PDF_FOOTER_LEGEND}. "
        "Este documento es una indicacion medica. "
        "Para dispensacion de medicamentos sujetos a receta archivada, "
        "utilice la plataforma de receta electronica habilitada (Ley 27.553)."
    )
    story.append(Paragraph(footer_text, footer_style))

    # Generar PDF
    doc.build(story)

    return _sha256_file(output_path)


def generate_prescription_pdf_bytes(prescription_data: dict[str, Any]) -> bytes:
    """Genera PDF de receta y devuelve bytes (para almacenamiento en memoria)."""
    from io import BytesIO

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    story = []

    # Encabezado
    story.extend(_build_header_story())

    # Linea separadora
    story.append(
        Table(
            [[""]],
            colWidths=[18 * cm],
            style=TableStyle(
                [
                    ("LINEBELOW", (0, 0), (-1, -1), 1.5, colors.HexColor("#0C4A6E")),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ]
            ),
        )
    )
    story.append(Spacer(1, 8))

    # Titulo del documento
    title_style = ParagraphStyle(
        "DocTitle",
        parent=getSampleStyleSheet()["Heading2"],
        fontSize=13,
        textColor=colors.HexColor("#0C4A6E"),
        alignment=1,
        spaceAfter=12,
    )
    legend = settings.PDF_FOOTER_LEGEND or "Indicacion medica"
    story.append(Paragraph(f"INDICACION MEDICA - {legend.upper()}", title_style))

    # Folio y fecha
    meta_data = [
        ["Folio:", prescription_data["folio"]],
        ["Fecha de emision:", _format_dt(prescription_data["issued_at"])],
        ["Estado:", prescription_data["status"].value if hasattr(prescription_data["status"], "value") else str(prescription_data["status"])],
    ]
    if prescription_data.get("cancel_reason"):
        meta_data.append(["Motivo de anulacion:", prescription_data["cancel_reason"]])
    story.append(_build_info_table(meta_data))
    story.append(Spacer(1, 10))

    # Datos del medico
    story.append(Paragraph("<b>Medico emisor</b>", styles["Heading3"]))
    doc_snap = prescription_data.get("doctor_snapshot", {})
    doc_data = [
        ["Nombre:", doc_snap.get("name", "—")],
        ["Matricula:", doc_snap.get("license_number", "—")],
        ["Especialidad:", doc_snap.get("specialty", "—")],
    ]
    story.append(_build_info_table(doc_data))
    story.append(Spacer(1, 10))

    # Datos del paciente
    story.append(Paragraph("<b>Paciente</b>", styles["Heading3"]))
    pat_snap = prescription_data.get("patient_snapshot", {})
    pat_data = [
        ["Nombre:", pat_snap.get("name", "—")],
        ["DNI:", pat_snap.get("dni", "—")],
        ["Obra social:", pat_snap.get("insurance_provider", "—")],
    ]
    story.append(_build_info_table(pat_data))
    story.append(Spacer(1, 12))

    # Items (medicamentos)
    story.append(Paragraph("<b>Medicamentos indicados</b>", styles["Heading3"]))

    items = prescription_data.get("items", [])
    table_data = [
        ["Medicamento", "Dosis", "Frecuencia", "Duracion", "Indicaciones"],
    ]
    for item in items:
        table_data.append(
            [
                item.get("medication", ""),
                item.get("dose", ""),
                item.get("frequency", ""),
                item.get("duration", ""),
                item.get("instructions", "") or "-",
            ]
        )

    items_table = Table(
        table_data,
        colWidths=[4.5 * cm, 2.5 * cm, 3.5 * cm, 2.5 * cm, 5 * cm],
        repeatRows=1,
    )
    items_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E0F2FE")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0C4A6E")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(items_table)
    story.append(Spacer(1, 16))

    # Pie de pagina con leyenda legal
    footer_style = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontSize=8,
        textColor=colors.HexColor("#64748B"),
        alignment=1,
        spaceBefore=20,
    )
    footer_text = (
        f"{settings.PDF_FOOTER_LEGEND}. "
        "Este documento es una indicacion medica. "
        "Para dispensacion de medicamentos sujetos a receta archivada, "
        "utilice la plataforma de receta electronica habilitada (Ley 27.553)."
    )
    story.append(Paragraph(footer_text, footer_style))

    # Generar PDF
    doc.build(story)

    buffer.seek(0)
    return buffer.read()


def generate_medical_order_pdf_bytes(order_data: dict[str, Any]) -> bytes:
    """Genera PDF de orden medica y devuelve bytes."""
    from io import BytesIO

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    story = []

    # Encabezado
    story.extend(_build_header_story())

    # Linea separadora
    story.append(
        Table(
            [[""]],
            colWidths=[18 * cm],
            style=TableStyle(
                [
                    ("LINEBELOW", (0, 0), (-1, -1), 1.5, colors.HexColor("#0C4A6E")),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ]
            ),
        )
    )
    story.append(Spacer(1, 8))

    # Titulo
    type_labels = {
        MedicalOrderType.LAB.value: "ORDEN DE LABORATORIO",
        MedicalOrderType.IMAGING.value: "ORDEN DE IMAGENES",
        MedicalOrderType.REFERRAL.value: "ORDEN DE INTERCONSULTA",
        MedicalOrderType.OTHER.value: "ORDEN MEDICA",
    }
    title_style = ParagraphStyle(
        "DocTitle",
        parent=getSampleStyleSheet()["Heading2"],
        fontSize=13,
        textColor=colors.HexColor("#0C4A6E"),
        alignment=1,
        spaceAfter=12,
    )
    story.append(Paragraph(type_labels.get(order_data.get("type", "OTHER"), "ORDEN MEDICA"), title_style))

    # Folio y fecha
    meta_data = [
        ["Folio:", order_data["folio"]],
        ["Fecha de emision:", _format_dt(order_data["issued_at"])],
        ["Estado:", order_data["status"].value if hasattr(order_data["status"], "value") else str(order_data["status"])],
        ["Tipo:", type_labels.get(order_data.get("type", "OTHER"), "OTRO")],
    ]
    if order_data.get("cancel_reason"):
        meta_data.append(["Motivo de anulacion:", order_data["cancel_reason"]])
    story.append(_build_info_table(meta_data))
    story.append(Spacer(1, 10))

    # Datos del medico
    story.append(Paragraph("<b>Medico solicitante</b>", styles["Heading3"]))
    doc_snap = order_data.get("doctor_snapshot", {})
    doc_data = [
        ["Nombre:", doc_snap.get("name", "—")],
        ["Matricula:", doc_snap.get("license_number", "—")],
        ["Especialidad:", doc_snap.get("specialty", "—")],
    ]
    story.append(_build_info_table(doc_data))
    story.append(Spacer(1, 10))

    # Datos del paciente
    story.append(Paragraph("<b>Paciente</b>", styles["Heading3"]))
    pat_snap = order_data.get("patient_snapshot", {})
    pat_data = [
        ["Nombre:", pat_snap.get("name", "—")],
        ["DNI:", pat_snap.get("dni", "—")],
        ["Obra social:", pat_snap.get("insurance_provider", "—")],
    ]
    story.append(_build_info_table(pat_data))
    story.append(Spacer(1, 10))

    # Diagnostico presuntivo
    if order_data.get("presumptive_diagnosis"):
        story.append(Paragraph("<b>Diagnostico presuntivo</b>", styles["Heading3"]))
        diag_style = ParagraphStyle(
            "Diag", parent=styles["Normal"], fontSize=10, leading=14
        )
        story.append(Paragraph(order_data["presumptive_diagnosis"], diag_style))
        story.append(Spacer(1, 10))

    # Estudios solicitados
    story.append(Paragraph("<b>Estudios solicitados</b>", styles["Heading3"]))
    studies_style = ParagraphStyle(
        "Studies", parent=styles["Normal"], fontSize=10, leading=14
    )
    story.append(Paragraph(order_data["studies"].replace("\n", "<br/>"), studies_style))
    story.append(Spacer(1, 16))

    # Pie
    footer_style = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontSize=8,
        textColor=colors.HexColor("#64748B"),
        alignment=1,
        spaceBefore=20,
    )
    footer_text = (
        f"{settings.PDF_FOOTER_LEGEND}. "
        "Esta orden medica debe ser presentada en el prestador correspondiente."
    )
    story.append(Paragraph(footer_text, footer_style))

    doc.build(story)

    buffer.seek(0)
    return buffer.read()