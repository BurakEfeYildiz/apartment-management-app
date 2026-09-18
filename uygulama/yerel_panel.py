#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import webbrowser
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from uygulama_cekirdegi import (
    BASE_DIR,
    DEFAULT_DB_PATH,
    DEFAULT_IMPORT_XLSX,
    ApartmentRepository,
)


STATIC_DIR = BASE_DIR / "panel"
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8765


def parse_args():
    parser = argparse.ArgumentParser(description="Apartman Yonetim Uygulamasi yerel paneli")
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--db", type=Path, default=DEFAULT_DB_PATH)
    parser.add_argument("--seed-excel", type=Path, default=DEFAULT_IMPORT_XLSX)
    parser.add_argument("--no-browser", action="store_true")
    parser.add_argument("--force-reimport", action="store_true")
    return parser.parse_args()


class PanelApp:
    def __init__(self, db_path: Path, seed_excel: Path, force_reimport: bool):
        self.repo = ApartmentRepository(db_path.resolve())
        self.seed_excel = seed_excel.resolve()
        self.force_reimport = force_reimport

    def boot(self) -> dict:
        self.repo.initialize()
        seeded = {"durum": "mevcut_veri_korundu"}
        if self.force_reimport or not self.repo.has_seed_data():
            seeded = self.repo.import_from_excel(self.seed_excel, replace_existing=self.force_reimport)
            seeded["durum"] = "excelden_ilk_aktarim_yapildi"
        return seeded


APP: PanelApp | None = None


