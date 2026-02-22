import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Logo } from '../../components/Logo';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import styles from './LandingPage.module.css';

/* ── Data ── */

const featureIcons = ['📦', '💰', '🧾', '📊', '👥', '🏭'];

const scenarioMeta = [
  { icon: '🔍', color: '#4361ee' },
  { icon: '🧾', color: '#f72585' },
  { icon: '📉', color: '#7209b7' },
  { icon: '🤝', color: '#e63946' },
  { icon: '🏪', color: '#2ec4b6' },
  { icon: '📱', color: '#ff9f1c' },
];

const statMeta = [
  { value: 1200, suffix: '+' },
  { value: 50000, suffix: '+' },
  { value: 99.9, suffix: '%' },
  { value: 7, suffix: '/24' },
];

interface PlanDef {
  key: string;
  name: string;
  price: string;
  popular?: boolean;
  featureKeys: { key: string; included: boolean }[];
}

const planDefs: PlanDef[] = [
  {
    key: 'basic',
    name: 'Basic',
    price: '199',
    featureKeys: [
      { key: 'stockTracking', included: true },
      { key: 'salesReturn', included: true },
      { key: 'storage5', included: true },
      { key: 'quoteManagement', included: false },
      { key: 'invoiceImport', included: false },
      { key: 'eDocument', included: false },
      { key: 'multiWarehouse', included: false },
      { key: 'integrations', included: false },
      { key: 'advancedReporting', included: false },
      { key: 'crm', included: false },
      { key: 'fieldTeam', included: false },
      { key: 'apiAccess', included: false },
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '449',
    popular: true,
    featureKeys: [
      { key: 'stockTracking', included: true },
      { key: 'salesReturn', included: true },
      { key: 'storage25', included: true },
      { key: 'quoteManagement', included: true },
      { key: 'invoiceImport', included: true },
      { key: 'eDocument', included: true },
      { key: 'multiWarehouse', included: true },
      { key: 'integrations', included: true },
      { key: 'advancedReporting', included: true },
      { key: 'crm', included: false },
      { key: 'fieldTeam', included: false },
      { key: 'apiAccess', included: false },
    ],
  },
  {
    key: 'plus',
    name: 'Plus',
    price: '799',
    featureKeys: [
      { key: 'stockTracking', included: true },
      { key: 'salesReturn', included: true },
      { key: 'storage100', included: true },
      { key: 'quoteManagement', included: true },
      { key: 'invoiceImport', included: true },
      { key: 'eDocument', included: true },
      { key: 'unlimitedWarehouse', included: true },
      { key: 'unlimitedIntegrations', included: true },
      { key: 'advancedReporting', included: true },
      { key: 'crm', included: true },
      { key: 'fieldTeam', included: true },
      { key: 'apiAccess', included: true },
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
  const { t } = useTranslation('landing');
  const [form, setForm] = useState({ name: '', phone: '', company: '', sector: '', note: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(`${apiBase}/contact/demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          company: form.company || undefined,
          sector: form.sector || undefined,
          note: form.note || undefined,
        }),
      });

      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setError(t('demo.form.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={styles.formSuccess}>
        <div className={styles.formSuccessIcon}>✓</div>
        <h3 className={styles.formSuccessTitle}>{t('demo.success.title')}</h3>
        <p className={styles.formSuccessText}>
          {t('demo.success.text1')}<br />
          {t('demo.success.text2')}
        </p>
        <button
          className={styles.btnOutline}
          onClick={() => { setSubmitted(false); setForm({ name: '', phone: '', company: '', sector: '', note: '' }); }}
        >
          {t('demo.success.newApplication')}
        </button>
      </div>
    );
  }

  return (
    <form className={styles.demoForm} onSubmit={handleSubmit}>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('demo.form.nameLabel')}</label>
          <input
            type="text"
            required
            className={styles.formInput}
            placeholder={t('demo.form.namePlaceholder')}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('demo.form.phoneLabel')}</label>
          <input
            type="tel"
            required
            className={styles.formInput}
            placeholder={t('demo.form.phonePlaceholder')}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
      </div>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('demo.form.companyLabel')}</label>
          <input
            type="text"
            className={styles.formInput}
            placeholder={t('demo.form.companyPlaceholder')}
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('demo.form.sectorLabel')}</label>
          <select
            className={styles.formInput}
            value={form.sector}
            onChange={(e) => setForm({ ...form, sector: e.target.value })}
          >
            <option value="">{t('demo.form.sectorPlaceholder')}</option>
            <option value="Perakende">{t('demo.form.sectors.retail')}</option>
            <option value="Toptan">{t('demo.form.sectors.wholesale')}</option>
            <option value="Gıda">{t('demo.form.sectors.food')}</option>
            <option value="Tekstil">{t('demo.form.sectors.textile')}</option>
            <option value="Yedek Parça">{t('demo.form.sectors.spareParts')}</option>
            <option value="Elektronik">{t('demo.form.sectors.electronics')}</option>
            <option value="İnşaat / Yapı Malzemesi">{t('demo.form.sectors.construction')}</option>
            <option value="Kozmetik">{t('demo.form.sectors.cosmetics')}</option>
            <option value="Diğer">{t('demo.form.sectors.other')}</option>
          </select>
        </div>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>{t('demo.form.noteLabel')}</label>
        <textarea
          className={`${styles.formInput} ${styles.formTextarea}`}
          placeholder={t('demo.form.notePlaceholder')}
          rows={3}
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
      </div>
      {error && <p style={{ color: '#ef4444', fontSize: '14px', margin: '0 0 12px' }}>{error}</p>}
      <button type="submit" disabled={submitting} className={`${styles.btnPrimary} ${styles.btnLarge} ${styles.btnGlow} ${styles.formSubmitBtn}`}>
        {submitting ? t('demo.form.submitting') : t('demo.form.submit')}
      </button>
      <p className={styles.formNote}>{t('demo.form.formNote')}</p>
    </form>
  );
}

/* ── Component ── */

export function LandingPage() {
  const { t } = useTranslation('landing');
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
          <a href="#ozellikler" className={styles.navLink}>{t('nav.features')}</a>
          <a href="#planlar" className={styles.navLink}>{t('nav.plans')}</a>
          <a href="#demo" className={styles.navLink}>{t('nav.demo')}</a>
          <a href="#demo" className={styles.navLink}>{t('nav.contact')}</a>
        </div>
        <div className={styles.navButtons}>
          <LanguageSwitcher />
          <Link to="/login" className={styles.btnOutline}>{t('nav.login')}</Link>
          <a href="#demo" className={styles.btnPrimary}>{t('nav.freeTrial')}</a>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>{t('hero.badge')}</div>
          <h1 className={styles.heroTitle}>
            {t('hero.titleLine1')}<br />
            <span className={styles.heroHighlight}>{t('hero.titleHighlight')}</span>
          </h1>
          <p className={styles.heroSubtitle}>
            {t('hero.subtitle')}
          </p>
          <div className={styles.heroButtons}>
            <a href="#demo" className={`${styles.btnPrimary} ${styles.btnLarge} ${styles.btnGlow}`}>
              {t('hero.ctaPrimary')}
            </a>
            <a href="#senaryolar" className={`${styles.btnOutline} ${styles.btnLarge}`}>
              {t('hero.ctaSecondary')}
            </a>
          </div>
          <p className={styles.heroNote}>{t('hero.note')}</p>
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
                    <div className={styles.mockupStatLabel}>{t('mockup.totalProducts')}</div>
                  </div>
                  <div className={styles.mockupStat} style={{ background: 'linear-gradient(135deg, #22c55e20, #22c55e05)' }}>
                    <div className={styles.mockupStatValue}>₺48.2K</div>
                    <div className={styles.mockupStatLabel}>{t('mockup.monthlySales')}</div>
                  </div>
                  <div className={styles.mockupStat} style={{ background: 'linear-gradient(135deg, #f7258520, #f7258505)' }}>
                    <div className={styles.mockupStatValue}>142</div>
                    <div className={styles.mockupStatLabel}>{t('mockup.customers')}</div>
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
        {statMeta.map((s, i) => (
          <div key={i} className={styles.statItem}>
            <div className={styles.statValue}>
              <AnimatedCounter target={s.value} suffix={s.suffix} />
            </div>
            <div className={styles.statLabel}>{t(`stats.${i}.label`)}</div>
          </div>
        ))}
      </section>

      {/* Scenarios — Before/After */}
      <section
        id="senaryolar"
        ref={scenariosView.ref}
        className={`${styles.scenarios} ${scenariosView.visible ? styles.fadeInUp : styles.hidden}`}
      >
        <h2 className={styles.sectionTitle}>{t('scenarios.title')}</h2>
        <p className={styles.sectionSubtitle}>{t('scenarios.subtitle')}</p>
        <div className={styles.scenariosGrid}>
          {scenarioMeta.map((s, i) => (
            <div
              key={i}
              className={styles.scenarioCard}
              style={{ animationDelay: `${i * 0.1}s`, borderTopColor: s.color }}
            >
              <div className={styles.scenarioIcon}>{s.icon}</div>
              <h3 className={styles.scenarioTitle}>{t(`scenarios.${i}.title`)}</h3>
              <div className={styles.scenarioBefore}>
                <span className={styles.scenarioLabel} style={{ background: '#fee2e2', color: '#dc2626' }}>{t('scenarios.beforeLabel')}</span>
                <p>{t(`scenarios.${i}.before`)}</p>
              </div>
              <div className={styles.scenarioAfter}>
                <span className={styles.scenarioLabel} style={{ background: '#dcfce7', color: '#16a34a' }}>{t('scenarios.afterLabel')}</span>
                <p>{t(`scenarios.${i}.after`)}</p>
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
        <h2 className={styles.sectionTitle}>{t('features.title')}</h2>
        <p className={styles.sectionSubtitle}>{t('features.subtitle')}</p>
        <div className={styles.featuresGrid}>
          {featureIcons.map((icon, i) => (
            <div key={i} className={styles.featureCard} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className={styles.featureIcon}>{icon}</div>
              <h3 className={styles.featureTitle}>{t(`features.${i}.title`)}</h3>
              <p className={styles.featureDesc}>{t(`features.${i}.desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section
        ref={stepsView.ref}
        className={`${styles.steps} ${stepsView.visible ? styles.fadeInUp : styles.hidden}`}
      >
        <h2 className={styles.sectionTitle}>{t('steps.title')}</h2>
        <p className={styles.sectionSubtitle}>{t('steps.subtitle')}</p>
        <div className={styles.stepsGrid}>
          {[0, 1, 2].map((i) => (
            <div key={i} className={styles.stepCard} style={{ animationDelay: `${i * 0.15}s` }}>
              <div className={styles.stepNum}>{i + 1}</div>
              <h3 className={styles.stepTitle}>{t(`steps.${i}.title`)}</h3>
              <p className={styles.stepDesc}>{t(`steps.${i}.desc`)}</p>
              {i < 2 && <div className={styles.stepArrow}>→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section
        ref={testimonialsView.ref}
        className={`${styles.testimonials} ${testimonialsView.visible ? styles.fadeInUp : styles.hidden}`}
      >
        <h2 className={styles.sectionTitle}>{t('testimonials.title')}</h2>
        <p className={styles.sectionSubtitle}>{t('testimonials.subtitle')}</p>
        <div className={styles.testimonialsGrid}>
          {[0, 1, 2].map((i) => (
            <div key={i} className={styles.testimonialCard}>
              <div className={styles.testimonialStars}>★★★★★</div>
              <p className={styles.testimonialText}>"{t(`testimonials.${i}.text`)}"</p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.testimonialAvatar}>{t(`testimonials.${i}.avatar`)}</div>
                <div>
                  <div className={styles.testimonialName}>{t(`testimonials.${i}.name`)}</div>
                  <div className={styles.testimonialRole}>{t(`testimonials.${i}.role`)}</div>
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
        <h2 className={styles.sectionTitle}>{t('plans.title')}</h2>
        <p className={styles.sectionSubtitle}>{t('plans.subtitle')}</p>
        <div className={styles.plansGrid}>
          {planDefs.map((plan) => (
            <div
              key={plan.name}
              className={`${styles.planCard} ${plan.popular ? styles.planPopular : ''}`}
            >
              {plan.popular && <span className={styles.planBadge}>{t('plans.popular')}</span>}
              <h3 className={styles.planName}>{plan.name}</h3>
              <div className={styles.planPrice}>
                {plan.price}₺<span className={styles.planPeriod}>{t('plans.perMonth')}</span>
              </div>
              <p className={styles.planUsers}>{t(`plans.${plan.key}.users`)}</p>
              <ul className={styles.planFeatures}>
                {plan.featureKeys.map((f) => (
                  <li key={f.key} className={f.included ? '' : styles.disabledFeature}>
                    <span className={f.included ? styles.checkIcon : styles.crossIcon}>
                      {f.included ? '✓' : '✗'}
                    </span>
                    {t(`plans.${plan.key}.features.${f.key}`)}
                  </li>
                ))}
              </ul>
              <a href="#demo" className={`${styles.btnPrimary} ${plan.popular ? styles.btnGlow : ''}`}>
                {t('plans.cta')}
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
            <h2 className={styles.demoTitle}>{t('demo.title')}</h2>
            <p className={styles.demoSubtitle}>
              {t('demo.subtitle')}
            </p>
            <div className={styles.demoBenefits}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className={styles.demoBenefit}>
                  <span className={styles.demoBenefitIcon}>✓</span>
                  <span>{t(`demo.benefits.${i}`)}</span>
                </div>
              ))}
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
          <h2 className={styles.ctaTitle}>{t('cta.title')}</h2>
          <p className={styles.ctaText}>
            {t('cta.text')}
          </p>
          <div className={styles.ctaButtons}>
            <a href="#demo" className={`${styles.btnPrimary} ${styles.btnLarge} ${styles.btnGlow}`}>
              {t('cta.primary')}
            </a>
            <a
              href="https://wa.me/905350739908"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.btnOutline} ${styles.btnLarge} ${styles.btnWhite}`}
            >
              {t('cta.whatsapp')}
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
              {t('footer.about')}
            </p>
          </div>
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>{t('footer.quickAccess')}</h4>
            <Link to="/login" className={styles.footerLink}>{t('footer.login')}</Link>
            <a href="#demo" className={styles.footerLink}>{t('footer.demoApplication')}</a>
            <a href="#planlar" className={styles.footerLink}>{t('footer.plans')}</a>
          </div>
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>{t('footer.contact')}</h4>
            <a href="https://wa.me/905350739908" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
              📱 0535 073 99 08
            </a>
            <a href="mailto:info@stoksayac.com" className={styles.footerLink}>
              ✉️ info@stoksayac.com
            </a>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>{t('footer.copyright')}</p>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/905350739908"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.whatsappBtn}
        aria-label={t('whatsappAriaLabel')}
      >
        <svg className={styles.whatsappIcon} viewBox="0 0 32 32" fill="white">
          <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.924 15.924 0 0016.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.335 22.594c-.39 1.1-1.932 2.014-3.168 2.28-.846.18-1.95.324-5.67-1.218-4.762-1.972-7.826-6.798-8.064-7.114-.23-.316-1.932-2.572-1.932-4.904s1.222-3.48 1.656-3.956c.434-.476.948-.594 1.264-.594.316 0 .632.002.908.016.292.016.684-.11 1.07.816.39.948 1.328 3.242 1.444 3.478.118.236.196.512.04.826-.158.316-.236.512-.472.788-.236.276-.496.616-.71.826-.236.236-.482.492-.206.964.276.472 1.226 2.022 2.632 3.276 1.812 1.614 3.34 2.114 3.814 2.35.472.236.75.198 1.026-.118.276-.316 1.184-1.382 1.5-1.856.316-.476.632-.394 1.066-.236.434.158 2.728 1.286 3.196 1.52.468.236.78.354.896.55.118.196.118 1.128-.272 2.226z" />
        </svg>
      </a>
    </div>
  );
}
