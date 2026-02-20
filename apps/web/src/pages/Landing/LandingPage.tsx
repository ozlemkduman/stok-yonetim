import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import styles from './LandingPage.module.css';

/* ── Data ── */

const features = [
  { icon: '📦', title: 'Stok Takibi', desc: 'Urunlerinizi kategorilere ayirin, stok seviyelerini anlik takip edin. Kritik stok uyarilari ile hic bir urunu kaybetmeyin.' },
  { icon: '💰', title: 'Satis Yonetimi', desc: 'Satislarinizi kaydedin, faturalayin ve tek ekranda tum satis gecmisinizi goruntuleyin.' },
  { icon: '🧾', title: 'e-Belge', desc: 'e-Fatura ve e-Arsiv belgelerinizi saniyeler icinde olusturun, musterilerinize gonderin.' },
  { icon: '📊', title: 'Raporlama', desc: 'Detayli satis, stok ve kar/zarar raporlari ile isletmenizin nabzini tutun.' },
  { icon: '👥', title: 'CRM', desc: 'Musterilerinizi yonetin, iletisim gecmisini takip edin, satis firsatlarini kacirmayin.' },
  { icon: '🏭', title: 'Depo Yonetimi', desc: 'Birden fazla depo ile stok transferlerini ve hareketlerini kolayca yonetin.' },
];

const scenarios = [
  {
    icon: '🔍',
    title: 'Stokta Ne Kaldi?',
    before: 'Depoya gidip tek tek sayiyorsunuz, Excel\'e yaziyorsunuz, yine de rakamlar tutmuyor.',
    after: 'Telefonunuzdan anlik stok durumunu gorun. Kritik seviyeye dusen urunler icin otomatik uyari alin.',
    color: '#4361ee',
  },
  {
    icon: '🧾',
    title: 'Fatura Takibi',
    before: 'Faturalariniz baska portalde, satislariniz baska yerde — eslestirmek icin saatler harciyorsunuz.',
    after: 'e-Fatura XML dosyanizi sisteme aktarin, satislarla otomatik eslesin. Tum belgeler tek ekranda.',
    color: '#f72585',
  },
  {
    icon: '📉',
    title: 'Kar mi Ediyorum?',
    before: 'Ay sonunda hesap makinesi ile topluyorsunuz, gercek kari bulmak imkansiz.',
    after: 'Anlik kar/zarar raporlari, urun bazli karlilik analizi — kararlarinizi veriye dayali verin.',
    color: '#7209b7',
  },
  {
    icon: '🤝',
    title: 'Musteri Kayboldu',
    before: 'Musteri bilgileri defterde, kim ne aldi hatirlamiyorsunuz, tekrar satis firsatlari kacti.',
    after: 'Tum musteri gecmisi tek ekranda. Son alisveris, odeme durumu, notlar — her sey elinizin altinda.',
    color: '#e63946',
  },
  {
    icon: '🏪',
    title: 'Coklu Depo Cefasi',
    before: 'Hangi depoda ne var bilinmiyor, transferler kagit uzerinde, kayiplar artik normal.',
    after: 'Depolar arasi transfer tek tikla. Her deponun stok durumunu anlik izleyin, fark varsa aninda gorun.',
    color: '#2ec4b6',
  },
  {
    icon: '📱',
    title: 'Sahada Kopukluk',
    before: 'Saha ekibi ofisi arasin mi, WhatsApp\'tan resim mi gondersin — bilgi akisi kopuk.',
    after: 'Saha ekibi mobilde siparis girsin, rota planlama ile zaman kazansin, anlik senkronizasyon.',
    color: '#ff9f1c',
  },
];

const stats = [
  { value: 1200, suffix: '+', label: 'Aktif Isletme' },
  { value: 50000, suffix: '+', label: 'Aylik Islem' },
  { value: 99.9, suffix: '%', label: 'Uptime' },
  { value: 7, suffix: '/24', label: 'Destek' },
];

const testimonials = [
  {
    name: 'Ahmet Y.',
    role: 'Market Sahibi',
    text: 'Eskiden stok sayimi icin 2 gun harciyordum. Simdi telefonumdan aninda gorebiliyorum. Hayat kurtaran bir sistem.',
    avatar: 'AY',
  },
  {
    name: 'Fatma K.',
    role: 'Toptan Gida',
    text: 'e-Fatura entegrasyonu muhtesem. Eskiden her fatura icin 10 dakika harciyordum, simdi tek tikla hazirlaniyor.',
    avatar: 'FK',
  },
  {
    name: 'Mehmet S.',
    role: 'Yedek Parca',
    text: '3 depomuz var ve transferler hep sorundu. StokSayac ile hangi depoda ne var aninda goruyoruz. Kayiplarimiz sifirlandi.',
    avatar: 'MS',
  },
];

