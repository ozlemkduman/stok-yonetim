import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Logo } from '../../components/Logo';
import styles from './LandingPage.module.css';

/* ── Data ── */

const features = [
  { icon: '📦', title: 'Stok Takibi', desc: 'Ürünlerinizi kategorilere ayırın, stok seviyelerini anlık takip edin. Kritik stok uyarıları ile hiçbir ürünü kaybetmeyin.' },
  { icon: '💰', title: 'Satış Yönetimi', desc: 'Satışlarınızı kaydedin, faturalayın ve tek ekranda tüm satış geçmişinizi görüntüleyin.' },
  { icon: '🧾', title: 'e-Belge', desc: 'e-Fatura ve e-Arşiv belgelerinizi saniyeler içinde oluşturun, müşterilerinize gönderin.' },
  { icon: '📊', title: 'Raporlama', desc: 'Detaylı satış, stok ve kâr/zarar raporları ile işletmenizin nabzını tutun.' },
  { icon: '👥', title: 'CRM', desc: 'Müşterilerinizi yönetin, iletişim geçmişini takip edin, satış fırsatlarını kaçırmayın.' },
  { icon: '🏭', title: 'Depo Yönetimi', desc: 'Birden fazla depo ile stok transferlerini ve hareketlerini kolayca yönetin.' },
];

const scenarios = [
  {
    icon: '🔍',
    title: 'Stokta Ne Kaldı?',
    before: 'Depoya gidip tek tek sayıyorsunuz, Excel\'e yazıyorsunuz, yine de rakamlar tutmuyor.',
    after: 'Telefonunuzdan anlık stok durumunu görün. Kritik seviyeye düşen ürünler için otomatik uyarı alın.',
    color: '#4361ee',
  },
  {
    icon: '🧾',
    title: 'Fatura Takibi',
    before: 'Faturalarınız başka portalde, satışlarınız başka yerde — eşleştirmek için saatler harcıyorsunuz.',
    after: 'e-Fatura XML dosyanızı sisteme aktarın, satışlarla otomatik eşleşsin. Tüm belgeler tek ekranda.',
    color: '#f72585',
  },
  {
    icon: '📉',
    title: 'Kâr mı Ediyorum?',
    before: 'Ay sonunda hesap makinesi ile topluyorsunuz, gerçek kârı bulmak imkânsız.',
    after: 'Anlık kâr/zarar raporları, ürün bazlı kârlılık analizi — kararlarınızı veriye dayalı verin.',
    color: '#7209b7',
  },
  {
    icon: '🤝',
    title: 'Müşteri Kayboldu',
    before: 'Müşteri bilgileri defterde, kim ne aldı hatırlamıyorsunuz, tekrar satış fırsatları kaçtı.',
    after: 'Tüm müşteri geçmişi tek ekranda. Son alışveriş, ödeme durumu, notlar — her şey elinizin altında.',
    color: '#e63946',
  },
  {
    icon: '🏪',
    title: 'Çoklu Depo Çilesi',
    before: 'Hangi depoda ne var bilinmiyor, transferler kâğıt üzerinde, kayıplar artık normal.',
    after: 'Depolar arası transfer tek tıkla. Her deponun stok durumunu anlık izleyin, fark varsa anında görün.',
    color: '#2ec4b6',
  },
  {
    icon: '📱',
    title: 'Sahada Kopukluk',
    before: 'Saha ekibi ofisi arasın mı, WhatsApp\'tan resim mi göndersin — bilgi akışı kopuk.',
    after: 'Saha ekibi mobilde sipariş girsin, rota planlama ile zaman kazansın, anlık senkronizasyon.',
    color: '#ff9f1c',
  },
];

const stats = [
  { value: 1200, suffix: '+', label: 'Aktif İşletme' },
  { value: 50000, suffix: '+', label: 'Aylık İşlem' },
  { value: 99.9, suffix: '%', label: 'Uptime' },
  { value: 7, suffix: '/24', label: 'Destek' },
];

