const durum = { veri: null, daireler: [], kararlar: [], evraklar: [] };
const menuDugmeleri = Array.from(document.querySelectorAll(".nav-item"));

const para = (deger) => `${new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(deger || 0))} TL`;
const oran = (deger) => new Intl.NumberFormat("tr-TR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Number(deger || 0));
const kacis = (deger) => String(deger ?? "").replace(/[&<>"']/g, (karakter) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[karakter]));

async function api(adres, secenekler = {}) {
  const yanit = await fetch(adres, { headers: { "Content-Type": "application/json" }, ...secenekler });
  const veri = await yanit.json();
  if (!yanit.ok || veri.ok === false) throw new Error(veri.error || "Islem basarisiz.");
  return veri;
}

function mesajYaz(mesaj, hata = false) {
  const alan = document.getElementById("durumMesaji");
  alan.textContent = mesaj;
  alan.style.color = hata ? "#b42318" : "#315fa8";
}

function secimDoldur(kimlik, liste, etiket, deger) {
  const alan = document.getElementById(kimlik);
  if (!alan) return;
  alan.innerHTML = liste.map((oge) => `<option value="${kacis(deger(oge))}">${kacis(etiket(oge))}</option>`).join("");
}

function finansKartlariniCiz() {
  ["aidat", "demirbas"].forEach((tur) => {
    const veri = durum.veri[tur];
    document.getElementById(`${tur}Tahakkuk`).textContent = para(veri.accrual);
    document.getElementById(`${tur}Tahsilat`).textContent = para(veri.paid);
    document.getElementById(`${tur}Bekleyen`).textContent = para(veri.remaining);
    document.getElementById(`${tur}Gecikmis`).textContent = para(veri.overdue);
    document.getElementById(`${tur}Gider`).textContent = para(veri.expense);
    document.getElementById(`${tur}Oran`).textContent = oran(veri.rate);
  });
  document.getElementById("aktifDonem").textContent = durum.veri.current_period;
}

function takipPaneliniCiz() {
  const takip = durum.veri.tracking;
  const satirlar = [
    ["Aidat tahsilat riski", takip.aidat_risk, true],
    ["Demirbas tahsilat riski", takip.demirbas_risk, true],
    ["Eksik telefon", takip.missing_phone_count, false],
    ["Muaf daire", takip.exempt_count, false],
    ["Odenmeyen donem", takip.overdue_period_count, false],
  ];
  document.getElementById("aksiyonOzeti").textContent = `${satirlar.length} kontrol`;
  document.getElementById("aksiyonListesi").innerHTML = satirlar.map(([baslik, deger, paraMi]) => `<div class="action-item"><div><strong>${baslik}</strong><small>Donem bazli otomatik hesap</small></div><div class="action-number">${paraMi ? para(deger) : deger}</div></div>`).join("");
}

function donemleriCiz() {
  const satirlar = durum.veri.periods || [];
  document.getElementById("donemlerTablosu").innerHTML = satirlar.map((satir) => `<tr><td><strong>${kacis(satir.key)}</strong><small class="table-subtitle">${kacis(satir.label)}</small></td><td><span class="pill ${satir.status === "gecmis" ? "warn" : satir.status === "aktif" ? "active" : "ok"}">${kacis(satir.status)}</span></td><td>${para(satir.aidat.accrual)}</td><td>${para(satir.aidat.remaining)}</td><td>${para(satir.demirbas.accrual)}</td><td>${para(satir.demirbas.remaining)}</td></tr>`).join("");
  const grafik = document.getElementById("donemGrafikleri");
  const max = Math.max(...satirlar.map((satir) => Math.max(satir.aidat.accrual, satir.demirbas.accrual)), 1);
  grafik.innerHTML = satirlar.slice(-8).map((satir) => `<div class="bar-row"><span>${kacis(satir.key)}</span><div class="bar-track"><i class="bar-aidat" style="width:${(satir.aidat.paid / max) * 100}%"></i><i class="bar-demirbas" style="width:${(satir.demirbas.paid / max) * 100}%"></i></div><strong>${para(satir.aidat.paid + satir.demirbas.paid)}</strong></div>`).join("");
}

function daireleriCiz() {
  document.getElementById("dairelerTablosu").innerHTML = durum.daireler.map((daire) => `<tr><td>${daire.daire}</td><td>${kacis(daire.isim)}</td><td>${kacis(daire.durum)}</td><td><input class="satir-telefon" data-id="${daire.id}" value="${kacis(daire.phone)}"></td><td><input class="muaf-checkbox satir-aidat-muaf" data-id="${daire.id}" type="checkbox" ${daire.aidat_muaf ? "checked" : ""}></td><td><input class="muaf-checkbox satir-demirbas-muaf" data-id="${daire.id}" type="checkbox" ${daire.demirbas_muaf ? "checked" : ""}></td><td><button class="small-btn daireKaydet" data-id="${daire.id}" type="button">Kaydet</button></td></tr>`).join("");
  document.querySelectorAll(".daireKaydet").forEach((button) => button.addEventListener("click", () => daireKaydet(button.dataset.id)));
}

function borclulariCiz() {
  document.getElementById("borclularTablosu").innerHTML = durum.veri.debtors.map((borclu) => `<tr><td>${borclu.daire}</td><td>${kacis(borclu.isim)}</td><td>${borclu.aidat_periodleri.map(kacis).join(", ") || "-"}</td><td>${borclu.demirbas_periodleri.map(kacis).join(", ") || "-"}</td><td>${borclu.overdue_period_count}</td><td>${kacis(borclu.telefon || "-")}</td><td class="message-cell">${kacis(borclu.message)}</td><td class="button-stack"><button class="small-btn mesajKopyala" data-id="${borclu.unit_id}" type="button">Kopyala</button><button class="small-btn whatsappAc" data-id="${borclu.unit_id}" type="button">WhatsApp</button><button class="small-btn borcPdf" data-id="${borclu.unit_id}" type="button">PDF</button></td></tr>`).join("");
  document.querySelectorAll(".mesajKopyala").forEach((button) => button.addEventListener("click", () => mesajKopyala(button.dataset.id)));
  document.querySelectorAll(".whatsappAc").forEach((button) => button.addEventListener("click", () => whatsappAc(button.dataset.id)));
  document.querySelectorAll(".borcPdf").forEach((button) => button.addEventListener("click", () => borcPdf(button.dataset.id)));
}

function giderGruplariniCiz() {
  document.getElementById("giderGruplari").innerHTML = durum.veri.expense_groups.map((grup) => `<details class="expense-group"><summary><span>${kacis(grup.category)} / ${kacis(grup.budget_type)}</span><strong>${para(grup.total)}</strong></summary><div class="expense-detail-list">${grup.items.map((item) => `<div><span>${kacis(item.vendor)} - ${kacis(item.description)}</span><strong>${para(item.amount)}</strong></div>`).join("")}</div></details>`).join("");
}

function secenekleriCiz() {
  secimDoldur("odemeDaireSecimi", durum.daireler, (item) => `${item.daire} - ${item.isim}`, (item) => item.id);
  secimDoldur("cariDaireSecimi", durum.daireler, (item) => `${item.daire} - ${item.isim}`, (item) => item.id);
  const evrakDaireSecimi = document.getElementById("evrakDaireSecimi");
  evrakDaireSecimi.innerHTML = `<option value="">Genel belge</option>${durum.daireler.map((item) => `<option value="${kacis(item.id)}">${kacis(`${item.daire} - ${item.isim}`)}</option>`).join("")}`;
  const belgeTuru = durum.veri.options.document_types || [];
  secimDoldur("evrakTuruSecimi", belgeTuru, (item) => item, (item) => item);
  secimDoldur("giderKategoriSecimi", durum.veri.options.expense_categories, (item) => item, (item) => item);
  secimDoldur("giderButceSecimi", durum.veri.options.budget_types, (item) => item, (item) => item);
  donemSeciminiDoldur();
}

function donemSeciminiDoldur() {
  const tur = document.getElementById("odemeTuruSecimi").value;
  const donemler = durum.veri.periods.filter((donem) => donem[tur].accrual > 0 || donem.status !== "gecmis");
  secimDoldur("odemeDonemSecimi", donemler, (item) => `${item.key} - ${item.label}`, (item) => item.key);
}

async function daireKaydet(id) {
  const daire = durum.daireler.find((item) => String(item.id) === String(id));
  const telefon = document.querySelector(`.satir-telefon[data-id="${id}"]`).value;
  const aidatMuaf = document.querySelector(`.satir-aidat-muaf[data-id="${id}"]`).checked;
  const demirbasMuaf = document.querySelector(`.satir-demirbas-muaf[data-id="${id}"]`).checked;
  try {
    await api("/api/phone", { method: "POST", body: JSON.stringify({ unit_id: id, phone: telefon }) });
    await api("/api/unit-exemptions", { method: "POST", body: JSON.stringify({ unit_id: id, aidat_muaf: aidatMuaf, demirbas_muaf: demirbasMuaf }) });
    mesajYaz(`${daire.daire} numarali daire guncellendi.`); await paneliYukle();
  } catch (hata) { mesajYaz(hata.message, true); }
}

async function mesajKopyala(id) {
  const borclu = durum.veri.debtors.find((item) => String(item.unit_id) === String(id));
  if (!borclu) return;
  try {
    await navigator.clipboard.writeText(borclu.message);
    mesajYaz("Hazir mesaj panoya kopyalandi.");
  } catch (hata) {
    mesajYaz("Mesaj panoya kopyalanamadi; metni tablodan alabilirsiniz.", true);
  }
}

function whatsappAc(id) {
  const borclu = durum.veri.debtors.find((item) => String(item.unit_id) === String(id));
  if (!borclu) return;
  const telefon = String(borclu.telefon || "").replace(/\D/g, "").replace(/^0/, "90");
  if (!telefon) { mesajYaz("Bu daire icin telefon numarasi bulunmuyor.", true); return; }
  window.open(`https://wa.me/${telefon}?text=${encodeURIComponent(borclu.message)}`, "_blank");
}

async function borcPdf(id) {
  try { const sonuc = await api("/api/debt-notice", { method: "POST", body: JSON.stringify({ unit_id: id }) }); mesajYaz(sonuc.path ? "Borc bildirimi PDF olarak hazirlandi." : "Borc bildirimi icin PDF bagimliligi eksik.", !sonuc.path); } catch (hata) { mesajYaz(hata.message, true); }
}

async function cariHesapYukle(id) {
  if (!id) return;
  try { const veri = await api(`/api/account?unit_id=${encodeURIComponent(id)}`); document.getElementById("cariHesapTablosu").innerHTML = veri.movements.map((item) => `<tr><td>${kacis(item.movement_date)}</td><td>${kacis(item.movement_type)}</td><td>${kacis(item.charge_label || "Genel")}</td><td>${kacis(item.period_key || "-")}</td><td>${para(item.amount)}</td><td>${kacis(item.description)}</td></tr>`).join(""); } catch (hata) { mesajYaz(hata.message, true); }
}

function butceleriCiz() {
  document.getElementById("butceListesi").innerHTML = durum.veri.budgets.map((butce) => `<div class="budget-row"><span>${butce.year}</span><span>Aidat ${para(butce.aidat)}<small>Beklenen yillik: ${para(butce.aidat_beklenen_yillik)}</small></span><span>Demirbas ${para(butce.demirbas)}<small>Beklenen yillik: ${para(butce.demirbas_beklenen_yillik)}</small></span></div>`).join("") || `<p class="muted">Henuz butce tanimi yok.</p>`;
}

async function denetciYukle() {
  try { const veri = await api("/api/inspector"); document.getElementById("denetciKartlari").innerHTML = [["Aidat tahsilat orani", oran(veri.aidat_tahsilat_orani)], ["Demirbas tahsilat orani", oran(veri.demirbas_tahsilat_orani)], ["Kasa durumu", para(veri.kasa_bakiyesi)], ["Banka durumu", veri.banka_bakiyesi == null ? "Ayrı tutulmuyor" : para(veri.banka_bakiyesi)], ["Belgesiz gider", veri.belgesiz_gider_sayisi], ["Eksik telefon", veri.telefonu_eksik_kayit]].map(([baslik, deger]) => `<div class="audit-card"><small>${baslik}</small><strong>${deger}</strong></div>`).join(""); } catch (hata) { mesajYaz(hata.message, true); }
}

async function kararlarYukle() {
  const veri = await api("/api/decisions"); durum.kararlar = veri.items; document.getElementById("kararListesi").innerHTML = durum.kararlar.map((karar) => `<article class="decision-item"><div><strong>${kacis(karar.decision_no)} - ${kacis(karar.title)}</strong><small>${kacis(karar.decision_date)}</small><p>${kacis(karar.body)}</p></div><button class="small-btn kararSil" data-id="${karar.id}" type="button">Sil</button></article>`).join(""); document.querySelectorAll(".kararSil").forEach((button) => button.addEventListener("click", () => kararSil(button.dataset.id)));
}

async function evraklariYukle() {
  const veri = await api("/api/documents"); durum.evraklar = veri.items; document.getElementById("evrakListesi").innerHTML = durum.evraklar.map((evrak) => `<div class="document-row"><span>${kacis(evrak.document_type)} - ${kacis(evrak.file_name)}</span><a href="/api/document/${evrak.id}" target="_blank">Ac</a></div>`).join("") || `<p class="muted">Henuz evrak yok.</p>`;
}

async function yedekleriYukle() {
  const veri = await api("/api/backups"); document.getElementById("yedekSecimi").innerHTML = veri.items.map((yedek) => `<option value="${kacis(yedek.name)}">${kacis(yedek.name)} - ${kacis(yedek.modified)}</option>`).join("") || `<option value="">Yedek yok</option>`;
}

async function paneliYukle() {
  durum.veri = await api("/api/dashboard"); durum.daireler = durum.veri.apartments; finansKartlariniCiz(); takipPaneliniCiz(); donemleriCiz(); daireleriCiz(); borclulariCiz(); giderGruplariniCiz(); secenekleriCiz(); butceleriCiz(); await cariHesapYukle(document.getElementById("cariDaireSecimi").value); await denetciYukle(); await kararlarYukle(); await evraklariYukle(); await yedekleriYukle(); mesajYaz("Veriler guncellendi.");
}

function formBagla(kimlik, adres, sonrasi) {
  document.getElementById(kimlik).addEventListener("submit", async (olay) => { olay.preventDefault(); try { const form = olay.currentTarget; const veri = Object.fromEntries(new FormData(form).entries()); if (veri.enabled !== undefined) veri.enabled = form.elements.enabled.checked; mesajYaz("Kaydediliyor..."); const sonuc = await api(adres, { method: "POST", body: JSON.stringify(veri) }); form.reset(); await paneliYukle(); mesajYaz(sonuc.message || "Kaydedildi."); if (sonrasi) sonrasi(sonuc); } catch (hata) { mesajYaz(hata.message, true); } });
}

document.getElementById("yenileButonu").addEventListener("click", () => paneliYukle().catch((hata) => mesajYaz(hata.message, true)));
document.getElementById("yedekButonu").addEventListener("click", async () => { try { const sonuc = await api("/api/backup", { method: "POST", body: "{}" }); await yedekleriYukle(); mesajYaz(`${sonuc.name} adli yedek olusturuldu.`); } catch (hata) { mesajYaz(hata.message, true); } });
document.getElementById("excelRaporButonu").addEventListener("click", async () => { try { mesajYaz("Excel raporu olusturuluyor..."); const sonuc = await api("/api/export-excel", { method: "POST", body: "{}" }); mesajYaz("Excel raporu raporlar klasorune kaydedildi."); console.info(sonuc.path); } catch (hata) { mesajYaz(hata.message, true); } });
document.getElementById("odemeTuruSecimi").addEventListener("change", donemSeciminiDoldur);
document.getElementById("cariDaireSecimi").addEventListener("change", (event) => cariHesapYukle(event.target.value));
document.getElementById("denetciYenileButonu").addEventListener("click", denetciYukle);
document.getElementById("yedekOlusturButonu").addEventListener("click", async () => { try { const sonuc = await api("/api/backup", { method: "POST", body: "{}" }); await yedekleriYukle(); mesajYaz(`${sonuc.name} adli yedek olusturuldu.`); } catch (hata) { mesajYaz(hata.message, true); } });
document.getElementById("yedekGeriYukleButonu").addEventListener("click", async () => { const name = document.getElementById("yedekSecimi").value; if (!name || !window.confirm("Secili yedek mevcut verinin yerine yuklenecek. Devam edilsin mi?")) return; try { const sonuc = await api("/api/restore", { method: "POST", body: JSON.stringify({ name }) }); mesajYaz(sonuc.message); await paneliYukle(); } catch (hata) { mesajYaz(hata.message, true); } });

formBagla("odemeFormu", "/api/payment");
formBagla("giderFormu", "/api/expense");
formBagla("butceFormu", "/api/budget");
formBagla("donemFormu", "/api/period");
formBagla("gecikmeFormu", "/api/late-fee-settings");
formBagla("kararFormu", "/api/decisions");

document.getElementById("evrakFormu").addEventListener("submit", async (olay) => { olay.preventDefault(); const dosya = document.getElementById("evrakDosyasi").files[0]; if (!dosya) return; const okuyucu = new FileReader(); okuyucu.onload = async () => { try { const base64 = String(okuyucu.result).split(",")[1]; const form = olay.currentTarget; const sonuc = await api("/api/documents", { method: "POST", body: JSON.stringify({ document_type: form.elements.document_type.value, unit_id: form.elements.unit_id.value, file_name: dosya.name, mime_type: dosya.type, content_base64: base64 }) }); form.reset(); await evraklariYukle(); mesajYaz(sonuc.message); } catch (hata) { mesajYaz(hata.message, true); } }; okuyucu.readAsDataURL(dosya); });

async function kararSil(id) { if (!window.confirm("Bu karar silinsin mi?")) return; try { const sonuc = await api("/api/decisions/delete", { method: "POST", body: JSON.stringify({ id }) }); await kararlarYukle(); mesajYaz(sonuc.message); } catch (hata) { mesajYaz(hata.message, true); } }

menuDugmeleri.forEach((dugme) => dugme.addEventListener("click", () => { const hedef = document.getElementById(dugme.dataset.hedef); if (!hedef) return; menuDugmeleri.forEach((item) => item.classList.toggle("active", item === dugme)); hedef.scrollIntoView({ behavior: "smooth", block: "start" }); }));
paneliYukle().catch((hata) => mesajYaz(hata.message, true));
