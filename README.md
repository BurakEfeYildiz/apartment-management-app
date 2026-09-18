# Apartment Management App

A local apartment management application with a Turkish dashboard and SQLite-based financial tracking.

## Scope

- Local-only, single-administrator workflow
- Turkish dashboard for units, payments, arrears, budgets, expenses, decisions, documents, reports, and backups
- Dynamic `YYYY-MM` periods
- Separate aidat and demirbas accounting
- Safe migration from the legacy SQLite schema
- Excel used only for initial import and optional reporting

## Privacy

This public repository intentionally does not contain real residents, phone numbers, payments, source Excel files, database files, backups, generated reports, or uploaded documents. Put local operational files in the folders described by `KULLANIM_KILAVUZU.md`.

## Windows setup

1. Put the source workbook in `kaynak/ilk_veri.xlsx`.
2. Run `01_Ilk_Kurulum.bat` once.
3. Run `02_Paneli_Ac.bat` for daily use.
4. Use `03_Excelden_Yenile.bat` only after manually changing the source workbook.
