from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.schemas.public import PublicInvoiceResponse


def build_invoice_pdf(invoice: PublicInvoiceResponse) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "InvoiceTitle",
        parent=styles["Heading1"],
        fontSize=18,
        textColor=colors.HexColor(invoice.brand_color),
        spaceAfter=6,
    )
    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=12,
        spaceBefore=10,
        spaceAfter=4,
    )

    story: list[object] = [
        Paragraph(invoice.workshop_name, title_style),
    ]
    if invoice.workshop_address:
        story.append(Paragraph(invoice.workshop_address, styles["Normal"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(f"Invoice {invoice.invoice_number}", heading_style))
    story.append(Paragraph(f"Date: {invoice.completed_at}", styles["Normal"]))
    story.append(Spacer(1, 8))

    customer_rows = [
        ["Customer", invoice.customer_name],
        ["Phone", invoice.customer_phone],
        ["Vehicle", invoice.vehicle_number],
    ]
    if invoice.description:
        customer_rows.append(["Description", invoice.description])

    customer_table = Table(customer_rows, colWidths=[35 * mm, 130 * mm])
    customer_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(customer_table)
    story.append(Spacer(1, 10))

    line_rows = [["Item", "Qty", "Unit Price", "Total"]]
    for part in invoice.parts:
        line_rows.append(
            [
                part.name,
                f"{part.quantity:g}",
                f"{part.unit_price:,.2f}",
                f"{part.line_total:,.2f}",
            ]
        )
    line_rows.extend(
        [
            ["Labour", "", "", f"{invoice.labour_charge:,.2f}"],
            ["Parts (summary)", "", "", f"{invoice.parts_charge:,.2f}"],
            ["Total", "", "", f"{invoice.total_amount:,.2f}"],
        ]
    )

    lines_table = Table(line_rows, colWidths=[80 * mm, 20 * mm, 30 * mm, 35 * mm])
    lines_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(invoice.brand_color)),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -2), 0.25, colors.grey),
                ("LINEABOVE", (0, -1), (-1, -1), 1, colors.black),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(lines_table)

    if invoice.workshop_bank_details:
        story.append(Spacer(1, 12))
        story.append(Paragraph("Bank Details", heading_style))
        story.append(Paragraph(invoice.workshop_bank_details.replace("\n", "<br/>"), styles["Normal"]))

    if invoice.workshop_invoice_footer:
        story.append(Spacer(1, 12))
        story.append(Paragraph(invoice.workshop_invoice_footer, styles["Italic"]))

    doc.build(story)
    return buffer.getvalue()
