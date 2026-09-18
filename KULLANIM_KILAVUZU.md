# Apartman Yönetim Uygulaması V3

Bu uygulama tek bir Windows bilgisayarında, tek yönetici tarafından ve internet gerektirmeden çalışır. Günlük işlemler veritabanına kaydedilir. Excel artık ana çalışma ekranı değildir; yalnızca başlangıç verisi almak veya güncel raporu okumak için kullanılır.

## Yönetici olarak hangi dosyalara dokunacaksın?

`01_Ilk_Kurulum.bat`: Sadece ilk kurulumda bir kere çalıştırılır.

`02_Paneli_Ac.bat`: Her gün uygulamayı açmak için çift tıklanır. Günlük olarak kullanacağın tek dosya budur.

`03_Excelden_Yenile.bat`: Excel dosyasında elle değişiklik yaptıysan, bu değişiklikleri uygulamaya aktarmak için kullanılır.

`kaynak/ilk_veri.xlsx`: Uygulamaya aktarılacak Excel dosyasıdır.

`raporlar/guncel_rapor.xlsx`: Panelden üretilen, güncel verileri gösteren Excel raporudur. Okumak ve yazdırmak içindir.

`veri/apartman.db`: Uygulamanın canlı kayıt dosyasıdır. Silme, taşıma veya adını değiştirme.

`veri/yedekler`: Uygulamanın otomatik yedekleridir. Bir sorun olursa Ayarlar bölümünden geri yükleme yapılabilir.

`uygulama`: Teknik dosyaların bulunduğu klasördür. Günlük kullanımda bu klasörü açmana gerek yoktur.

## İlk kurulum

Bu işlem yalnızca ilk kullanımda yapılır:

1. ZIP dosyasını bilgisayarda istediğin bir klasöre çıkart.
2. `01_Ilk_Kurulum.bat` dosyasına çift tıkla.
3. Windows Python sorarsa Python'u kur. Kurulum sırasında `Add Python to PATH` kutusunu işaretle.
4. Siyah pencerede `Kurulum tamamlandı` yazısını bekle.
5. Kurulum bitince pencereyi kapat.

## Her gün uygulamayı açma

1. `02_Paneli_Ac.bat` dosyasına çift tıkla.
2. Tarayıcıda panel açılacaktır. Açılmazsa siyah pencerede görünen yerel adresi tarayıcıya yaz.
3. İşlemlerini panelden yap.
4. İşin bitince önce tarayıcıyı, sonra siyah pencereyi kapat.

Panelde yaptığın ödeme, gider, telefon ve diğer kayıtlar anında `veri/apartman.db` dosyasına yazılır. Uygulamayı her açtığında son kayıtlar otomatik gelir.

## Excel dosyasının güncel halini kullanma

Excel'de elle değişiklik yaptıysan:

1. Paneli ve siyah pencereyi kapat.
2. Güncel Excel dosyasını `kaynak` klasörünün içine koy.
3. Dosyanın adını tam olarak `ilk_veri.xlsx` yap.
4. Eski dosya varsa üzerine yaz.
5. `03_Excelden_Yenile.bat` dosyasına çift tıkla.
6. İşlem tamamlanınca `02_Paneli_Ac.bat` ile paneli yeniden aç.

Bu işlemden önce mevcut veritabanının yedeği `veri/yedekler` klasörüne alınır. Excel'in içinde `Gelir_Takibi` ve `Gider_Takibi` sayfaları bulunmalıdır.

Önemli: Paneldeki `Excel Raporu Üret` düğmesiyle oluşan `raporlar/guncel_rapor.xlsx` dosyası kaynak Excel değildir. Raporu tekrar `kaynak` klasörüne koyup aktarma.

## Panelde neler yapılabilir?

- Aktif ayı ve geçmiş dönem borçlarını ayrı görmek.
- Aidat ile demirbaş kayıtlarını ayrı takip etmek.
- Daire bazında aidat veya demirbaş muafiyeti tanımlamak.
- Kısmi ödeme kaydetmek ve fazla ödemeyi yanlışlıkla engellemek.
- Borçlu listesinde hazır mesajı kopyalamak veya WhatsApp'ı açmak.
- Borç bildirimi ve ödeme makbuzu oluşturmak.
- Giderleri kategori ve bütçe türüne göre görmek.
- Yıllık bütçe tanımlamak ve yeni dönem oluşturmak.
- Cari hesap hareketlerini dönem bazında incelemek.
- Denetçi özetini salt okunur olarak görmek.
- Karar defteri ve evrak arşivi tutmak.
- Veritabanı yedeği almak ve gerektiğinde yedekten dönmek.

## Güvenli kullanım kuralları

- Aynı anda iki panel açma.
- Panel açıkken `veri/apartman.db` dosyasını elle açma veya taşıma.
- Excel'den aktarım yaparken önce paneli kapat.
- Eski veya yanlış Excel aktarımından önce `veri/yedekler` içindeki son yedeği koru.
- Uygulamayı başka bilgisayara taşırken klasörün tamamını kopyala.
- Teknik `uygulama` klasöründeki dosyaları silme veya yeniden adlandırma.

## En kısa özet

İlk gün: `01_Ilk_Kurulum.bat`

Her gün: `02_Paneli_Ac.bat`

Excel'den yeniden alma: Excel'i `kaynak/ilk_veri.xlsx` olarak değiştir, sonra `03_Excelden_Yenile.bat`

Güncel Excel raporu: Panelde `Excel Raporu Üret`