class PanelHandler(BaseHTTPRequestHandler):
    server_version = "ApartmanYonetimUygulamasi/3.0"

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/":
            return self._send_file(STATIC_DIR / "index.html", "text/html; charset=utf-8")
        if parsed.path == "/style.css":
            return self._send_file(STATIC_DIR / "style.css", "text/css; charset=utf-8")
        if parsed.path == "/app.js":
            return self._send_file(STATIC_DIR / "app.js", "application/javascript; charset=utf-8")
        if parsed.path == "/logo.png":
            return self._send_file(BASE_DIR.parent / "logo.png", "image/png")
        if parsed.path == "/api/dashboard":
            return self._send_json(APP.repo.dashboard())
        if parsed.path == "/api/inspector":
            return self._send_json(APP.repo.inspector_report())
        if parsed.path == "/api/decisions":
            return self._send_json({"items": APP.repo.get_decisions()})
        if parsed.path == "/api/documents":
            return self._send_json({"items": APP.repo.get_documents()})
        if parsed.path == "/api/backups":
            return self._send_json({"items": APP.repo.list_backups()})
        if parsed.path == "/api/late-fee-settings":
            return self._send_json(APP.repo.get_late_fee_settings())
        if parsed.path == "/api/account":
            query = parse_qs(parsed.query)
            return self._send_json(APP.repo.get_account(int(query.get("unit_id", [0])[0])))
        if parsed.path.startswith("/api/document/"):
            document_id = int(parsed.path.rsplit("/", 1)[-1])
            path, mime_type = APP.repo.get_document_path(document_id)
            return self._send_file(path, mime_type)
        self.send_error(HTTPStatus.NOT_FOUND, "Bulunamadi")

    def do_POST(self):
        parsed = urlparse(self.path)
        try:
            payload = self._read_json()
            if parsed.path == "/api/payment":
                result = APP.repo.add_payment(
                    unit_id=int(payload["unit_id"]),
                    charge_type=str(payload["charge_type"]),
                    period_key=str(payload.get("period_key") or payload.get("month_key")),
                    amount=payload["amount"],
                    payment_date=str(payload.get("payment_date") or "") or None,
                    payment_method=str(payload.get("payment_method") or "banka"),
                    note=str(payload.get("note") or ""),
                )
                return self._send_json({"ok": True, **result})
            if parsed.path == "/api/phone":
                result = APP.repo.update_phone(int(payload["unit_id"]), str(payload["phone"]))
                return self._send_json({"ok": True, **result})
            if parsed.path == "/api/unit-exemptions":
                result = APP.repo.update_unit_exemptions(int(payload["unit_id"]), bool(payload.get("aidat_muaf")), bool(payload.get("demirbas_muaf")))
                return self._send_json({"ok": True, **result})
            if parsed.path == "/api/expense":
                result = APP.repo.add_expense(
                    expense_date=str(payload["expense_date"]),
                    vendor=str(payload["vendor"]),
                    description=str(payload["description"]),
                    category=str(payload["category"]),
                    budget_type=str(payload["budget_type"]),
                    amount=payload["amount"],
                    document_no=str(payload.get("document_no") or ""),
                    document_id=int(payload["document_id"]) if payload.get("document_id") else None,
                )
                return self._send_json({"ok": True, **result})
            if parsed.path == "/api/export-excel":
                return self._send_json({"ok": True, **APP.repo.export_excel_snapshot()})
            if parsed.path == "/api/period":
                return self._send_json({"ok": True, **APP.repo.add_period(str(payload["period_key"]))})
            if parsed.path == "/api/budget":
                return self._send_json({"ok": True, **APP.repo.save_annual_budget(int(payload["year"]), payload["aidat"], payload["demirbas"])})
            if parsed.path == "/api/debt-notice":
                return self._send_json({"ok": True, **APP.repo.create_debt_notice(int(payload["unit_id"]))})
            if parsed.path == "/api/late-fee-settings":
                return self._send_json({"ok": True, **APP.repo.save_late_fee_settings(bool(payload.get("enabled")), payload.get("rate", 0), str(payload.get("calculation_method") or "simple_monthly"), payload.get("effective_date"))})
            if parsed.path == "/api/decisions":
                return self._send_json({"ok": True, **APP.repo.save_decision(str(payload["decision_no"]), str(payload["decision_date"]), str(payload["title"]), str(payload["body"]), int(payload["id"]) if payload.get("id") else None)})
            if parsed.path == "/api/decisions/delete":
                return self._send_json({"ok": True, **APP.repo.delete_decision(int(payload["id"]))})
            if parsed.path == "/api/documents":
                return self._send_json({"ok": True, **APP.repo.save_document(str(payload["document_type"]), str(payload["file_name"]), str(payload.get("mime_type") or "application/octet-stream"), str(payload["content_base64"]), int(payload["unit_id"]) if payload.get("unit_id") else None, int(payload["decision_id"]) if payload.get("decision_id") else None)})
            if parsed.path == "/api/backup":
                return self._send_json({"ok": True, **APP.repo.create_backup()})
            if parsed.path == "/api/restore":
                return self._send_json({"ok": True, **APP.repo.restore_backup(str(payload["name"]))})
            self.send_error(HTTPStatus.NOT_FOUND, "Bulunamadi")
        except Exception as exc:
            return self._send_json({"ok": False, "error": str(exc)}, status=HTTPStatus.BAD_REQUEST)

    def log_message(self, format, *args):
        return

    def _read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length).decode("utf-8") if length else "{}"
        return json.loads(body)

    def _send_json(self, payload: dict, status: HTTPStatus = HTTPStatus.OK):
        body = json.dumps(payload, ensure_ascii=False, default=str).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, path: Path, content_type: str):
        if not path.exists():
            self.send_error(HTTPStatus.NOT_FOUND, "Bulunamadi")
            return
        body = path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    global APP
    args = parse_args()
    APP = PanelApp(args.db, args.seed_excel, args.force_reimport)
    boot_result = APP.boot()
    url = f"http://{args.host}:{args.port}"

    print("Apartman Yonetim Uygulamasi V3 hazir.")
    print(f"Panel adresi: {url}")
    print(f"Acilis durumu: {boot_result['durum']}")
    print("Not: Canli veriler donem bazli veritabaninda tutulur, Excel sadece aktarim ve rapor icin kullanilir.")

    if not args.no_browser:
        try:
            webbrowser.open(url)
        except Exception:
            pass

    server = ThreadingHTTPServer((args.host, args.port), PanelHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nPanel kapatildi.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