const testimonials = [
  {
    name: 'Ahmet Y.',
    role: 'Market Sahibi',
    text: 'Eskiden stok sayımı için 2 gün harcıyordum. Şimdi telefonumdan anında görebiliyorum. Hayat kurtaran bir sistem.',
    avatar: 'AY',
  },
  {
    name: 'Fatma K.',
    role: 'Toptan Gıda',
    text: 'e-Fatura entegrasyonu muhteşem. Eskiden her fatura için 10 dakika harcıyordum, şimdi tek tıkla hazırlanıyor.',
    avatar: 'FK',
  },
  {
    name: 'Mehmet S.',
    role: 'Yedek Parça',
    text: '3 depomuz var ve transferler hep sorundu. StokSayaç ile hangi depoda ne var anında görüyoruz. Kayıplarımız sıfırlandı.',
    avatar: 'MS',
  },
];

const steps = [
  { num: '1', title: 'Formu Doldurun', desc: 'Ad, telefon ve işletme bilgilerinizi girin. 30 saniye sürer.' },
  { num: '2', title: 'Sizi Arayalım', desc: 'Ekibimiz sizinle iletişime geçip ihtiyaçlarınızı dinler.' },
  { num: '3', title: '45 Gün Ücretsiz Deneyin', desc: 'Demo hesabınız açılsın, tüm özellikleri test edin.' },
];

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: string;
  users: string;
  popular?: boolean;
  features: PlanFeature[];
}

const plans: Plan[] = [
  {
    name: 'Basic',
    price: '199',
    users: '1 Kullanıcı / 200 Ürün / 100 Müşteri',
    features: [
      { text: 'Stok Takibi', included: true },
      { text: 'Satış & İade', included: true },
      { text: '5 GB Depolama', included: true },
      { text: 'Teklif Yönetimi', included: false },
      { text: 'Fatura Import (XML)', included: false },
      { text: 'e-Belge', included: false },
      { text: 'Çoklu Depo', included: false },
      { text: 'Entegrasyonlar', included: false },
      { text: 'Gelişmiş Raporlama', included: false },
      { text: 'CRM', included: false },
      { text: 'Saha Ekibi', included: false },
      { text: 'API Erişimi', included: false },
    ],
  },
  {
    name: 'Pro',
    price: '449',
    users: '5 Kullanıcı / 5.000 Ürün / 2.000 Müşteri',
    popular: true,
    features: [
      { text: 'Stok Takibi', included: true },
      { text: 'Satış & İade', included: true },
      { text: '25 GB Depolama', included: true },
      { text: 'Teklif Yönetimi', included: true },
      { text: 'Fatura Import (XML)', included: true },
      { text: 'e-Belge', included: true },
      { text: 'Çoklu Depo (3 Depo)', included: true },
      { text: 'Entegrasyonlar (3 Adet)', included: true },
      { text: 'Gelişmiş Raporlama', included: true },
      { text: 'CRM', included: false },
      { text: 'Saha Ekibi', included: false },
      { text: 'API Erişimi', included: false },
    ],
  },
  {
    name: 'Plus',
    price: '799',
    users: 'Sınırsız Kullanıcı, Ürün & Müşteri',
    features: [
      { text: 'Stok Takibi', included: true },
      { text: 'Satış & İade', included: true },
      { text: '100 GB Depolama', included: true },
      { text: 'Teklif Yönetimi', included: true },
      { text: 'Fatura Import (XML)', included: true },
      { text: 'e-Belge', included: true },
      { text: 'Sınırsız Depo', included: true },
      { text: 'Sınırsız Entegrasyon', included: true },
      { text: 'Gelişmiş Raporlama', included: true },
      { text: 'CRM', included: true },
      { text: 'Saha Ekibi', included: true },
      { text: 'API Erişimi', included: true },
    ],
  },
];

/* ── Hooks ── */

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 2000;
        const startTime = performance.now();
        const step = (now: number) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString('tr-TR')}{suffix}</span>;
}

/* ── Demo Form Component ── */

