const durum = { veri: null, daireler: [], borclular: [], kararlar: [], evraklar: [] };

const para = (deger) => `${new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(deger || 0))} TL`;
const oran = (deger) => new Intl.NumberFormat("tr-TR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Number(deger || 0));
const kacis = (deger) => String(deger ?? "").replace(/[&<>"']/g, (karakter) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[karakter]));
const hareketAdlari = { tahakkuk: "Tahakkuk", tahsilat: "Tahsilat", gider: "Gider", duzeltme: "Düzeltme" };
const turAdlari = { aidat: "Aidat", demirbas: "Demirbaş" };

async function api(adres, secenekler = {}) {
  const yanit = await fetch(adres, { headers: { "Content-Type": "application/json" }, ...secenekler });
  const veri = await yanit.json();
  if (!yanit.ok || veri.ok === false) throw new Error(veri.error || "İşlem tamamlanamadı.");
  return veri;
}

function mesajYaz(mesaj, hata = false) {
  const alan = document.getElementById("durumMesaji");
  alan.textContent = mesaj;
  alan.className = `bildirim gorunur ${hata ? "hata" : "basarili"}`;
  window.clearTimeout(mesajYaz.zamanlayici);
  mesajYaz.zamanlayici = window.setTimeout(() => { alan.className = "bildirim"; }, 4200);
}

function secimDoldur(kimlik, liste, etiket, deger) {
  const alan = document.getElementById(kimlik);
  if (!alan) return;
  alan.innerHTML = liste.map((oge) => `<option value="${kacis(deger(oge))}">${kacis(etiket(oge))}</option>`).join("");
}

function sayfayaGit(sayfa) {
  document.querySelectorAll("[data-sayfa-icerik]").forEach((oge) => oge.classList.toggle("aktif", oge.dataset.sayfaIcerik === sayfa));
  document.querySelectorAll(".menu-ogesi[data-sayfa]").forEach((oge) => oge.classList.toggle("aktif", oge.dataset.sayfa === sayfa));
  document.querySelector(".sayfa-alani")?.scrollTo({ top: 0, behavior: "smooth" });
  document.getElementById("kenarMenu")?.classList.remove("acik");
}

function finansOzetiniCiz() {
  const ozet = durum.veri.summary;
  document.getElementById("toplamTahsilat").textContent = para(ozet.total_collected);
  document.getElementById("toplamBekleyen").textContent = para(ozet.total_outstanding);
  document.getElementById("toplamGider").textContent = para(ozet.total_expenses);
  document.getElementById("netBakiye").textContent = para(ozet.net_balance);
  document.getElementById("borcAlt").textContent = `${ozet.debtor_count} daire takipte`;
  document.getElementById("donemBilgisi").textContent = `${ozet.overdue_period_count} geçmiş dönem hareketi`;
  document.getElementById("aktifDonem").textContent = durum.veri.current_period;
  document.getElementById("menuBorcRozeti").textContent = ozet.debtor_count;
  document.getElementById("borcSayfasiRozeti").textContent = `${ozet.debtor_count} daire takipte`;
  document.getElementById("borcToplamKart").textContent = para(ozet.total_outstanding);
  document.getElementById("aidatRiskKart").textContent = para(durum.veri.tracking.aidat_risk);
  document.getElementById("demirbasRiskKart").textContent = para(durum.veri.tracking.demirbas_risk);
  document.getElementById("aidatOran").textContent = oran(durum.veri.aidat.rate);
  document.getElementById("demirbasOran").textContent = oran(durum.veri.demirbas.rate);
}

function grafikCiz() {
  const donemler = durum.veri.periods || [];
  const max = Math.max(...donemler.map((donem) => Math.max(donem.aidat.accrual, donem.demirbas.accrual)), 1);
  document.getElementById("donemGrafikleri").innerHTML = donemler.slice(-8).map((donem) => {
    const aidatYuzde = Math.max(4, Math.round((donem.aidat.paid / max) * 100));
    const demirbasYuzde = Math.max(4, Math.round((donem.demirbas.paid / max) * 100));
    return `<div class="grafik-satiri"><span>${kacis(donem.key.slice(5))}</span><div class="grafik-cubuklar"><i class="grafik-cubuk aidat" style="height:${aidatYuzde}%" title="Aidat: ${para(donem.aidat.paid)}"></i><i class="grafik-cubuk demirbas" style="height:${demirbasYuzde}%" title="Demirbaş: ${para(donem.demirbas.paid)}"></i></div></div>`;
  }).join("");
}

function aksiyonlariCiz() {
  const takip = durum.veri.tracking;
  const satirlar = [
    ["Aidat tahsilat riski", para(takip.aidat_risk), "borclar", "turuncu"],
    ["Demirbaş tahsilat riski", para(takip.demirbas_risk), "borclar", "mavi"],
    ["Eksik telefon kaydı", takip.missing_phone_count, "daireler", "gri"],
    ["Muafiyetli daire", takip.exempt_count, "daireler", "yesil"],
  ];
  document.getElementById("aksiyonListesi").innerHTML = satirlar.map(([baslik, deger, hedef, renk]) => `<button class="aksiyon-satiri" data-sayfa="${hedef}" type="button"><i class="aksiyon-noktasi ${renk}"></i><span><b>${baslik}</b><small>Detayları görüntüle</small></span><strong>${deger}</strong><em>→</em></button>`).join("");
}

function sonGiderleriCiz() {
  document.getElementById("sonGiderler").innerHTML = (durum.veri.recent_expenses || []).slice(0, 4).map((gider) => `<div class="mini-liste-satiri"><span class="liste-ikon">↗</span><span><b>${kacis(gider.vendor)}</b><small>${kacis(gider.category)} · ${kacis(gider.expense_date)}</small></span><strong>${para(gider.amount)}</strong></div>`).join("") || `<p class="bos-metin">Henüz gider kaydı yok.</p>`;
}

function daireleriCiz() {
  document.getElementById("daireSayaci").textContent = `${durum.daireler.length} daire`;
  document.getElementById("dairelerTablosu").innerHTML = durum.daireler.map((daire) => `<tr data-arama-metni="${kacis(`${daire.daire} ${daire.isim} ${daire.durum}`.toLocaleLowerCase("tr-TR"))}"><td><span class="daire-no">${kacis(daire.daire)}</span></td><td><strong>${kacis(daire.isim)}</strong></td><td><span class="durum-rozet ${daire.durum === "Kiracı" ? "kiraci" : "sahibi"}">${kacis(daire.durum)}</span></td><td><input class="satir-telefon" data-id="${daire.id}" value="${kacis(daire.phone)}" placeholder="Telefon"></td><td><input class="muaf-checkbox satir-aidat-muaf" data-id="${daire.id}" type="checkbox" ${daire.aidat_muaf ? "checked" : ""}></td><td><input class="muaf-checkbox satir-demirbas-muaf" data-id="${daire.id}" type="checkbox" ${daire.demirbas_muaf ? "checked" : ""}></td><td><button class="satir-buton daireKaydet" data-id="${daire.id}" type="button">Kaydet</button></td></tr>`).join("");
  document.querySelectorAll(".daireKaydet").forEach((buton) => buton.addEventListener("click", () => daireKaydet(buton.dataset.id)));
}

function borclulariCiz() {
  document.getElementById("borclularTablosu").innerHTML = durum.veri.debtors.map((borclu) => `<tr data-arama-metni="${kacis(`${borclu.daire} ${borclu.isim}`.toLocaleLowerCase("tr-TR"))}"><td><span class="daire-no">${kacis(borclu.daire)}</span></td><td><strong>${kacis(borclu.isim)}</strong><small>${kacis(borclu.telefon || "Telefon yok")}</small></td><td>${borclu.aidat_periodleri.map(kacis).join(", ") || "-"}</td><td>${borclu.demirbas_periodleri.map(kacis).join(", ") || "-"}</td><td><strong class="borc-tutar">${para(borclu.total_remaining)}</strong></td><td class="mesaj-hucresi">${kacis(borclu.message)}</td><td><div class="satir-islemleri"><button class="satir-buton mesajKopyala" data-id="${borclu.unit_id}" type="button">Kopyala</button><button class="satir-buton whatsappAc" data-id="${borclu.unit_id}" type="button">WhatsApp</button><button class="satir-buton borcPdf" data-id="${borclu.unit_id}" type="button">PDF</button></div></td></tr>`).join("") || `<tr><td colspan="7"><div class="bos-durum"><b>Harika, açık borç görünmüyor.</b><span>Geçmiş dönemlerde kalan ödeme bulunmuyor.</span></div></td></tr>`;
  document.querySelectorAll(".mesajKopyala").forEach((buton) => buton.addEventListener("click", () => mesajKopyala(buton.dataset.id)));
  document.querySelectorAll(".whatsappAc").forEach((buton) => buton.addEventListener("click", () => whatsappAc(buton.dataset.id)));
  document.querySelectorAll(".borcPdf").forEach((buton) => buton.addEventListener("click", () => borcPdf(buton.dataset.id)));
}

function giderGruplariniCiz() {
  document.getElementById("giderGruplari").innerHTML = (durum.veri.expense_groups || []).map((grup) => `<details class="gider-grubu"><summary><span><b>${kacis(grup.category)}</b><small>${kacis(grup.budget_type)}</small></span><strong>${para(grup.total)}</strong></summary><div class="gider-detaylari">${grup.items.map((item) => `<div><span>${kacis(item.vendor)} · ${kacis(item.description)}</span><strong>${para(item.amount)}</strong></div>`).join("")}</div></details>`).join("") || `<p class="bos-metin">Henüz gider kaydı yok.</p>`;
}

function secenekleriCiz() {
  secimDoldur("odemeDaireSecimi", durum.daireler, (item) => `${item.daire} · ${item.isim}`, (item) => item.id);
  secimDoldur("cariDaireSecimi", durum.daireler, (item) => `${item.daire} · ${item.isim}`, (item) => item.id);
  const evrakDaire = document.getElementById("evrakDaireSecimi");
  evrakDaire.innerHTML = `<option value="">Genel belge</option>${durum.daireler.map((item) => `<option value="${kacis(item.id)}">${kacis(`${item.daire} · ${item.isim}`)}</option>`).join("")}`;
  secimDoldur("evrakTuruSecimi", durum.veri.options.document_types || [], (item) => item, (item) => item);
  secimDoldur("giderKategoriSecimi", durum.veri.options.expense_categories || [], (item) => item, (item) => item);
  secimDoldur("giderButceSecimi", durum.veri.options.budget_types || [], (item) => item, (item) => item);
  donemSeciminiDoldur();
}

function donemSeciminiDoldur() {
  const tur = document.getElementById("odemeTuruSecimi").value;
  const donemler = durum.veri.periods.filter((donem) => donem[tur].accrual > 0 || donem.status !== "gecmis");
  secimDoldur("odemeDonemSecimi", donemler, (item) => `${item.key} · ${item.label}`, (item) => item.key);
}

function butceleriCiz() {
  document.getElementById("butceListesi").innerHTML = (durum.veri.budgets || []).map((butce) => `<div class="butce-satiri"><span class="butce-yil">${butce.year}</span><span><b>Aidat</b>${para(butce.aidat)}<small>Yıllık beklenen: ${para(butce.aidat_beklenen_yillik)}</small></span><span><b>Demirbaş</b>${para(butce.demirbas)}<small>Yıllık beklenen: ${para(butce.demirbas_beklenen_yillik)}</small></span></div>`).join("") || `<p class="bos-metin">Henüz bütçe tanımı yok.</p>`;
}

async function cariHesapYukle(id) {
  if (!id) return;
  try {
    const veri = await api(`/api/account?unit_id=${encodeURIComponent(id)}`);
    document.getElementById("cariHesapTablosu").innerHTML = veri.movements.map((item) => `<tr><td>${kacis(item.movement_date)}</td><td><span class="hareket-rozet ${kacis(item.movement_type)}">${kacis(hareketAdlari[item.movement_type] || item.movement_type)}</span></td><td>${kacis(item.charge_label || "Genel")}</td><td>${kacis(item.period_key || "-")}</td><td><strong>${para(item.amount)}</strong></td><td>${kacis(item.description)}</td></tr>`).join("") || `<tr><td colspan="6"><div class="bos-durum">Bu daire için henüz hareket yok.</div></td></tr>`;
  } catch (hata) { mesajYaz(hata.message, true); }
}

async function denetciYukle() {
  try {
    const veri = await api("/api/inspector");
    const kartlar = [["Aidat tahsilat oranı", oran(veri.aidat_tahsilat_orani), "yesil"], ["Demirbaş tahsilat oranı", oran(veri.demirbas_tahsilat_orani), "mavi"], ["Kasa bakiyesi", para(veri.kasa_bakiyesi), "lacivert"], ["Banka durumu", veri.banka_bakiyesi == null ? "Ayrı tutulmuyor" : para(veri.banka_bakiyesi), "gri"], ["Belgesiz gider", veri.belgesiz_gider_sayisi, "turuncu"], ["Eksik telefon", veri.telefonu_eksik_kayit, "turuncu"]];
    document.getElementById("denetciKartlari").innerHTML = kartlar.map(([baslik, deger, renk]) => `<div class="denetci-karti"><i class="ikon-kutu ${renk}">✓</i><span>${baslik}</span><strong>${deger}</strong></div>`).join("");
  } catch (hata) { mesajYaz(hata.message, true); }
}

async function kararlarYukle() {
  const veri = await api("/api/decisions");
  durum.kararlar = veri.items;
  document.getElementById("kararListesi").innerHTML = durum.kararlar.map((karar) => `<article class="karar-satiri"><div><span class="karar-no">${kacis(karar.decision_no)}</span><strong>${kacis(karar.title)}</strong><small>${kacis(karar.decision_date)}</small><p>${kacis(karar.body)}</p></div><button class="satir-buton kararSil" data-id="${karar.id}" type="button">Sil</button></article>`).join("") || `<p class="bos-metin">Henüz karar kaydı yok.</p>`;
  document.querySelectorAll(".kararSil").forEach((buton) => buton.addEventListener("click", () => kararSil(buton.dataset.id)));
}

async function evraklariYukle() {
  const veri = await api("/api/documents");
  durum.evraklar = veri.items;
  document.getElementById("evrakListesi").innerHTML = durum.evraklar.map((evrak) => `<div class="evrak-satiri"><span class="liste-ikon">□</span><span><b>${kacis(evrak.file_name)}</b><small>${kacis(evrak.document_type)} · ${kacis(evrak.uploaded_at)}</small></span><a href="/api/document/${evrak.id}" target="_blank">Aç</a></div>`).join("") || `<p class="bos-metin">Henüz arşivlenmiş evrak yok.</p>`;
}

async function yedekleriYukle() {
  const veri = await api("/api/backups");
  document.getElementById("yedekSecimi").innerHTML = veri.items.map((yedek) => `<option value="${kacis(yedek.name)}">${kacis(yedek.name)} · ${kacis(yedek.modified)}</option>`).join("") || `<option value="">Yedek yok</option>`;
}

async function daireKaydet(id) {
  const daire = durum.daireler.find((item) => String(item.id) === String(id));
  const telefon = document.querySelector(`.satir-telefon[data-id="${id}"]`).value;
  const aidatMuaf = document.querySelector(`.satir-aidat-muaf[data-id="${id}"]`).checked;
  const demirbasMuaf = document.querySelector(`.satir-demirbas-muaf[data-id="${id}"]`).checked;
  try { await api("/api/phone", { method: "POST", body: JSON.stringify({ unit_id: id, phone: telefon }) }); await api("/api/unit-exemptions", { method: "POST", body: JSON.stringify({ unit_id: id, aidat_muaf: aidatMuaf, demirbas_muaf: demirbasMuaf }) }); mesajYaz(`${daire.daire} numaralı daire güncellendi.`); await paneliYukle(); } catch (hata) { mesajYaz(hata.message, true); }
}

async function mesajKopyala(id) {
  const borclu = durum.veri.debtors.find((item) => String(item.unit_id) === String(id));
  if (!borclu) return;
  try { await navigator.clipboard.writeText(borclu.message); mesajYaz("Hazır mesaj panoya kopyalandı."); } catch (hata) { mesajYaz("Mesaj panoya kopyalanamadı.", true); }
}

function whatsappAc(id) {
  const borclu = durum.veri.debtors.find((item) => String(item.unit_id) === String(id));
  if (!borclu) return;
  const telefon = String(borclu.telefon || "").replace(/\D/g, "").replace(/^0/, "90");
  if (!telefon) { mesajYaz("Bu daire için telefon numarası bulunmuyor.", true); return; }
  window.open(`https://wa.me/${telefon}?text=${encodeURIComponent(borclu.message)}`, "_blank");
}

async function borcPdf(id) {
  try { const sonuc = await api("/api/debt-notice", { method: "POST", body: JSON.stringify({ unit_id: id }) }); mesajYaz(sonuc.path ? "Borç bildirimi PDF olarak hazırlandı." : "PDF için gerekli paket kurulu değil.", !sonuc.path); } catch (hata) { mesajYaz(hata.message, true); }
}

function filtreUygula(girdi) {
  const hedef = document.getElementById(girdi.dataset.filtre);
  if (!hedef) return;
  const arama = girdi.value.toLocaleLowerCase("tr-TR").trim();
  hedef.querySelectorAll("tr[data-arama-metni]").forEach((satir) => { satir.hidden = arama && !satir.dataset.aramaMetni.includes(arama); });
}

function formBagla(kimlik, adres) {
  const form = document.getElementById(kimlik);
  if (!form) return;
  form.addEventListener("submit", async (olay) => {
    olay.preventDefault();
    try { const veri = Object.fromEntries(new FormData(form).entries()); if (veri.enabled !== undefined) veri.enabled = form.elements.enabled.checked; mesajYaz("Kaydediliyor..."); const sonuc = await api(adres, { method: "POST", body: JSON.stringify(veri) }); form.reset(); await paneliYukle(); mesajYaz(sonuc.message || "Kayıt tamamlandı."); } catch (hata) { mesajYaz(hata.message, true); }
  });
}

async function paneliYukle() {
  try {
    durum.veri = await api("/api/dashboard");
    durum.daireler = durum.veri.apartments;
    finansOzetiniCiz(); grafikCiz(); aksiyonlariCiz(); sonGiderleriCiz(); daireleriCiz(); borclulariCiz(); giderGruplariniCiz(); secenekleriCiz(); butceleriCiz();
    await Promise.all([cariHesapYukle(document.getElementById("cariDaireSecimi").value), denetciYukle(), kararlarYukle(), evraklariYukle(), yedekleriYukle()]);
  } catch (hata) { mesajYaz(hata.message, true); }
}

document.querySelectorAll("[data-sayfa]").forEach((oge) => oge.addEventListener("click", () => { sayfayaGit(oge.dataset.sayfa); document.getElementById("islemModali").classList.remove("acik"); }));
document.querySelectorAll("[data-filtre]").forEach((girdi) => girdi.addEventListener("input", () => filtreUygula(girdi)));
document.getElementById("odemeTuruSecimi").addEventListener("change", donemSeciminiDoldur);
document.getElementById("cariDaireSecimi").addEventListener("change", (olay) => cariHesapYukle(olay.target.value));
document.getElementById("yenileButonu").addEventListener("click", () => paneliYukle().then(() => mesajYaz("Veriler yenilendi.")));
document.getElementById("denetciYenileButonu").addEventListener("click", denetciYukle);
document.getElementById("excelRaporButonu").addEventListener("click", async () => { try { const sonuc = await api("/api/export-excel", { method: "POST", body: "{}" }); mesajYaz("Güncel Excel raporu raporlar klasörüne kaydedildi."); console.info(sonuc.path); } catch (hata) { mesajYaz(hata.message, true); } });
document.getElementById("yedekButonu").addEventListener("click", async () => { try { const sonuc = await api("/api/backup", { method: "POST", body: "{}" }); await yedekleriYukle(); mesajYaz(`${sonuc.name} adlı yedek oluşturuldu.`); } catch (hata) { mesajYaz(hata.message, true); } });
document.getElementById("yedekOlusturButonu").addEventListener("click", async () => { try { const sonuc = await api("/api/backup", { method: "POST", body: "{}" }); await yedekleriYukle(); mesajYaz(`${sonuc.name} adlı yedek oluşturuldu.`); } catch (hata) { mesajYaz(hata.message, true); } });
document.getElementById("yedekGeriYukleButonu").addEventListener("click", async () => { const ad = document.getElementById("yedekSecimi").value; if (!ad || !window.confirm("Seçili yedek mevcut verinin yerine yüklenecek. Devam edilsin mi?")) return; try { const sonuc = await api("/api/restore", { method: "POST", body: JSON.stringify({ name: ad }) }); await paneliYukle(); mesajYaz(sonuc.message); } catch (hata) { mesajYaz(hata.message, true); } });

document.getElementById("evrakFormu").addEventListener("submit", (olay) => { olay.preventDefault(); const dosya = document.getElementById("evrakDosyasi").files[0]; if (!dosya) return; const okuyucu = new FileReader(); okuyucu.onload = async () => { try { const form = olay.currentTarget; const sonuc = await api("/api/documents", { method: "POST", body: JSON.stringify({ document_type: form.elements.document_type.value, unit_id: form.elements.unit_id.value, file_name: dosya.name, mime_type: dosya.type, content_base64: String(okuyucu.result).split(",")[1] }) }); form.reset(); await evraklariYukle(); mesajYaz(sonuc.message); } catch (hata) { mesajYaz(hata.message, true); } }; okuyucu.readAsDataURL(dosya); });
async function kararSil(id) { if (!window.confirm("Bu karar silinsin mi?")) return; try { const sonuc = await api("/api/decisions/delete", { method: "POST", body: JSON.stringify({ id }) }); await kararlarYukle(); mesajYaz(sonuc.message); } catch (hata) { mesajYaz(hata.message, true); } }
document.getElementById("menuButonu").addEventListener("click", () => document.getElementById("kenarMenu").classList.toggle("acik"));
document.getElementById("yeniIslemButonu").addEventListener("click", () => document.getElementById("islemModali").classList.add("acik"));
document.getElementById("yardimButonu").addEventListener("click", () => document.getElementById("islemModali").classList.add("acik"));
document.getElementById("modalKapat").addEventListener("click", () => document.getElementById("islemModali").classList.remove("acik"));
document.getElementById("islemModali").addEventListener("click", (olay) => { if (olay.target.id === "islemModali") olay.currentTarget.classList.remove("acik"); });
document.getElementById("globalArama").addEventListener("input", (olay) => { if (olay.target.value.trim()) { sayfayaGit("daireler"); const arama = document.querySelector('[data-filtre="dairelerTablosu"]'); arama.value = olay.target.value; filtreUygula(arama); } });
formBagla("odemeFormu", "/api/payment");
formBagla("giderFormu", "/api/expense");
formBagla("butceFormu", "/api/budget");
formBagla("donemFormu", "/api/period");
formBagla("gecikmeFormu", "/api/late-fee-settings");
formBagla("kararFormu", "/api/decisions");
paneliYukle();
