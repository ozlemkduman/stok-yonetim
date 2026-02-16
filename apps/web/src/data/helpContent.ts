interface HelpItem {
  title: string;
  items: string[];
}

export const helpContent: Record<string, HelpItem> = {
  '/dashboard': {
    title: 'Özet Sayfası',
    items: [
      'Günlük, haftalık ve aylık satış özetlerinizi takip edebilirsiniz.',
      'Stok durumu widget\'ı ile düşük ve biten stokları hızlıca görebilirsiniz.',
      'Borç/alacak özeti toplam bakiyelerinizi gösterir.',
      'Grafiklerdeki zaman aralığını değiştirerek farklı dönemleri karşılaştırabilirsiniz.',
    ],
  },
  '/customers': {
    title: 'Müşteriler',
    items: [
      'Yeni müşteri eklemek için "Yeni Müşteri" butonunu kullanın.',
      'Müşteri kartına tıklayarak detay sayfasına gidebilirsiniz.',
      'Detay sayfasında müşterinin satış geçmişi, borç durumu ve iletişim bilgilerini görebilirsiniz.',
      'Borç takibi için müşteri detayındaki "Hesap Hareketleri" bölümüne bakın.',
    ],
  },
  '/quotes': {
    title: 'Teklifler',
    items: [
      'Teklif akışı: Taslak → Gönderildi → Kabul Edildi / Reddedildi → Satışa Dönüştür.',
      '"Kabul Et" ve "Reddet" butonları müşteriden gelen cevabı sisteme girmek içindir.',
      'Kabul edilen teklifi "Satışa Dönüştür" ile tek tıkla satışa çevirebilirsiniz.',
      'Teklif yazdırmak veya PDF olarak kaydetmek için detay sayfasındaki yazıcı ikonunu kullanın.',
      'Teklif kalemlerinde KDV oranı ve iskonto uygulayabilirsiniz.',
    ],
  },
  '/sales': {
    title: 'Satışlar',
    items: [
      'Yeni satış oluşturmak için "Yeni Satış" butonunu kullanın veya kabul edilen bir teklifi satışa dönüştürün.',
      'Ödeme yöntemleri: Nakit, kredi kartı, havale/EFT ve çoklu ödeme desteklenir.',
      'Satış detayından e-fatura veya e-arşiv fatura oluşturabilirsiniz.',
      'Kısmi ödeme yapılan satışlarda kalan borç müşteri hesabına otomatik yansır.',
    ],
  },
  '/returns': {
    title: 'İadeler',
    items: [
      'İade oluşturmak için ilgili satışı seçip iade kalemlerini belirleyin.',
      'Kısmi iade yapabilirsiniz — tüm kalemleri iade etmek zorunda değilsiniz.',
      'İade edilen ürünler otomatik olarak stoka geri eklenir.',
      'İade tutarı müşteri hesabına alacak olarak yansır.',
    ],
  },
  '/products': {
    title: 'Ürünler',
    items: [
      'Yeni ürün eklemek için "Yeni Ürün" butonunu kullanın.',
      'Barkod, SKU ve kategori bilgileri ile ürünlerinizi organize edin.',
      'Düşük stok uyarı seviyesini ürün bazında ayarlayabilirsiniz.',
      'Stok seviyesi uyarı limitinin altına düştüğünde bildirim alırsınız.',
      'Ürün detayında stok hareketleri geçmişini görebilirsiniz.',
    ],
  },
  '/warehouses': {
    title: 'Depolar',
    items: [
      'Birden fazla depo tanımlayarak stok takibinizi lokasyon bazında yapabilirsiniz.',
      'Depolar arası stok transferi için "Transfer" özelliğini kullanın.',
      'Stok hareketleri sayfasından tüm giriş/çıkış işlemlerini takip edin.',
      'Her deponun anlık stok durumunu depo detay sayfasından görebilirsiniz.',
    ],
  },
  '/accounts': {
    title: 'Kasa / Banka Hesapları',
    items: [
      'Nakit kasa ve banka hesaplarınızı ayrı ayrı takip edin.',
      'Hesaplar arası transfer yaparak bakiyeleri dengeleyebilirsiniz.',
      'Hesap hareketleri sayfasında tüm giriş/çıkış detaylarını görüntüleyin.',
      'Satış ve gider işlemleri ilgili hesaba otomatik olarak yansır.',
    ],
  },
  '/expenses': {
    title: 'Giderler',
    items: [
      'Kira, fatura, maaş gibi giderlerinizi kategorize ederek kaydedin.',
      'Gider eklerken ilgili kasa/banka hesabını seçin.',
      'Tekrarlayan giderler için not ekleyerek takibinizi kolaylaştırın.',
      'Raporlar sayfasından gider dağılımınızı grafiklerle analiz edebilirsiniz.',
    ],
  },
  '/e-documents': {
    title: 'e-Belgeler',
    items: [
      'e-Fatura ve e-Arşiv fatura oluşturma ve yönetimi bu sayfadan yapılır.',
      'Satış detayından tek tıkla e-belge oluşturabilirsiniz.',
      'GİB (Gelir İdaresi Başkanlığı) entegrasyonu ile belgeleriniz otomatik iletilir.',
      'Belge durumlarını (gönderildi, kabul edildi, reddedildi) takip edin.',
    ],
  },
  '/crm': {
    title: 'CRM',
    items: [
      'Müşteri ilişkilerinizi not, aktivite ve hatırlatıcılarla yönetin.',
      'Müşteri bazında aktivite geçmişini takip edin.',
      'Hatırlatıcı ekleyerek önemli takip tarihlerini kaçırmayın.',
      'Müşteri segmentasyonu ile hedefli iletişim stratejileri oluşturun.',
    ],
  },
  '/field-team': {
    title: 'Saha Ekip',
    items: [
      'Saha ekibinizin ziyaret planlarını oluşturun ve takip edin.',
      'Planlayıcı ile ziyaret rotalarını optimize edin.',
      'Saha personelinin ziyaret raporlarını görüntüleyin.',
      'Ziyaret durumlarını (planlandı, tamamlandı, iptal) takip edin.',
    ],
  },
  '/integrations': {
    title: 'Entegrasyonlar',
    items: [
      'E-ticaret platformları (Trendyol vb.) ile sipariş entegrasyonu yapın.',
      'Banka entegrasyonu ile hesap hareketlerinizi otomatik çekin.',
      'Entegrasyon ayarlarını bu sayfadan yönetebilirsiniz.',
      'Sipariş ve hesap hareketleri otomatik olarak sisteme aktarılır.',
    ],
  },
  '/reports': {
    title: 'Raporlar',
    items: [
      'Satış, stok, gelir-gider ve müşteri raporlarına bu sayfadan ulaşın.',
      'Tarih aralığı seçerek raporları filtreleyebilirsiniz.',
      'Geciken ödemeleri ve düşük stokları raporlardan takip edin.',
      'Raporları dışa aktararak paylaşabilirsiniz.',
    ],
  },
  '/settings': {
    title: 'Şirket Ayarları',
    items: [
      'Şirket bilgilerinizi (ad, adres, vergi no) bu sayfadan güncelleyin.',
      'Fatura ve teklif şablonlarını özelleştirin.',
      'KDV oranları ve para birimi ayarlarını yapılandırın.',
      'Genel sistem tercihlerini buradan yönetin.',
    ],
  },
  '/settings/users': {
    title: 'Kullanıcı Yönetimi',
    items: [
      'Sisteme yeni kullanıcı davet edin veya mevcut kullanıcıları yönetin.',
      'Kullanıcı rolleri ile erişim yetkilerini belirleyin.',
      'Aktif ve pasif kullanıcıları görüntüleyin.',
      'Kullanıcı şifresini sıfırlama işlemini buradan yapabilirsiniz.',
    ],
  },
  '/profile': {
    title: 'Profil',
    items: [
      'Ad, e-posta ve iletişim bilgilerinizi güncelleyin.',
      'Şifrenizi değiştirmek için mevcut şifrenizi girmeniz gerekir.',
      'Bildirim tercihlerinizi bu sayfadan ayarlayabilirsiniz.',
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