function DemoForm() {
  const [form, setForm] = useState({ name: '', phone: '', company: '', sector: '', note: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = [
      `Merhaba, demo başvurusu yapmak istiyorum.`,
      `Ad Soyad: ${form.name}`,
      `Telefon: ${form.phone}`,
      form.company ? `İşletme: ${form.company}` : '',
      form.sector ? `Sektör: ${form.sector}` : '',
      form.note ? `Not: ${form.note}` : '',
    ].filter(Boolean).join('\n');

    window.open(`https://wa.me/905350739908?text=${encodeURIComponent(message)}`, '_blank');
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className={styles.formSuccess}>
        <div className={styles.formSuccessIcon}>✓</div>
        <h3 className={styles.formSuccessTitle}>Başvurunuz Alındı!</h3>
        <p className={styles.formSuccessText}>
          En kısa sürede sizinle iletişime geçeceğiz.<br />
          45 gün ücretsiz demo hesabınızı hazırlayacağız.
        </p>
        <button
          className={styles.btnOutline}
          onClick={() => { setSubmitted(false); setForm({ name: '', phone: '', company: '', sector: '', note: '' }); }}
        >
          Yeni Başvuru
        </button>
      </div>
    );
  }

  return (
    <form className={styles.demoForm} onSubmit={handleSubmit}>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Ad Soyad *</label>
          <input
            type="text"
            required
            className={styles.formInput}
            placeholder="Adınız Soyadınız"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Telefon *</label>
          <input
            type="tel"
            required
            className={styles.formInput}
            placeholder="05XX XXX XX XX"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>İşletme Adı</label>
          <input
            type="text"
            className={styles.formInput}
            placeholder="İşletmenizin adı"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Sektör</label>
          <select
            className={styles.formInput}
            value={form.sector}
            onChange={(e) => setForm({ ...form, sector: e.target.value })}
          >
            <option value="">Seçiniz</option>
            <option value="Perakende">Perakende</option>
            <option value="Toptan">Toptan</option>
            <option value="Gıda">Gıda</option>
            <option value="Tekstil">Tekstil</option>
            <option value="Yedek Parça">Yedek Parça</option>
            <option value="Elektronik">Elektronik</option>
            <option value="İnşaat / Yapı Malzemesi">İnşaat / Yapı Malzemesi</option>
            <option value="Kozmetik">Kozmetik</option>
            <option value="Diğer">Diğer</option>
          </select>
        </div>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Notunuz</label>
        <textarea
          className={`${styles.formInput} ${styles.formTextarea}`}
          placeholder="Eklemek istediğiniz bir not varsa yazabilirsiniz..."
          rows={3}
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
      </div>
      <button type="submit" className={`${styles.btnPrimary} ${styles.btnLarge} ${styles.btnGlow} ${styles.formSubmitBtn}`}>
        Demo Başvurusu Gönder
      </button>
      <p className={styles.formNote}>45 gün ücretsiz &middot; Kredi kartı gerekmez &middot; Hemen başlayın</p>
    </form>
  );
}

/* ── Component ── */