const steps = [
  { num: '1', title: 'Kayit Olun', desc: 'Ucretsiz hesabinizi 30 saniyede olusturun. Kredi karti gerekmez.' },
  { num: '2', title: 'Urunleri Ekleyin', desc: 'Urunlerinizi tek tek veya toplu olarak sisteme aktarin.' },
  { num: '3', title: 'Yonetmeye Baslayin', desc: 'Satis, stok, fatura — her seyi tek panelden yonetin.' },
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
    users: '1 Kullanici / 200 Urun / 100 Musteri',
    features: [
      { text: 'Stok Takibi', included: true },
      { text: 'Satis & Iade', included: true },
      { text: '5 GB Depolama', included: true },
      { text: 'Teklif Yonetimi', included: false },
      { text: 'Fatura Import (XML)', included: false },
      { text: 'e-Belge', included: false },
      { text: 'Coklu Depo', included: false },
      { text: 'Entegrasyonlar', included: false },
      { text: 'Gelismis Raporlama', included: false },
      { text: 'CRM', included: false },
      { text: 'Saha Ekibi', included: false },
      { text: 'API Erisimi', included: false },
    ],
  },
  {
    name: 'Pro',
    price: '449',
    users: '5 Kullanici / 5.000 Urun / 2.000 Musteri',
    popular: true,
    features: [
      { text: 'Stok Takibi', included: true },
      { text: 'Satis & Iade', included: true },
      { text: '25 GB Depolama', included: true },
      { text: 'Teklif Yonetimi', included: true },
      { text: 'Fatura Import (XML)', included: true },
      { text: 'e-Belge', included: true },
      { text: 'Coklu Depo (3 Depo)', included: true },
      { text: 'Entegrasyonlar (3 Adet)', included: true },
      { text: 'Gelismis Raporlama', included: true },
      { text: 'CRM', included: false },
      { text: 'Saha Ekibi', included: false },
      { text: 'API Erisimi', included: false },
    ],
  },
  {
    name: 'Plus',
    price: '799',
    users: 'Sinirsiz Kullanici, Urun & Musteri',
    features: [
      { text: 'Stok Takibi', included: true },
      { text: 'Satis & Iade', included: true },
      { text: '100 GB Depolama', included: true },
      { text: 'Teklif Yonetimi', included: true },
      { text: 'Fatura Import (XML)', included: true },
      { text: 'e-Belge', included: true },
      { text: 'Sinirsiz Depo', included: true },
      { text: 'Sinirsiz Entegrasyon', included: true },
      { text: 'Gelismis Raporlama', included: true },
      { text: 'CRM', included: true },
      { text: 'Saha Ekibi', included: true },
      { text: 'API Erisimi', included: true },
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

/* ── Component ── */

export function LandingPage() {
  const scenariosView = useInView(0.1);
  const statsView = useInView(0.2);
  const featuresView = useInView(0.1);
  const stepsView = useInView(0.15);
  const testimonialsView = useInView(0.1);
  const plansView = useInView(0.1);
  const ctaView = useInView(0.2);

  return (
    <div className={styles.landing}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <span className={styles.logo}>
          Stok<span className={styles.logoAccent}>Sayac</span>
        </span>
        <div className={styles.navLinks}>
          <a href="#ozellikler" className={styles.navLink}>Ozellikler</a>
          <a href="#planlar" className={styles.navLink}>Planlar</a>
          <a href="https://wa.me/905350739908" target="_blank" rel="noopener noreferrer" className={styles.navLink}>Iletisim</a>
        </div>
        <div className={styles.navButtons}>
          <Link to="/login" className={styles.btnOutline}>Giris Yap</Link>
          <Link to="/register" className={styles.btnPrimary}>Ucretsiz Dene</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>Turkiye'nin Yeni Nesil Stok Yonetim Platformu</div>
          <h1 className={styles.heroTitle}>
            Isletmenizi<br />
            <span className={styles.heroHighlight}>Dijitale Tasiyoruz</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Stok takibi, satis yonetimi, e-Fatura, raporlama ve CRM — hepsi tek platformda.
            Excel dosyalarina, dagilan bilgilere ve kayip stoklara elveda deyin.
          </p>
          <div className={styles.heroButtons}>
            <Link to="/register" className={`${styles.btnPrimary} ${styles.btnLarge} ${styles.btnGlow}`}>
              14 Gun Ucretsiz Dene
            </Link>
            <a href="#senaryolar" className={`${styles.btnOutline} ${styles.btnLarge}`}>
              Nasil Calisir?
            </a>
          </div>
          <p className={styles.heroNote}>Kredi karti gerekmez &middot; Hemen baslayabilirsiniz</p>
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
                    <div className={styles.mockupStatValue}>2,847</div>
                    <div className={styles.mockupStatLabel}>Toplam Urun</div>
                  </div>
                  <div className={styles.mockupStat} style={{ background: 'linear-gradient(135deg, #22c55e20, #22c55e05)' }}>
                    <div className={styles.mockupStatValue}>₺48.2K</div>
                    <div className={styles.mockupStatLabel}>Aylik Satis</div>
                  </div>
                  <div className={styles.mockupStat} style={{ background: 'linear-gradient(135deg, #f7258520, #f7258505)' }}>
                    <div className={styles.mockupStatValue}>142</div>
                    <div className={styles.mockupStatLabel}>Musteri</div>
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
        <h2 className={styles.sectionTitle}>Size Tanidik Geliyor mu?</h2>
        <p className={styles.sectionSubtitle}>Isletmelerin her gun yasadigi sorunlara profesyonel cozumler</p>
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
                <span className={styles.scenarioLabel} style={{ background: '#fee2e2', color: '#dc2626' }}>Oncesi</span>
                <p>{s.before}</p>
              </div>
              <div className={styles.scenarioAfter}>
                <span className={styles.scenarioLabel} style={{ background: '#dcfce7', color: '#16a34a' }}>Sonrasi</span>
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
        <h2 className={styles.sectionTitle}>Guclu Ozellikler</h2>
        <p className={styles.sectionSubtitle}>Isletmenizi buyutmek icin ihtiyaciniz olan tum araclar tek catida</p>
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
        <h2 className={styles.sectionTitle}>3 Adimda Baslayabilirsiniz</h2>
        <p className={styles.sectionSubtitle}>Kurulum yok, yukleme yok — hemen baslayabilirsiniz</p>
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
        <h2 className={styles.sectionTitle}>Musterilerimiz Ne Diyor?</h2>
        <p className={styles.sectionSubtitle}>Binlerce isletme StokSayac ile buyuyor</p>
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
        <p className={styles.sectionSubtitle}>Her buyuklukte isletme icin esnek fiyatlandirma</p>
        <div className={styles.plansGrid}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`${styles.planCard} ${plan.popular ? styles.planPopular : ''}`}
            >
              {plan.popular && <span className={styles.planBadge}>En Populer</span>}
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
              <Link to="/register" className={`${styles.btnPrimary} ${plan.popular ? styles.btnGlow : ''}`}>
                Hemen Basla
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        ref={ctaView.ref}
        className={`${styles.cta} ${ctaView.visible ? styles.fadeInUp : styles.hidden}`}
      >
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>Isletmenizi Dijitale Tasimayin Zamani Geldi</h2>
          <p className={styles.ctaText}>
            14 gun boyunca tum ozellikleri ucretsiz deneyin. Memnun kalmazsaniz hicbir ucret odemezsiniz.
          </p>
          <div className={styles.ctaButtons}>
            <Link to="/register" className={`${styles.btnPrimary} ${styles.btnLarge} ${styles.btnGlow}`}>
              Ucretsiz Deneyin
            </Link>
            <a
              href="https://wa.me/905350739908"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.btnOutline} ${styles.btnLarge} ${styles.btnWhite}`}
            >
              WhatsApp ile Bilgi Alin
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerCol}>
            <span className={styles.footerLogo}>
              Stok<span className={styles.logoAccent}>Sayac</span>
            </span>
            <p className={styles.footerAbout}>
              Isletmeniz icin gelistirilmis profesyonel stok ve satis yonetim platformu.
            </p>
          </div>
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Hizli Erisim</h4>
            <Link to="/login" className={styles.footerLink}>Giris Yap</Link>
            <Link to="/register" className={styles.footerLink}>Kayit Ol</Link>
            <a href="#planlar" className={styles.footerLink}>Planlar</a>
          </div>
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Iletisim</h4>
            <a href="https://wa.me/905350739908" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
              📱 0535 073 99 08
            </a>
            <a href="mailto:info@stoksayac.com" className={styles.footerLink}>
              ✉️ info@stoksayac.com
            </a>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; 2026 Pancar Bilgi Teknolojileri ve Yazilim Hizmetleri Ltd. Sti. Tum haklari saklidir.</p>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/905350739908"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.whatsappBtn}
        aria-label="WhatsApp ile iletisime gecin"
      >
        <svg className={styles.whatsappIcon} viewBox="0 0 32 32" fill="white">
          <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.924 15.924 0 0016.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.335 22.594c-.39 1.1-1.932 2.014-3.168 2.28-.846.18-1.95.324-5.67-1.218-4.762-1.972-7.826-6.798-8.064-7.114-.23-.316-1.932-2.572-1.932-4.904s1.222-3.48 1.656-3.956c.434-.476.948-.594 1.264-.594.316 0 .632.002.908.016.292.016.684-.11 1.07.816.39.948 1.328 3.242 1.444 3.478.118.236.196.512.04.826-.158.316-.236.512-.472.788-.236.276-.496.616-.71.826-.236.236-.482.492-.206.964.276.472 1.226 2.022 2.632 3.276 1.812 1.614 3.34 2.114 3.814 2.35.472.236.75.198 1.026-.118.276-.316 1.184-1.382 1.5-1.856.316-.476.632-.394 1.066-.236.434.158 2.728 1.286 3.196 1.52.468.236.78.354.896.55.118.196.118 1.128-.272 2.226z" />
        </svg>
      </a>
    </div>
  );
}
