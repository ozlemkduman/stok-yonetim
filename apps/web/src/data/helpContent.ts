interface HelpItem {
  title: string;
  items: string[];
}

export const helpContent: Record<string, HelpItem> = {
  '/dashboard': {
    title: 'Özet Sayfası',
    items: [
      'Üst kartlarda bugünkü satış, toplam ürün, müşteri sayısı ve düşük stok adedi yer alır.',
      'Toplam borç, alacak ve aylık gider özetlerinizi tek bakışta görürsünüz.',
      'Hızlı eylem butonları ile yeni satış, ürün, müşteri ekleyebilir veya raporlara geçebilirsiniz.',
      'Düşük stok ürünleri ve en borçlu müşteriler tabloları en kritik durumları öne çıkarır.',
      'Mevcut planınız Basic veya Pro ise üstte plan yükseltme önerisi gözükür.',
    ],
  },
  '/suppliers': {
    title: 'Tedarikçiler',
    items: [
      'Tedarikçi = mal/hizmet aldığınız firmalar. Müşterilerden ayrı liste tutulur.',
      'Bakiye işareti: NEGATİF = siz tedarikçiye borçlusunuz. POZİTİF = tedarikçi size borçlu (örn. iade sonrası).',
      'Veresiye alış yaptığınızda tedarikçi bakiyesi otomatik olarak borç tarafına işler.',
      'Tedarikçi silindiğinde sadece pasifleştirilir; alış geçmişi korunur.',
    ],
  },
  '/purchases': {
    title: 'Alışlar',
    items: [
      'Tedarikçiden yapılan mal/hizmet alımları bu sayfada kaydedilir.',
      'Alış oluşturulduğunda: kalemlerin stokları OTOMATİK ARTAR.',
      'Ödeme yöntemine göre: Nakit/Kart/Havale → kasa/banka hesabı azalır (gider); Veresiye → tedarikçi cari hesabı borçlanır.',
      'Tedarikçi Fatura No alanına, tedarikçinin verdiği orijinal fatura numarasını yazın (eşleştirme için).',
      'Alış iptal edildiğinde stoklar geri alınır; iptal anında bu ürünler satılmış olamaz (yetersiz stoğa düşürmemek için).',
      'Durum filtresi ile aktif/iptal/tümü görünümleri arasında geçiş yapın.',
    ],
  },
  '/customers': {
    title: 'Müşteriler',
    items: [
      'Yeni müşteri eklemek için "Yeni Müşteri" butonunu kullanın.',
      'Müşteri kartına tıklayarak detay sayfasına geçebilirsiniz.',
      'Detay sayfasında: iletişim bilgileri, satış geçmişi, ödeme/iade kayıtları ve cari hesap (borç/alacak) durumu listelenir.',
      'Negatif bakiye müşterinin size borçlu olduğunu, pozitif bakiye sizin müşteriye alacaklı olduğunuzu gösterir.',
      'Toplu müşteri yüklemek için "Import" özelliğini (Pro+) kullanın.',
    ],
  },
  '/quotes': {
    title: 'Teklifler',
    items: [
      'Teklif = müşteriye verdiğiniz fiyat önerisi; henüz satış değildir, satıştan önceki adımdır.',
      'Akış: Taslak → Gönderildi → Kabul Edildi (veya Reddedildi) → Satışa Dönüştürüldü.',
      '"Gönder" butonu sadece sistemde işaretleme yapar — gerçek gönderim (WhatsApp/mail/yazdırma) sizin elinizdedir; sistem otomatik mesaj atmaz.',
      '"Kabul Et" ve "Reddet": müşteriden duyduğunuz cevabı sisteme kaydetmek içindir.',
      '"Satışa Dönüştür": kabul edilen teklifi tek tıkla satışa çevirir → stok düşer, fatura no üretilir.',
      'Teklif kalemlerinde KDV oranı ve iskonto uygulayabilirsiniz.',
      'Teklifler Pro ve Plus planlarında kullanılabilir.',
    ],
  },
  '/sales': {
    title: 'Satışlar',
    items: [
      'Yeni satış oluşturmak için "Yeni Satış" butonunu kullanın veya kabul edilen bir teklifi (Pro+) satışa dönüştürün.',
      'Ödeme yöntemleri: Nakit, Kredi Kartı, Havale/EFT, Veresiye.',
      'Nakit ödeme → default kasa hesabınıza, Kredi Kartı / Havale → default banka hesabınıza otomatik gelir olarak işlenir.',
      'Veresiye satışta tutar müşteri cari hesabına borç olarak kaydedilir.',
      'Durum filtresi (Aktif / İptal / Tümü) ile listeyi süzebilirsiniz; iptaller toplam ciroya dahil değildir.',
      'Satış tarihini geri tarihli girebilirsiniz; yenileme kısayolları bu tarihten itibaren hesaplanır.',
    ],
  },
  '/returns': {
    title: 'İadeler',
    items: [
      'İade oluşturmak için ilgili satışı seçip iade edilen kalemleri belirleyin.',
      'Kısmi iade yapabilirsiniz — satıştaki tüm kalemleri iade etmek zorunda değilsiniz.',
      'İade edilen ürünler otomatik olarak stoğa geri eklenir.',
      'İade tutarı, satış veresiye ise müşteri cari hesabına alacak olarak yansır.',
      'İade nedeni ve notları sonradan rapor için filtrelenebilir (Gelişmiş Raporlar — Pro+).',
    ],
  },
  '/products': {
    title: 'Ürünler',
    items: [
      'Yeni ürün eklemek için "Yeni Ürün" butonunu kullanın.',
      'Barkod, kategori, KDV oranı, alış/satış/toptan fiyatları ürün bazında tutulur.',
      'Düşük stok uyarı seviyesini ürün bazında ayarlayabilirsiniz (varsayılan 5).',
      'Stok seviyesi limitin altına düştüğünde dashboard bildiriminde görünür.',
      'Ürün detay sayfasında satış, iade ve stok hareketi geçmişi sekmeleri bulunur.',
      'Kategori "E-İmza" seçilirse abonelik süresi (1/2/3 yıl) alanı açılır.',
    ],
  },
  '/warehouses': {
    title: 'Depolar',
    items: [
      'Birden fazla depo tanımlayarak stok takibinizi lokasyon bazında yapabilirsiniz.',
      'Depolar arası stok transferi için "Transfer" özelliğini kullanın.',
      'Stok hareketleri sayfasından tüm giriş/çıkış işlemlerini takip edin.',
      'Her deponun anlık stok durumunu depo detay sayfasından görebilirsiniz.',
      'Bir depoyu "varsayılan" olarak işaretleyebilirsiniz — yeni satışlarda otomatik seçilir.',
      'Çoklu depo Pro (3 depoya kadar) ve Plus (sınırsız) planlarında kullanılabilir.',
    ],
  },
  '/warehouses/movements': {
    title: 'Stok Hareketleri',
    items: [
      'Tüm ürünlerin stok giriş/çıkış geçmişini kronolojik olarak görürsünüz.',
      'Hareket türleri: satış (-), iade (+), transfer (depolar arası), satın alma (+), sayım (manuel düzeltme).',
      'Filtreler: ürün, hareket türü, tarih aralığı ve depo (Pro+ planlar için).',
      'Her satırda hareket sonrası kalan stok miktarı (kümülatif) gösterilir.',
      'Tek bir ürün için detay görmek isterseniz, ürün detay sayfasındaki "Hareketler" sekmesine bakabilirsiniz.',
    ],
  },
  '/accounts': {
    title: 'Kasa / Banka Hesapları',
    items: [
      'Nakit kasa ve banka hesaplarınızı ayrı ayrı tanımlayın.',
      'Bir hesabı "varsayılan" olarak işaretleyin — nakit/havale satışlarda otomatik seçilir.',
      'Hesaplar arası transfer yaparak bakiyeleri taşıyabilirsiniz.',
      'Hesap detay sayfasında tüm hareketler (gelir/gider) listelenir.',
      'Satışlar ve giderler otomatik olarak ilgili hesaba işlenir; manuel hareket de ekleyebilirsiniz.',
      'Açılış bakiyesi değiştirilirse mevcut bakiye delta kadar otomatik kaydırılır (hareketler korunur).',
    ],
  },
  '/expenses': {
    title: 'Giderler',
    items: [
      'Kira, fatura, maaş gibi giderlerinizi kategorize ederek kaydedin.',
      'Gider eklerken ödeme yapılan kasa/banka hesabını seçin — bakiye otomatik düşer.',
      'Gider tarihi, kategori ve açıklama alanları zorunludur.',
      'Tüm giderler ve kategoriye göre dağılım Gelişmiş Raporlar (Pro+) altındadır.',
    ],
  },
  '/crm': {
    title: 'CRM',
    items: [
      'Müşteri ilişkilerinizi kişiler ve aktiviteler üzerinden yönetin.',
      'Her kişiye telefon, e-posta, görüşme türünde aktivite ekleyebilirsiniz.',
      'Aktivite tarihçesinde geçmiş etkileşimleri takip edin.',
      'Plus planına özel; Basic ve Pro\'da kullanılamaz.',
    ],
  },
  '/field-team': {
    title: 'Saha Ekibi',
    items: [
      'Saha satış temsilcileri için rota ve ziyaret planlaması yapabilirsiniz.',
      'Bir rotaya birden fazla ziyaret atayıp temsilci ekleyebilirsiniz.',
      'Ziyaret durumlarını (planlandı / tamamlandı / iptal) sahadan güncelleyin.',
      'Plus planına özel; Basic ve Pro\'da kullanılamaz.',
    ],
  },
  '/integrations': {
    title: 'Entegrasyonlar',
    items: [
      'Şu an Trendyol entegrasyonu desteklenir — siparişler otomatik olarak satışa dönüştürülür.',
      'Bir entegrasyon eklemek için API kimlik bilgilerinizi girin.',
      'Pro planında 3, Plus planında sınırsız entegrasyon hesabı kaydedilebilir.',
      'Daha fazla pazaryeri sağlayıcısı (Hepsiburada, N11 vb.) için takipte kalın.',
    ],
  },
  '/reports': {
    title: 'Raporlar',
    items: [
      'Genel sekmesinde: satış özeti, kar/zarar, borç-alacak ve geciken ödemeler.',
      'Satış sekmesi: en çok satan ürünler ve iadeler.',
      'Stok sekmesi: stok değeri, düşük/sıfır stok özetleri.',
      'Tarih aralığı seçerek tüm raporları filtreleyebilirsiniz; varsayılan son 30 gün.',
      'Gelişmiş raporlar (Kar/Zarar, KDV, Personel, Yenileme, Müşteri-Ürün, Gider Analizi) Pro+ planlarına özeldir.',
      'Tüm ciro hesapları iptal edilen satışları **hariç** tutar; KDV-hariç net rakamlar kullanılır.',
    ],
  },
  '/settings': {
    title: 'Şirket Ayarları',
    items: [
      'Şirket bilgilerinizi (ad, alan adı, fatura e-postası, adres) bu sayfadan güncelleyin.',
      'Aylık abonelik planınızı ve kullanım durumunuzu (kullanıcı, ürün, müşteri, depo sayıları) görüntüleyebilirsiniz.',
      'Basic veya Pro plandaysanız altta planları karşılaştırma tablosu ile yükseltme yapabilirsiniz.',
    ],
  },
  '/settings/users': {
    title: 'Kullanıcı Yönetimi',
    items: [
      'Sisteme yeni kullanıcı eklemek için e-posta ve geçici şifre ile davet edin.',
      'Kullanıcı rolleri ile erişim yetkilerini belirleyin (örn. yönetici / personel).',
      'Aktif veya pasif kullanıcıları durum filtresiyle ayırın.',
      'Bir kullanıcıyı pasifleştirmek hesabı silmeden erişimini kapatır.',
      'Plan limitiniz dolduğunda yeni kullanıcı ekleyemezsiniz (Basic 1, Pro 5, Plus sınırsız).',
    ],
  },
  '/profile': {
    title: 'Profil',
    items: [
      'Ad, e-posta ve telefon bilgilerinizi güncelleyebilirsiniz.',
      'Şifrenizi değiştirmek için önce mevcut şifrenizi girin.',
      'Bu sayfa sadece kendi hesabınızı etkiler — diğer kullanıcılar için "Kullanıcı Yönetimi" sayfasına gidin.',
    ],
  },
};

/**
 * Verilen path için yardım içeriği döndürür.
 * Detay sayfaları (ör: /quotes/123) için ana path'i (/quotes) kullanır.
 */
export function getHelpContent(pathname: string): HelpItem | null {
  // Exact match
  if (helpContent[pathname]) {
    return helpContent[pathname];
  }

  // Try parent path for detail pages like /quotes/123, /products/5/edit
  const segments = pathname.split('/').filter(Boolean);
  while (segments.length > 1) {
    segments.pop();
    const parentPath = '/' + segments.join('/');
    if (helpContent[parentPath]) {
      return helpContent[parentPath];
    }
  }

  return null;
}