export function LandingPage() {
  const scenariosView = useInView(0.1);
  const statsView = useInView(0.2);
  const featuresView = useInView(0.1);
  const stepsView = useInView(0.15);
  const testimonialsView = useInView(0.1);
  const plansView = useInView(0.1);
  const demoView = useInView(0.1);
  const ctaView = useInView(0.2);

  return (
    <div className={styles.landing}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <Logo size="md" />
        <div className={styles.navLinks}>
          <a href="#ozellikler" className={styles.navLink}>Özellikler</a>
          <a href="#planlar" className={styles.navLink}>Planlar</a>
          <a href="#demo" className={styles.navLink}>Demo</a>
          <a href="#demo" className={styles.navLink}>İletişim</a>
        </div>
        <div className={styles.navButtons}>
          <Link to="/login" className={styles.btnOutline}>Giriş Yap</Link>
          <a href="#demo" className={styles.btnPrimary}>Ücretsiz Dene</a>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>Türkiye'nin Yeni Nesil Stok Yönetim Platformu</div>
          <h1 className={styles.heroTitle}>
            İşletmenizi<br />
            <span className={styles.heroHighlight}>Dijitale Taşıyoruz</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Stok takibi, satış yönetimi, e-Fatura, raporlama ve CRM — hepsi tek platformda.
            Excel dosyalarına, dağılan bilgilere ve kayıp stoklara elveda deyin.
          </p>
          <div className={styles.heroButtons}>
            <a href="#demo" className={`${styles.btnPrimary} ${styles.btnLarge} ${styles.btnGlow}`}>
              45 Gün Ücretsiz Dene
            </a>
            <a href="#senaryolar" className={`${styles.btnOutline} ${styles.btnLarge}`}>
              Nasıl Çalışır?
            </a>
          </div>
          <p className={styles.heroNote}>Kredi kartı gerekmez &middot; Hemen başlayabilirsiniz</p>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.mockupWindow}>
            <div className={styles.mockupDots}>
              <span /><span /><span />
            </div>
            <div className={styles.mockupBody}>
              <div className={styles.mockupSidebar}>
                <div className={styles.mockupMenuItem} />
                <div className={styles.mockupMenuItem} />
                <div className={styles.mockupMenuItem} style={{ opacity: 1, background: '#4361ee' }} />
                <div className={styles.mockupMenuItem} />
                <div className={styles.mockupMenuItem} />
              </div>
              <div className={styles.mockupContent}>
                <div className={styles.mockupStatRow}>
                  <div className={styles.mockupStat} style={{ background: 'linear-gradient(135deg, #4361ee20, #4361ee05)' }}>
                    <div className={styles.mockupStatValue}>2.847</div>
                    <div className={styles.mockupStatLabel}>Toplam Ürün</div>
                  </div>
                  <div className={styles.mockupStat} style={{ background: 'linear-gradient(135deg, #22c55e20, #22c55e05)' }}>
                    <div className={styles.mockupStatValue}>₺48.2K</div>
                    <div className={styles.mockupStatLabel}>Aylık Satış</div>
                  </div>
                  <div className={styles.mockupStat} style={{ background: 'linear-gradient(135deg, #f7258520, #f7258505)' }}>
                    <div className={styles.mockupStatValue}>142</div>
                    <div className={styles.mockupStatLabel}>Müşteri</div>
                  </div>
                </div>
                <div className={styles.mockupChart}>
                  <div className={styles.mockupBar} style={{ height: '40%' }} />
                  <div className={styles.mockupBar} style={{ height: '65%' }} />
                  <div className={styles.mockupBar} style={{ height: '45%' }} />
                  <div className={styles.mockupBar} style={{ height: '80%' }} />
                  <div className={styles.mockupBar} style={{ height: '60%' }} />
                  <div className={styles.mockupBar} style={{ height: '90%' }} />
                  <div className={styles.mockupBar} style={{ height: '75%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section
        ref={statsView.ref}
        className={`${styles.stats} ${statsView.visible ? styles.fadeInUp : styles.hidden}`}
      >
        {stats.map((s) => (
          <div key={s.label} className={styles.statItem}>
            <div className={styles.statValue}>
              <AnimatedCounter target={s.value} suffix={s.suffix} />
            </div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* Scenarios — Before/After */}
      <section
        id="senaryolar"
        ref={scenariosView.ref}
        className={`${styles.scenarios} ${scenariosView.visible ? styles.fadeInUp : styles.hidden}`}
      >
        <h2 className={styles.sectionTitle}>Size Tanıdık Geliyor mu?</h2>
        <p className={styles.sectionSubtitle}>İşletmelerin her gün yaşadığı sorunlara profesyonel çözümler</p>
        <div className={styles.scenariosGrid}>
          {scenarios.map((s, i) => (
            <div
              key={s.title}
              className={styles.scenarioCard}
              style={{ animationDelay: `${i * 0.1}s`, borderTopColor: s.color }}
            >
              <div className={styles.scenarioIcon}>{s.icon}</div>
              <h3 className={styles.scenarioTitle}>{s.title}</h3>
              <div className={styles.scenarioBefore}>
                <span className={styles.scenarioLabel} style={{ background: '#fee2e2', color: '#dc2626' }}>Öncesi</span>
                <p>{s.before}</p>
              </div>
              <div className={styles.scenarioAfter}>
                <span className={styles.scenarioLabel} style={{ background: '#dcfce7', color: '#16a34a' }}>Sonrası</span>
                <p>{s.after}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section
        id="ozellikler"
        ref={featuresView.ref}
        className={`${styles.features} ${featuresView.visible ? styles.fadeInUp : styles.hidden}`}
      >
        <h2 className={styles.sectionTitle}>Güçlü Özellikler</h2>
        <p className={styles.sectionSubtitle}>İşletmenizi büyütmek için ihtiyacınız olan tüm araçlar tek çatıda</p>
        <div className={styles.featuresGrid}>
          {features.map((f, i) => (
            <div key={f.title} className={styles.featureCard} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section
        ref={stepsView.ref}
        className={`${styles.steps} ${stepsView.visible ? styles.fadeInUp : styles.hidden}`}
      >
        <h2 className={styles.sectionTitle}>3 Adımda Başlayabilirsiniz</h2>
        <p className={styles.sectionSubtitle}>Kurulum yok, yükleme yok — hemen başlayabilirsiniz</p>
        <div className={styles.stepsGrid}>
          {steps.map((s, i) => (
            <div key={s.num} className={styles.stepCard} style={{ animationDelay: `${i * 0.15}s` }}>
              <div className={styles.stepNum}>{s.num}</div>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepDesc}>{s.desc}</p>
              {i < steps.length - 1 && <div className={styles.stepArrow}>→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section
        ref={testimonialsView.ref}
        className={`${styles.testimonials} ${testimonialsView.visible ? styles.fadeInUp : styles.hidden}`}
      >
        <h2 className={styles.sectionTitle}>Müşterilerimiz Ne Diyor?</h2>
        <p className={styles.sectionSubtitle}>Binlerce işletme StokSayaç ile büyüyor</p>
        <div className={styles.testimonialsGrid}>
          {testimonials.map((t) => (
            <div key={t.name} className={styles.testimonialCard}>
              <div className={styles.testimonialStars}>★★★★★</div>
              <p className={styles.testimonialText}>"{t.text}"</p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.testimonialAvatar}>{t.avatar}</div>
                <div>
                  <div className={styles.testimonialName}>{t.name}</div>
                  <div className={styles.testimonialRole}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section
        id="planlar"
        ref={plansView.ref}
        className={`${styles.plans} ${plansView.visible ? styles.fadeInUp : styles.hidden}`}
      >
        <h2 className={styles.sectionTitle}>Size Uygun Plan</h2>
        <p className={styles.sectionSubtitle}>Her büyüklükte işletme için esnek fiyatlandırma</p>
        <div className={styles.plansGrid}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`${styles.planCard} ${plan.popular ? styles.planPopular : ''}`}
            >
              {plan.popular && <span className={styles.planBadge}>En Popüler</span>}
              <h3 className={styles.planName}>{plan.name}</h3>
              <div className={styles.planPrice}>
                {plan.price}₺<span className={styles.planPeriod}>/ay</span>
              </div>
              <p className={styles.planUsers}>{plan.users}</p>
              <ul className={styles.planFeatures}>
                {plan.features.map((f) => (
                  <li key={f.text} className={f.included ? '' : styles.disabledFeature}>
                    <span className={f.included ? styles.checkIcon : styles.crossIcon}>
                      {f.included ? '✓' : '✗'}
                    </span>
                    {f.text}
                  </li>
                ))}
              </ul>
              <a href="#demo" className={`${styles.btnPrimary} ${plan.popular ? styles.btnGlow : ''}`}>
                Hemen Başla
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Form */}
      <section
        id="demo"
        ref={demoView.ref}
        className={`${styles.demoSection} ${demoView.visible ? styles.fadeInUp : styles.hidden}`}
      >
        <div className={styles.demoInner}>
          <div className={styles.demoInfo}>
            <h2 className={styles.demoTitle}>Ücretsiz Demo Başvurusu</h2>
            <p className={styles.demoSubtitle}>
              Formu doldurun, 45 gün boyunca tüm özellikleri ücretsiz deneyin.
              Ekibimiz en kısa sürede sizinle iletişime geçecektir.
            </p>
            <div className={styles.demoBenefits}>
              <div className={styles.demoBenefit}>
                <span className={styles.demoBenefitIcon}>✓</span>
                <span>45 gün ücretsiz deneme süresi</span>
              </div>
              <div className={styles.demoBenefit}>
                <span className={styles.demoBenefitIcon}>✓</span>
                <span>Kredi kartı gerekmez</span>
              </div>
              <div className={styles.demoBenefit}>
                <span className={styles.demoBenefitIcon}>✓</span>
                <span>Tüm özellikler açık</span>
              </div>
              <div className={styles.demoBenefit}>
                <span className={styles.demoBenefitIcon}>✓</span>
                <span>Ücretsiz kurulum desteği</span>
              </div>
              <div className={styles.demoBenefit}>
                <span className={styles.demoBenefitIcon}>✓</span>
                <span>İstediğiniz zaman iptal edin</span>
              </div>
            </div>
          </div>
          <div className={styles.demoFormWrapper}>
            <DemoForm />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        ref={ctaView.ref}
        className={`${styles.cta} ${ctaView.visible ? styles.fadeInUp : styles.hidden}`}
      >
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>İşletmenizi Dijitale Taşımanın Zamanı Geldi</h2>
          <p className={styles.ctaText}>
            45 gün boyunca tüm özellikleri ücretsiz deneyin. Memnun kalmazsanız hiçbir ücret ödemezsiniz.
          </p>
          <div className={styles.ctaButtons}>
            <a href="#demo" className={`${styles.btnPrimary} ${styles.btnLarge} ${styles.btnGlow}`}>
              Ücretsiz Demo Başvurusu
            </a>
            <a
              href="https://wa.me/905350739908"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.btnOutline} ${styles.btnLarge} ${styles.btnWhite}`}
            >
              WhatsApp ile Bilgi Alın
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerCol}>
            <Logo size="sm" dark />
            <p className={styles.footerAbout}>
              İşletmeniz için geliştirilmiş profesyonel stok ve satış yönetim platformu.
            </p>
          </div>
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Hızlı Erişim</h4>
            <Link to="/login" className={styles.footerLink}>Giriş Yap</Link>
            <a href="#demo" className={styles.footerLink}>Demo Başvurusu</a>
            <a href="#planlar" className={styles.footerLink}>Planlar</a>
          </div>
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>İletişim</h4>
            <a href="https://wa.me/905350739908" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
              📱 0535 073 99 08
            </a>
            <a href="mailto:info@stoksayac.com" className={styles.footerLink}>
              ✉️ info@stoksayac.com
            </a>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; 2026 Pancar Bilgi Teknolojileri ve Yazılım Hizmetleri Ltd. Şti. Tüm hakları saklıdır.</p>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/905350739908"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.whatsappBtn}
        aria-label="WhatsApp ile iletişime geçin"
      >
        <svg className={styles.whatsappIcon} viewBox="0 0 32 32" fill="white">
          <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.924 15.924 0 0016.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.335 22.594c-.39 1.1-1.932 2.014-3.168 2.28-.846.18-1.95.324-5.67-1.218-4.762-1.972-7.826-6.798-8.064-7.114-.23-.316-1.932-2.572-1.932-4.904s1.222-3.48 1.656-3.956c.434-.476.948-.594 1.264-.594.316 0 .632.002.908.016.292.016.684-.11 1.07.816.39.948 1.328 3.242 1.444 3.478.118.236.196.512.04.826-.158.316-.236.512-.472.788-.236.276-.496.616-.71.826-.236.236-.482.492-.206.964.276.472 1.226 2.022 2.632 3.276 1.812 1.614 3.34 2.114 3.814 2.35.472.236.75.198 1.026-.118.276-.316 1.184-1.382 1.5-1.856.316-.476.632-.394 1.066-.236.434.158 2.728 1.286 3.196 1.52.468.236.78.354.896.55.118.196.118 1.128-.272 2.226z" />
        </svg>
      </a>
    </div>
  );
}
