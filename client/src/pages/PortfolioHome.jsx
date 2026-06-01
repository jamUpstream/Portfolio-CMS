import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, Moon, Sun } from 'lucide-react';
import Icon from '../components/Icon';
import Skeleton from '../components/Skeleton';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../lib/api';
import { applyPortfolioSettings, parsePortfolioSettings } from '../lib/portfolioTheme';

const endpointMap = {
  profile: '/profile',
  projects: '/projects',
  experience: '/experience',
  education: '/education',
  certificates: '/certificates',
  skills: '/skills',
  services: '/services',
  testimonials: '/testimonials',
  socials: '/social-links',
  settings: '/site-settings'
};

const portfolioCacheKey = 'portfolio-public-cache-v2';
const portfolioCacheTtlMs = 5 * 60 * 1000;
const emptyPortfolioData = {
  profile: null,
  projects: [],
  experience: [],
  education: [],
  certificates: [],
  skills: [],
  services: [],
  testimonials: [],
  socials: [],
  settings: {}
};

function readCachedPortfolioData() {
  try {
    const cached = JSON.parse(localStorage.getItem(portfolioCacheKey) || 'null');
    if (!cached) return null;
    if (cached.payload) {
      return {
        payload: { ...emptyPortfolioData, ...(cached.payload ?? {}) },
        isFresh: typeof cached.storedAt === 'number' && (Date.now() - cached.storedAt) < portfolioCacheTtlMs
      };
    }
    return { payload: { ...emptyPortfolioData, ...cached }, isFresh: false };
  } catch {
    return null;
  }
}

function cachePortfolioData(payload) {
  try {
    localStorage.setItem(portfolioCacheKey, JSON.stringify({ payload, storedAt: Date.now() }));
  } catch {
    // Ignore storage limits or privacy-mode failures; cache is only a speed boost.
  }
}

async function fetchPortfolioData() {
  try {
    const payload = await api.get('/portfolio', { cache: 'no-store' });
    return { ...emptyPortfolioData, ...(payload ?? {}) };
  } catch {
    const results = await Promise.allSettled(
      Object.entries(endpointMap).map(([key, path]) => api.get(path, { cache: 'no-store' }).then((value) => [key, value]))
    );
    const fulfilled = results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value);
    return { ...emptyPortfolioData, ...Object.fromEntries(fulfilled) };
  }
}

function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('is-visible', entry.isIntersecting));
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

