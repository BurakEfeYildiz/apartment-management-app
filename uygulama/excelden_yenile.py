#!/usr/bin/env python3
from __future__ import annotations

import shutil
from datetime import datetime

from uygulama_cekirdegi import DEFAULT_DB_PATH, DEFAULT_IMPORT_XLSX, ApartmentRepository


def main() -> int:
    if not DEFAULT_IMPORT_XLSX.exists():
        print(f"Kaynak Excel bulunamadi: {DEFAULT_IMPORT_XLSX}")
        return 1

    DEFAULT_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    yedek_klasoru = DEFAULT_DB_PATH.parent / "yedekler"
    yedek_klasoru.mkdir(parents=True, exist_ok=True)

    if DEFAULT_DB_PATH.exists():
        zaman = datetime.now().strftime("%Y%m%d_%H%M%S")
        yedek_yolu = yedek_klasoru / f"apartman_{zaman}.db"
        shutil.copy2(DEFAULT_DB_PATH, yedek_yolu)
        print(f"Mevcut veri yedeklendi: {yedek_yolu.name}")

    repo = ApartmentRepository(DEFAULT_DB_PATH)
    repo.initialize()
    sonuc = repo.import_from_excel(DEFAULT_IMPORT_XLSX, replace_existing=True)

    print("Excel verileri uygulamaya aktarildi.")
    print(f"Daire sayisi: {sonuc['units']}")
    print(f"Borc kaydi: {sonuc['obligations']}")
    print(f"Gider kaydi: {sonuc['expenses']}")
    print("Simdi 02_Paneli_Ac.bat dosyasini calistirabilirsin.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
