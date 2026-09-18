from __future__ import annotations

from pathlib import Path


def _font_name():
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont

    candidates = [
        Path(r"C:\Windows\Fonts\arial.ttf"),
        Path(r"C:\Windows\Fonts\calibri.ttf"),
        Path("/System/Library/Fonts/Supplemental/Arial.ttf"),
        Path("/Library/Fonts/Arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            name = "ApartmanArial"
            if name not in pdfmetrics.getRegisteredFontNames():
                pdfmetrics.registerFont(TTFont(name, str(candidate)))
            return name
    return "Helvetica"


def _build_document(path: Path, title: str, lines: list[str]) -> Path:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

    path.parent.mkdir(parents=True, exist_ok=True)
    font = _font_name()
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("Baslik", parent=styles["Title"], fontName=font, fontSize=16, leading=20, spaceAfter=10)
    body_style = ParagraphStyle("Gövde", parent=styles["BodyText"], fontName=font, fontSize=10, leading=14, spaceAfter=5)
    story = [Paragraph(title, title_style), Spacer(1, 4 * mm)]
    for line in lines:
        story.append(Paragraph(line.replace("&", "&amp;"), body_style))
    SimpleDocTemplate(str(path), pagesize=A4, rightMargin=20 * mm, leftMargin=20 * mm, topMargin=18 * mm, bottomMargin=18 * mm).build(story)
    return path


def create_payment_receipt(output_dir: Path, receipt_no: str, unit_number: int, resident_name: str, payment_date: str, amount: float, charge_label: str, period_key: str) -> Path:
    path = output_dir / f"{receipt_no}.pdf"
    return _build_document(
        path,
        "Tahsilat Makbuzu",
        [
            f"Makbuz No: {receipt_no}",
            f"Daire: {unit_number}",
            f"Ad Soyad: {resident_name}",
            f"Tarih: {payment_date}",
            f"Tutar: {amount:,.2f} TL",
            f"Odeme Turu: {charge_label}",
            f"Ilgili Donem: {period_key}",
        ],
    )


def create_debt_notice(output_dir: Path, unit_number: int, resident_name: str, rows: list[dict], document_date: str) -> Path:
    path = output_dir / f"borc_bildirimi_daire_{unit_number}_{document_date}.pdf"
    lines = [f"Daire: {unit_number}", f"Kisi: {resident_name}", f"Belge Tarihi: {document_date}", "", "Odenmeyen donemler:"]
    for row in rows:
        lines.append(f"{row['period_key']} - {row['charge_type']} - Kalan: {row['remaining_cents'] / 100:,.2f} TL")
    lines.append("Odemenizi apartman yonetimine iletmenizi rica ederiz.")
    return _build_document(path, "Borc Bildirimi", lines)