export default function PortfolioHome() {
  const [cached] = useState(() => readCachedPortfolioData());
  const [data, setData] = useState(() => cached?.payload ?? null);
  const [loading, setLoading] = useState(() => !cached?.payload);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { mode, toggleMode } = useTheme();
  useReveal();

  useEffect(() => {
    let cancelled = false;
    if (cached?.isFresh) setLoading(false);

    fetchPortfolioData()
      .then((next) => {
        if (cancelled) return;
        applyPortfolioSettings(next.settings, mode);
        setData(next);
        cachePortfolioData(next);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cached?.isFresh]);

  useEffect(() => {
    if (data?.settings) applyPortfolioSettings(data.settings, mode);
  }, [data?.settings, mode]);

  useEffect(() => {
    function updateBackToTop() {
      setShowBackToTop(window.scrollY > 420);
    }

    updateBackToTop();
    window.addEventListener('scroll', updateBackToTop, { passive: true });
    return () => window.removeEventListener('scroll', updateBackToTop);
  }, []);

  const settings = useMemo(() => parsePortfolioSettings(data?.settings ?? {}, mode), [data, mode]);
  const groupedSkills = useMemo(() => {
    return (data?.skills ?? []).reduce((groups, skill) => {
      groups[skill.category || 'General'] = [...(groups[skill.category || 'General'] ?? []), skill];
      return groups;
    }, {});
  }, [data]);

  if (!data) return <PortfolioLoading mode={mode} />;

  const profile = data.profile ?? {};
  const heroClasses = [
    'hero',
    `hero-${settings.heroTemplate}`,
    `hero-heading-${settings.heroHeadingPosition}`,
    `hero-tagline-${settings.heroTaglinePosition}`,
    `hero-buttons-${settings.heroButtonPosition === 'follow' ? settings.heroTaglinePosition : settings.heroButtonPosition}`,
    `hero-size-${settings.heroTextSize}`,
    `hero-image-${settings.heroImageShape}`,
    settings.showHeroImage ? '' : 'hero-no-image'
  ].filter(Boolean).join(' ');

  const sectionRenderers = {
    about: () => settings.visible.about !== false ? (
      <section className="section section-about reveal" key="about">
        <h2>About</h2>
        <div className="rich-text" dangerouslySetInnerHTML={{ __html: profile.bio || '<p>Add your story from the admin panel.</p>' }} />
        <p className="mt-4 text-muted">{profile.location} - {profile.availability_status}</p>
      </section>
    ) : null,
    services: () => settings.visible.services !== false ? (
      <CardSection key="services" sectionKey="services" title="Services" items={data.services} render={(item) => <><Icon name={item.icon_name} /><h3>{item.title}</h3><p>{item.description}</p></>} />
    ) : null,
    projects: () => settings.visible.projects !== false ? (
      <section className="section section-projects reveal" id="projects" key="projects">
        <h2>Projects</h2>
        <div className="portfolio-grid">
          {data.projects.map((project) => (
            <Link className="work-card" to={`/projects/${project.slug}`} key={project.id}>
              {project.cover_image_url ? <img src={project.cover_image_url} alt={project.title} loading="lazy" decoding="async" /> : null}
              <div><h3>{project.title}</h3><p>{project.short_description}</p></div>
            </Link>
          ))}
        </div>
      </section>
    ) : null,
    experience: () => settings.visible.experience !== false ? <Timeline key="experience" sectionKey="experience" title="Experience" items={data.experience} primary="role" secondary="company" /> : null,
    education: () => settings.visible.education !== false ? <Timeline key="education" sectionKey="education" title="Education" items={data.education} primary="degree" secondary="institution" /> : null,
    skills: () => settings.visible.skills !== false ? (
      <section className="section section-skills reveal" key="skills">
        <h2>Skills</h2>
        <div className="grid gap-8 md:grid-cols-2">
          {Object.entries(groupedSkills).map(([category, skills]) => (
            <div key={category}>
              <h3>{category}</h3>
              {skills.map((skill) => <div className="skill-row" key={skill.id}><span>{skill.name}</span><span>{'•'.repeat(skill.proficiency || 1)}</span></div>)}
            </div>
          ))}
        </div>
      </section>
    ) : null,
    certificates: () => settings.visible.certificates !== false ? (
      <CardSection key="certificates" sectionKey="certificates" title="Certificates" items={data.certificates} render={(item) => <><h3>{item.title}</h3><p>{item.issuer}</p>{item.credential_url ? <a href={item.credential_url}>Credential</a> : null}</>} />
    ) : null,
    testimonials: () => settings.visible.testimonials !== false ? (
      <CardSection key="testimonials" sectionKey="testimonials" title="Testimonials" items={data.testimonials} render={(item) => <><blockquote>{item.quote}</blockquote><p>{item.author_name}, {item.author_company}</p></>} />
    ) : null,
    contact: () => settings.visible.contact !== false ? (
      <section className="section section-contact reveal" key="contact">
        <h2>Contact</h2>
        <a className="button" href={`mailto:${profile.email}`}>{profile.email || 'Email me'}</a>
        <div className="mt-6 flex gap-3">
          {data.socials.map((social) => <a key={social.id} href={social.url} aria-label={social.platform} className="icon-button"><Icon name={social.icon_name} /></a>)}
        </div>
      </section>
    ) : null
  };

  return (
    <div className={`portfolio-page portfolio-template-${settings.portfolioTemplate} portfolio-style-${settings.visualStyle} portfolio-bg-effect-${settings.backgroundEffect}`}>
      <header className="site-nav">
        <div className="site-nav-inner">
          <a href="#top" className="font-heading text-2xl">{settings.headerText || profile.name || 'Portfolio'}</a>
          <button className="icon-button" onClick={toggleMode} aria-label="Toggle dark mode">
            {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>
      <main className="portfolio-shell">
        {loading ? <div className="portfolio-refreshing" aria-live="polite">Refreshing portfolio...</div> : null}
        <section id="top" className={heroClasses}>
          <div className="hero-copy">
            <h1>{profile.name || 'Your Name'}</h1>
            <p className="hero-tagline">{profile.tagline || 'Editorial portfolio for thoughtful digital work.'}</p>
            <div className="hero-actions">
              {settings.showHire ? <a className="button" href={`mailto:${profile.email}`}>Hire me</a> : null}
              <a className="button secondary" href="#projects">View work</a>
              {profile.resume_url ? <a className="button secondary" href={profile.resume_url}>Resume</a> : null}
            </div>
          </div>
          {settings.showHeroImage ? (
            profile.avatar_url ? <img className="hero-avatar" src={profile.avatar_url} alt={profile.name} loading="eager" decoding="async" fetchpriority="high" /> : <div className="hero-mark" />
          ) : null}
        </section>
        {settings.sectionOrder.map((section) => sectionRenderers[section]?.())}
      </main>
      <a className={`back-to-top ${showBackToTop ? 'is-visible' : ''}`} href="#top" aria-label="Back to top" aria-hidden={!showBackToTop} tabIndex={showBackToTop ? 0 : -1}>
        <ArrowUp className="h-4 w-4" />
      </a>
    </div>
  );
}

function PortfolioLoading({ mode }) {
  const loadingSettings = parsePortfolioSettings({}, mode);

  useEffect(() => {
    applyPortfolioSettings({}, mode);
  }, [mode]);

  return (
    <div className={`portfolio-page portfolio-template-${loadingSettings.portfolioTemplate} portfolio-style-${loadingSettings.visualStyle} portfolio-bg-effect-${loadingSettings.backgroundEffect}`}>
      <header className="site-nav">
        <div className="site-nav-inner">
          <span className="font-heading text-2xl">Portfolio</span>
        </div>
      </header>
      <main className="portfolio-shell">
        <section className="portfolio-loading-hero" aria-live="polite" aria-busy="true">
          <p>Loading portfolio</p>
          <Skeleton lines={6} />
        </section>
      </main>
    </div>
  );
}

function CardSection({ title, items, render, sectionKey }) {
  return (
    <section className={`section section-${sectionKey} reveal`}>
      <h2>{title}</h2>
      <div className="portfolio-grid">
        {items.map((item) => <article className="content-card" key={item.id}>{render(item)}</article>)}
      </div>
    </section>
  );
}

function formatDisplayDate(value) {
  if (!value) return 'Present';
  const textValue = String(value);
  if (/^\d{4}-01-01$/.test(textValue)) return textValue.slice(0, 4);
  if (/^\d{4}-\d{2}-01$/.test(textValue)) return textValue.slice(0, 7);
  return textValue;
}

function Timeline({ title, items, primary, secondary, sectionKey }) {
  return (
    <section className={`section section-${sectionKey} reveal`}>
      <h2>{title}</h2>
      <div className="timeline">
        {items.map((item) => (
          <article key={item.id}>
            <span>{formatDisplayDate(item.start_date)} - {formatDisplayDate(item.end_date)}</span>
            <h3>{item[primary]}</h3>
            <p>{item[secondary]}</p>
            <div className="rich-text" dangerouslySetInnerHTML={{ __html: item.description || '' }} />
          </article>
        ))}
      </div>
    </section>
  );
}
