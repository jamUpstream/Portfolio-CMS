import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, Moon, Sun } from 'lucide-react';
import Icon from '../components/Icon';
import Skeleton from '../components/Skeleton';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../lib/api';
import { applyDocumentHead } from '../lib/documentHead';

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

const defaultSectionOrder = ['about', 'services', 'projects', 'experience', 'education', 'skills', 'certificates', 'testimonials', 'contact'];

function normalizeSectionOrder(value) {
  let parsed = [];
  try {
    parsed = Array.isArray(value) ? value : JSON.parse(value || '[]');
  } catch {
    parsed = [];
  }
  return [...parsed.filter((section) => defaultSectionOrder.includes(section)), ...defaultSectionOrder.filter((section) => !parsed.includes(section))];
}

function parseSettings(settings, mode = document.documentElement.dataset.theme || 'light') {
  const visible = JSON.parse(settings.sections_visible || '{}');
  const isDark = mode === 'dark';
  return {
    primary: settings.theme_primary_color || '#b45309',
    background: isDark ? (settings.theme_dark_background_color || '#15130f') : (settings.theme_background_color || '#f6f0e7'),
    text: isDark ? (settings.theme_dark_text_color || '#f4eadc') : (settings.theme_text_color || '#1d1a16'),
    surface: isDark ? (settings.theme_dark_surface_color || '#1f1b17') : (settings.theme_surface_color || '#fffaf2'),
    heading: settings.font_heading || 'Playfair Display',
    body: settings.font_body || 'Manrope',
    portfolioTemplate: settings.portfolio_template || 'editorial',
    visualStyle: settings.visual_style || 'default',
    backgroundEffect: settings.background_effect || 'plain',
    heroTemplate: settings.hero_template || settings.hero_layout || 'split',
    heroHeadingPosition: settings.hero_heading_position || settings.hero_text_position || 'left',
    heroTaglinePosition: settings.hero_tagline_position || settings.hero_text_position || 'left',
    heroButtonPosition: settings.hero_button_position || 'follow',
    heroTextSize: settings.hero_text_size || 'large',
    heroImageShape: settings.hero_image_shape || 'portrait',
    showHeroImage: settings.show_hero_image !== 'false',
    showHire: settings.show_hire_me_button !== 'false',
    headerText: settings.header_text || '',
    sectionOrder: normalizeSectionOrder(settings.section_order),
    visible
  };
}

function applySettings(settings, mode) {
  const parsed = parseSettings(settings, mode);
  applyDocumentHead(settings, 'Portfolio CMS');
  document.documentElement.style.setProperty('--color-accent', parsed.primary);
  document.documentElement.style.setProperty('--color-paper', parsed.background);
  document.documentElement.style.setProperty('--color-ink', parsed.text);
  document.documentElement.style.setProperty('--color-surface', parsed.surface);
  document.documentElement.style.setProperty('--font-heading', `"${parsed.heading}"`);
  document.documentElement.style.setProperty('--font-body', `"${parsed.body}"`);
  const families = [
    `family=${parsed.heading.replaceAll(' ', '+')}:wght@400;600;700`,
    `family=${parsed.body.replaceAll(' ', '+')}:wght@400;500;700`
  ].join('&');
  const existing = document.getElementById('portfolio-fonts');
  if (existing) existing.remove();
  const link = document.createElement('link');
  link.id = 'portfolio-fonts';
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  document.head.appendChild(link);
}

function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('is-visible', entry.isIntersecting));
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  });
}

export default function PortfolioHome() {
  const [data, setData] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { mode, toggleMode } = useTheme();
  useReveal();

  useEffect(() => {
    Promise.all(Object.entries(endpointMap).map(([key, path]) => api.get(path).then((value) => [key, value]))).then((entries) => {
      const next = Object.fromEntries(entries);
      applySettings(next.settings, mode);
      setData(next);
    });
  }, []);

  useEffect(() => {
    if (data?.settings) applySettings(data.settings, mode);
  }, [data?.settings, mode]);

  useEffect(() => {
    function updateBackToTop() {
      setShowBackToTop(window.scrollY > 420);
    }

    updateBackToTop();
    window.addEventListener('scroll', updateBackToTop, { passive: true });
    return () => window.removeEventListener('scroll', updateBackToTop);
  }, []);

  const settings = useMemo(() => parseSettings(data?.settings ?? {}, mode), [data, mode]);
  const groupedSkills = useMemo(() => {
    return (data?.skills ?? []).reduce((groups, skill) => {
      groups[skill.category || 'General'] = [...(groups[skill.category || 'General'] ?? []), skill];
      return groups;
    }, {});
  }, [data]);

  if (!data) return <main className="portfolio-shell"><Skeleton lines={10} /></main>;

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
              {project.cover_image_url ? <img src={project.cover_image_url} alt={project.title} /> : null}
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
            profile.avatar_url ? <img className="hero-avatar" src={profile.avatar_url} alt={profile.name} /> : <div className="hero-mark" />
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
