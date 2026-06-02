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
const sectionTitles = {
  about: 'About',
  services: 'Services',
  projects: 'Projects',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  certificates: 'Certificates',
  testimonials: 'Testimonials',
  contact: 'Contact'
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

function summarizeRichText(value = '', maxLength = 180) {
  const plain = value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) return '';
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trimEnd()}...`;
}

function getSectionCount(sectionKey, data, groupedSkills, profile) {
  switch (sectionKey) {
    case 'about':
      return profile?.bio ? 1 : 0;
    case 'services':
      return data.services?.length ?? 0;
    case 'projects':
      return data.projects?.length ?? 0;
    case 'experience':
      return data.experience?.length ?? 0;
    case 'education':
      return data.education?.length ?? 0;
    case 'skills':
      return data.skills?.length ?? 0;
    case 'certificates':
      return data.certificates?.length ?? 0;
    case 'testimonials':
      return data.testimonials?.length ?? 0;
    case 'contact':
      return (profile?.email ? 1 : 0) + (data.socials?.length ?? 0);
    default:
      return 0;
  }
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
      <CardSection key="services" sectionKey="services" title="Services" items={data.services} render={(item) => <><Icon name={item.icon_name} /><h3>{item.title}</h3><div className="rich-text" dangerouslySetInnerHTML={{ __html: item.description || '' }} /></>} />
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
        <div className="skills-grid">
          {Object.entries(groupedSkills).map(([category, skills]) => (
            <div className="skill-group" key={category}>
              <h3>{category}</h3>
              {skills.map((skill) => (
                <div className="skill-row" key={skill.id}>
                  <span>{skill.name}</span>
                  <span className="skill-level">Lv {skill.proficiency || 1}</span>
                </div>
              ))}
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

  const orderedSections = settings.sectionOrder.map((section) => ({
    key: section,
    node: sectionRenderers[section]?.()
  })).filter((section) => section.node);
  const atlasSections = orderedSections.filter((section) => section.key !== 'skills');
  const cinemaSections = orderedSections.filter((section) => section.key !== 'projects');
  const cinemaHasProjects = orderedSections.some((section) => section.key === 'projects');
  const mosaicSections = orderedSections.filter((section) => !['projects', 'skills'].includes(section.key));
  const folioSections = orderedSections.filter((section) => section.key !== 'projects');
  const folioHasProjects = orderedSections.some((section) => section.key === 'projects');
  const dispatchSections = orderedSections.filter((section) => !['projects'].includes(section.key));
  const dispatchHasProjects = orderedSections.some((section) => section.key === 'projects');

  if (settings.portfolioTemplate === 'atlas') {
    return (
      <AtlasPortfolio
        data={data}
        groupedSkills={groupedSkills}
        loading={loading}
        mode={mode}
        orderedSections={atlasSections}
        profile={profile}
        settings={settings}
        showBackToTop={showBackToTop}
        toggleMode={toggleMode}
      />
    );
  }

  if (settings.portfolioTemplate === 'cinema') {
    return (
      <CinemaPortfolio
        data={data}
        loading={loading}
        mode={mode}
        orderedSections={cinemaSections}
        showProjectsSection={cinemaHasProjects}
        profile={profile}
        settings={settings}
        showBackToTop={showBackToTop}
        toggleMode={toggleMode}
      />
    );
  }

  if (settings.portfolioTemplate === 'ledger') {
    return (
      <LedgerPortfolio
        data={data}
        loading={loading}
        mode={mode}
        orderedSections={orderedSections}
        profile={profile}
        settings={settings}
        showBackToTop={showBackToTop}
        toggleMode={toggleMode}
      />
    );
  }

  if (settings.portfolioTemplate === 'exhibit') {
    return (
      <ExhibitPortfolio
        data={data}
        loading={loading}
        mode={mode}
        orderedSections={orderedSections}
        profile={profile}
        settings={settings}
        showBackToTop={showBackToTop}
        toggleMode={toggleMode}
      />
    );
  }

  if (settings.portfolioTemplate === 'mosaic') {
    return (
      <MosaicPortfolio
        data={data}
        groupedSkills={groupedSkills}
        loading={loading}
        mode={mode}
        orderedSections={mosaicSections}
        profile={profile}
        settings={settings}
        showBackToTop={showBackToTop}
        toggleMode={toggleMode}
      />
    );
  }

  if (settings.portfolioTemplate === 'panorama') {
    return (
      <PanoramaPortfolio
        data={data}
        loading={loading}
        mode={mode}
        orderedSections={orderedSections}
        profile={profile}
        settings={settings}
        showBackToTop={showBackToTop}
        toggleMode={toggleMode}
      />
    );
  }

  if (settings.portfolioTemplate === 'folio') {
    return (
      <FolioPortfolio
        data={data}
        groupedSkills={groupedSkills}
        loading={loading}
        mode={mode}
        orderedSections={folioSections}
        showProjectsSection={folioHasProjects}
        profile={profile}
        settings={settings}
        showBackToTop={showBackToTop}
        toggleMode={toggleMode}
      />
    );
  }

  if (settings.portfolioTemplate === 'dispatch') {
    return (
      <DispatchPortfolio
        data={data}
        loading={loading}
        mode={mode}
        orderedSections={dispatchSections}
        showProjectsSection={dispatchHasProjects}
        profile={profile}
        settings={settings}
        showBackToTop={showBackToTop}
        toggleMode={toggleMode}
      />
    );
  }

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
            profile.avatar_url ? <img className="hero-avatar" src={profile.avatar_url} alt={profile.name} loading="eager" decoding="async" fetchPriority="high" /> : <div className="hero-mark" />
          ) : null}
        </section>
        {orderedSections.map((section) => section.node)}
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

function AtlasPortfolio({ data, groupedSkills, loading, mode, orderedSections, profile, settings, showBackToTop, toggleMode }) {
  const featuredProject = data.projects?.[0];
  const socialCount = data.socials?.length ?? 0;
  const projectCount = data.projects?.length ?? 0;
  const experienceCount = data.experience?.length ?? 0;

  return (
    <div className={`portfolio-page portfolio-template-${settings.portfolioTemplate} portfolio-style-${settings.visualStyle} portfolio-bg-effect-${settings.backgroundEffect}`}>
      <header className="site-nav atlas-nav">
        <div className="site-nav-inner">
          <a href="#top" className="font-heading text-2xl">{settings.headerText || profile.name || 'Portfolio'}</a>
          <button className="icon-button" onClick={toggleMode} aria-label="Toggle dark mode">
            {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>
      <main className="portfolio-shell atlas-shell" id="top">
        {loading ? <div className="portfolio-refreshing" aria-live="polite">Refreshing portfolio...</div> : null}
        <aside className="atlas-sidebar reveal">
          <div className="atlas-sidebar-card">
            {settings.showHeroImage ? (
              profile.avatar_url
                ? <img className="atlas-avatar" src={profile.avatar_url} alt={profile.name} loading="eager" decoding="async" fetchPriority="high" />
                : <div className="atlas-avatar atlas-avatar-fallback" />
            ) : null}
            <p className="atlas-kicker">Independent portfolio</p>
            <h1>{profile.name || 'Your Name'}</h1>
            <p className="atlas-tagline">{profile.tagline || 'Designed to read like a complete body of work, not a generic landing page.'}</p>
            <div className="atlas-actions">
              {settings.showHire ? <a className="button" href={`mailto:${profile.email}`}>Start a project</a> : null}
              {profile.resume_url ? <a className="button secondary" href={profile.resume_url}>Resume</a> : null}
            </div>
            <dl className="atlas-meta">
              <div>
                <dt>Base</dt>
                <dd>{profile.location || 'Remote'}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{profile.availability_status || 'Available'}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{profile.email || 'Add email in profile'}</dd>
              </div>
            </dl>
            {socialCount ? (
              <div className="atlas-socials">
                {data.socials.map((social) => <a key={social.id} href={social.url} aria-label={social.platform} className="icon-button"><Icon name={social.icon_name} /></a>)}
              </div>
            ) : null}
          </div>
        </aside>
        <div className="atlas-main">
          <section className="atlas-hero reveal">
            <div className="atlas-hero-copy">
              <p className="atlas-kicker">Selected work and capabilities</p>
              <h2>{profile.tagline || 'A portfolio arranged like a living studio dossier.'}</h2>
            </div>
            <div className="atlas-stats">
              <article>
                <strong>{String(projectCount).padStart(2, '0')}</strong>
                <span>Projects</span>
              </article>
              <article>
                <strong>{String(experienceCount).padStart(2, '0')}</strong>
                <span>Roles</span>
              </article>
              <article>
                <strong>{String(socialCount).padStart(2, '0')}</strong>
                <span>Links</span>
              </article>
            </div>
            {featuredProject ? (
              <Link className="atlas-featured-project" to={`/projects/${featuredProject.slug}`}>
                {featuredProject.cover_image_url ? <img src={featuredProject.cover_image_url} alt={featuredProject.title} loading="lazy" decoding="async" /> : null}
                <div>
                  <p className="atlas-kicker">Featured project</p>
                  <h3>{featuredProject.title}</h3>
                  <p>{featuredProject.short_description}</p>
                </div>
              </Link>
            ) : null}
          </section>
          <div className="atlas-sections">
            {orderedSections.map((section) => (
              <div className="atlas-section" key={section.key}>
                {section.node}
              </div>
            ))}
          </div>
          {!!Object.keys(groupedSkills).length ? (
            <section className="atlas-skill-bank reveal">
              <div className="atlas-skill-bank-head">
                <p className="atlas-kicker">Skill bank</p>
                <h2>Capabilities at a glance</h2>
              </div>
              <div className="atlas-skill-groups">
                {Object.entries(groupedSkills).map(([category, skills]) => (
                  <article key={category} className="atlas-skill-group">
                    <h3>{category}</h3>
                    <div className="atlas-skill-chips">
                      {skills.map((skill) => <span className="tag" key={skill.id}>{skill.name}</span>)}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>
      <a className={`back-to-top ${showBackToTop ? 'is-visible' : ''}`} href="#top" aria-label="Back to top" aria-hidden={!showBackToTop} tabIndex={showBackToTop ? 0 : -1}>
        <ArrowUp className="h-4 w-4" />
      </a>
    </div>
  );
}

function CinemaPortfolio({ data, loading, mode, orderedSections, profile, settings, showBackToTop, showProjectsSection, toggleMode }) {
  const featuredProject = data.projects?.[0] ?? null;
  const heroVisual = featuredProject?.cover_image_url || profile.avatar_url || '';

  return (
    <div className={`portfolio-page portfolio-template-${settings.portfolioTemplate} portfolio-style-${settings.visualStyle} portfolio-bg-effect-${settings.backgroundEffect}`}>
      <header className="site-nav cinema-nav">
        <div className="site-nav-inner">
          <a href="#top" className="font-heading text-2xl">{settings.headerText || profile.name || 'Portfolio'}</a>
          <button className="icon-button" onClick={toggleMode} aria-label="Toggle dark mode">
            {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>
      <main className="portfolio-shell cinema-shell" id="top">
        {loading ? <div className="portfolio-refreshing" aria-live="polite">Refreshing portfolio...</div> : null}
        <section className="cinema-hero reveal">
          {heroVisual ? <img className="cinema-hero-media" src={heroVisual} alt={featuredProject?.title || profile.name || 'Portfolio hero'} loading="eager" decoding="async" fetchPriority="high" /> : null}
          <div className="cinema-hero-wash" />
          <div className="cinema-hero-copy">
            <p className="cinema-eyebrow">Now showing</p>
            <h1>{profile.name || 'Your Name'}</h1>
            <p className="cinema-tagline">{profile.tagline || 'A showreel-style portfolio for work that deserves atmosphere.'}</p>
            <div className="cinema-actions">
              {settings.showHire ? <a className="button" href={`mailto:${profile.email}`}>Book collaboration</a> : null}
              <a className="button secondary" href="#projects">Browse work</a>
              {profile.resume_url ? <a className="button secondary" href={profile.resume_url}>Resume</a> : null}
            </div>
          </div>
          <aside className="cinema-sidecard">
            <p className="cinema-eyebrow">In focus</p>
            <h2>{featuredProject?.title || 'Featured project'}</h2>
            <p>{featuredProject?.short_description || profile.location || 'Add a featured project to drive this layout.'}</p>
            {featuredProject ? <Link className="button secondary" to={`/projects/${featuredProject.slug}`}>Open case study</Link> : null}
            <dl className="cinema-meta">
              <div>
                <dt>Location</dt>
                <dd>{profile.location || 'Remote'}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{profile.availability_status || 'Available'}</dd>
              </div>
            </dl>
          </aside>
        </section>
        {showProjectsSection && data.projects?.length ? (
          <section className="cinema-strip reveal" id="projects">
            <div className="cinema-strip-head">
              <p className="cinema-eyebrow">Project reel</p>
              <h2>Frames from the work</h2>
            </div>
            <div className="cinema-projects">
              {data.projects.slice(0, 6).map((project) => (
                <Link key={project.id} className="cinema-project-card" to={`/projects/${project.slug}`}>
                  {project.cover_image_url ? <img src={project.cover_image_url} alt={project.title} loading="lazy" decoding="async" /> : null}
                  <div>
                    <strong>{project.title}</strong>
                    <span>{project.short_description}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
        <div className="cinema-sections">
          {orderedSections.map((section) => (
            <div className="cinema-section-shell" key={section.key}>
              {section.node}
            </div>
          ))}
        </div>
      </main>
      <a className={`back-to-top ${showBackToTop ? 'is-visible' : ''}`} href="#top" aria-label="Back to top" aria-hidden={!showBackToTop} tabIndex={showBackToTop ? 0 : -1}>
        <ArrowUp className="h-4 w-4" />
      </a>
    </div>
  );
}

function LedgerPortfolio({ data, loading, mode, orderedSections, profile, settings, showBackToTop, toggleMode }) {
  const sectionIndex = orderedSections.map((section, index) => ({
    ...section,
    number: String(index + 1).padStart(2, '0'),
    title: sectionTitles[section.key] || section.key
  }));

  return (
    <div className={`portfolio-page portfolio-template-${settings.portfolioTemplate} portfolio-style-${settings.visualStyle} portfolio-bg-effect-${settings.backgroundEffect}`}>
      <header className="site-nav ledger-nav">
        <div className="site-nav-inner">
          <a href="#top" className="font-heading text-2xl">{settings.headerText || profile.name || 'Portfolio'}</a>
          <button className="icon-button" onClick={toggleMode} aria-label="Toggle dark mode">
            {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>
      <main className="portfolio-shell ledger-shell" id="top">
        {loading ? <div className="portfolio-refreshing" aria-live="polite">Refreshing portfolio...</div> : null}
        <aside className="ledger-sidebar reveal">
          <div className="ledger-sidebar-card">
            <p className="ledger-kicker">Contents</p>
            <h1>{profile.name || 'Your Name'}</h1>
            <p className="ledger-summary">{profile.tagline || 'A structured portfolio that reads like a carefully edited project dossier.'}</p>
            <nav className="ledger-index" aria-label="Portfolio sections">
              {sectionIndex.map((section) => (
                <a key={section.key} href={`#ledger-${section.key}`}>
                  <span>{section.number}</span>
                  <strong>{section.title}</strong>
                </a>
              ))}
            </nav>
            <div className="ledger-sidebar-actions">
              {settings.showHire ? <a className="button" href={`mailto:${profile.email}`}>Contact</a> : null}
              {profile.resume_url ? <a className="button secondary" href={profile.resume_url}>Resume</a> : null}
            </div>
          </div>
        </aside>
        <div className="ledger-main">
          <section className="ledger-cover reveal">
            <p className="ledger-kicker">Portfolio dossier</p>
            <h2>{profile.tagline || 'Design, systems, and delivery collected into one readable casebook.'}</h2>
            <div className="ledger-cover-meta">
              <span>{profile.location || 'Remote'}</span>
              <span>{profile.availability_status || 'Available'}</span>
              <span>{data.projects?.length ?? 0} projects</span>
            </div>
          </section>
          <div className="ledger-chapters">
            {sectionIndex.map((section) => (
              <article id={`ledger-${section.key}`} className="ledger-chapter reveal" key={section.key}>
                <div className="ledger-chapter-meta">
                  <span>{section.number}</span>
                  <p>{section.title}</p>
                </div>
                <div className="ledger-chapter-body">
                  {section.node}
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
      <a className={`back-to-top ${showBackToTop ? 'is-visible' : ''}`} href="#top" aria-label="Back to top" aria-hidden={!showBackToTop} tabIndex={showBackToTop ? 0 : -1}>
        <ArrowUp className="h-4 w-4" />
      </a>
    </div>
  );
}

function ExhibitPortfolio({ data, loading, mode, orderedSections, profile, settings, showBackToTop, toggleMode }) {
  const leadProject = data.projects?.[0] ?? null;
  const leadVisual = leadProject?.cover_image_url || profile.avatar_url || '';

  return (
    <div className={`portfolio-page portfolio-template-${settings.portfolioTemplate} portfolio-style-${settings.visualStyle} portfolio-bg-effect-${settings.backgroundEffect}`}>
      <header className="site-nav exhibit-nav">
        <div className="site-nav-inner">
          <a href="#top" className="font-heading text-2xl">{settings.headerText || profile.name || 'Portfolio'}</a>
          <button className="icon-button" onClick={toggleMode} aria-label="Toggle dark mode">
            {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>
      <main className="portfolio-shell exhibit-shell" id="top">
        {loading ? <div className="portfolio-refreshing" aria-live="polite">Refreshing portfolio...</div> : null}
        <section className="exhibit-cover reveal">
          <div className="exhibit-cover-copy">
            <p className="exhibit-kicker">Exhibit wall</p>
            <h1>{profile.name || 'Your Name'}</h1>
            <p className="exhibit-tagline">{profile.tagline || 'An exhibition-style portfolio with oversized feature panels and editorial notes.'}</p>
            <div className="exhibit-actions">
              {settings.showHire ? <a className="button" href={`mailto:${profile.email}`}>Start a conversation</a> : null}
              {profile.resume_url ? <a className="button secondary" href={profile.resume_url}>Resume</a> : null}
            </div>
          </div>
          <div className="exhibit-cover-note">
            <span>{profile.location || 'Remote'}</span>
            <span>{profile.availability_status || 'Available'}</span>
            <span>{data.projects?.length ?? 0} projects</span>
          </div>
        </section>
        {leadProject ? (
          <Link className="exhibit-lead reveal" to={`/projects/${leadProject.slug}`}>
            {leadVisual ? <img src={leadVisual} alt={leadProject.title || profile.name || 'Lead visual'} loading="eager" decoding="async" fetchPriority="high" /> : null}
            <div className="exhibit-lead-copy">
              <p className="exhibit-kicker">Lead work</p>
              <h2>{leadProject.title}</h2>
              <p>{leadProject.short_description}</p>
            </div>
          </Link>
        ) : null}
        <div className="exhibit-grid">
          {orderedSections.map((section, index) => (
            <article className={`exhibit-panel exhibit-panel-${index % 4}`} key={section.key}>
              <div className="exhibit-panel-meta">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>{sectionTitles[section.key] || section.key}</p>
              </div>
              <div className="exhibit-panel-body">
                {section.node}
              </div>
            </article>
          ))}
        </div>
      </main>
      <a className={`back-to-top ${showBackToTop ? 'is-visible' : ''}`} href="#top" aria-label="Back to top" aria-hidden={!showBackToTop} tabIndex={showBackToTop ? 0 : -1}>
        <ArrowUp className="h-4 w-4" />
      </a>
    </div>
  );
}

function MosaicPortfolio({ data, groupedSkills, loading, mode, orderedSections, profile, settings, showBackToTop, toggleMode }) {
  const featuredProjects = data.projects?.slice(0, 5) ?? [];
  const skillGroups = Object.entries(groupedSkills);

  return (
    <div className={`portfolio-page portfolio-template-${settings.portfolioTemplate} portfolio-style-${settings.visualStyle} portfolio-bg-effect-${settings.backgroundEffect}`}>
      <header className="site-nav mosaic-nav">
        <div className="site-nav-inner">
          <a href="#top" className="font-heading text-2xl">{settings.headerText || profile.name || 'Portfolio'}</a>
          <button className="icon-button" onClick={toggleMode} aria-label="Toggle dark mode">
            {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>
      <main className="portfolio-shell mosaic-shell" id="top">
        {loading ? <div className="portfolio-refreshing" aria-live="polite">Refreshing portfolio...</div> : null}
        <section className="mosaic-cover reveal">
          <div className="mosaic-cover-copy">
            <p className="mosaic-kicker">Mosaic field</p>
            <h1>{profile.name || 'Your Name'}</h1>
            <p className="mosaic-tagline">{profile.tagline || 'A collage-like portfolio where each section feels like part of a curated wall.'}</p>
            <div className="mosaic-actions">
              {settings.showHire ? <a className="button" href={`mailto:${profile.email}`}>Hire me</a> : null}
              {profile.resume_url ? <a className="button secondary" href={profile.resume_url}>Resume</a> : null}
            </div>
          </div>
          <div className="mosaic-cover-notes">
            <span>{profile.location || 'Remote'}</span>
            <span>{profile.availability_status || 'Available'}</span>
            <span>{data.projects?.length ?? 0} projects</span>
          </div>
        </section>
        {featuredProjects.length ? (
          <section className="mosaic-project-wall reveal" id="projects">
            {featuredProjects.map((project, index) => (
              <Link className={`mosaic-project mosaic-project-${index % 5}`} key={project.id} to={`/projects/${project.slug}`}>
                {project.cover_image_url ? <img src={project.cover_image_url} alt={project.title} loading="lazy" decoding="async" /> : null}
                <div>
                  <p className="mosaic-kicker">Project</p>
                  <h2>{project.title}</h2>
                  <p>{project.short_description}</p>
                </div>
              </Link>
            ))}
          </section>
        ) : null}
        <div className="mosaic-layout">
          <div className="mosaic-panels">
            {orderedSections.map((section, index) => (
              <article className={`mosaic-panel mosaic-panel-${index % 4}`} key={section.key}>
                <div className="mosaic-panel-meta">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <p>{sectionTitles[section.key] || section.key}</p>
                </div>
                <div className="mosaic-panel-body">
                  {section.node}
                </div>
              </article>
            ))}
          </div>
          {!!skillGroups.length ? (
            <aside className="mosaic-skill-wall reveal">
              <p className="mosaic-kicker">Skill wall</p>
              <h2>Core capabilities</h2>
              {skillGroups.map(([category, skills]) => (
                <section className="mosaic-skill-group" key={category}>
                  <h3>{category}</h3>
                  <div className="mosaic-skill-tags">
                    {skills.map((skill) => <span className="tag" key={skill.id}>{skill.name}</span>)}
                  </div>
                </section>
              ))}
            </aside>
          ) : null}
        </div>
      </main>
      <a className={`back-to-top ${showBackToTop ? 'is-visible' : ''}`} href="#top" aria-label="Back to top" aria-hidden={!showBackToTop} tabIndex={showBackToTop ? 0 : -1}>
        <ArrowUp className="h-4 w-4" />
      </a>
    </div>
  );
}

function PanoramaPortfolio({ data, loading, mode, orderedSections, profile, settings, showBackToTop, toggleMode }) {
  const heroVisual = data.projects?.[0]?.cover_image_url || profile.avatar_url || '';

  return (
    <div className={`portfolio-page portfolio-template-${settings.portfolioTemplate} portfolio-style-${settings.visualStyle} portfolio-bg-effect-${settings.backgroundEffect}`}>
      <header className="site-nav panorama-nav">
        <div className="site-nav-inner">
          <a href="#top" className="font-heading text-2xl">{settings.headerText || profile.name || 'Portfolio'}</a>
          <button className="icon-button" onClick={toggleMode} aria-label="Toggle dark mode">
            {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>
      <main className="portfolio-shell panorama-shell" id="top">
        {loading ? <div className="portfolio-refreshing" aria-live="polite">Refreshing portfolio...</div> : null}
        <section className="panorama-hero reveal">
          {heroVisual ? <img className="panorama-hero-media" src={heroVisual} alt={profile.name || 'Portfolio hero'} loading="eager" decoding="async" fetchPriority="high" /> : null}
          <div className="panorama-hero-copy">
            <p className="panorama-kicker">Panorama scenes</p>
            <h1>{profile.name || 'Your Name'}</h1>
            <p className="panorama-tagline">{profile.tagline || 'A wide-format portfolio that unfolds as a sequence of immersive sections.'}</p>
            <div className="panorama-actions">
              {settings.showHire ? <a className="button" href={`mailto:${profile.email}`}>Start a project</a> : null}
              {profile.resume_url ? <a className="button secondary" href={profile.resume_url}>Resume</a> : null}
            </div>
          </div>
        </section>
        <div className="panorama-scenes">
          {orderedSections.map((section, index) => (
            <article className={`panorama-scene panorama-scene-${index % 3}`} key={section.key}>
              <div className="panorama-scene-rail">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>{sectionTitles[section.key] || section.key}</p>
              </div>
              <div className="panorama-scene-body">
                {section.node}
              </div>
            </article>
          ))}
        </div>
      </main>
      <a className={`back-to-top ${showBackToTop ? 'is-visible' : ''}`} href="#top" aria-label="Back to top" aria-hidden={!showBackToTop} tabIndex={showBackToTop ? 0 : -1}>
        <ArrowUp className="h-4 w-4" />
      </a>
    </div>
  );
}

function FolioPortfolio({ data, groupedSkills, loading, mode, orderedSections, profile, settings, showBackToTop, showProjectsSection, toggleMode }) {
  const [activeTab, setActiveTab] = useState(orderedSections[0]?.key ?? null);
  const activeSection = orderedSections.find((section) => section.key === activeTab) ?? orderedSections[0] ?? null;
  const recordCount = data.projects?.length ?? 0;
  const skillGroups = Object.entries(groupedSkills);
  const featuredRecord = data.projects?.[0] ?? null;
  const archiveSummary = summarizeRichText(profile.bio || profile.tagline || '', 240);
  const activeSectionIndex = orderedSections.findIndex((section) => section.key === activeSection?.key);
  const activeSectionCount = activeSection ? getSectionCount(activeSection.key, data, groupedSkills, profile) : 0;

  useEffect(() => {
    if (!orderedSections.some((section) => section.key === activeTab)) {
      setActiveTab(orderedSections[0]?.key ?? null);
    }
  }, [activeTab, orderedSections]);

  return (
    <div className={`portfolio-page portfolio-template-${settings.portfolioTemplate} portfolio-style-${settings.visualStyle} portfolio-bg-effect-${settings.backgroundEffect}`}>
      <header className="site-nav folio-nav">
        <div className="site-nav-inner">
          <a href="#top" className="font-heading text-2xl">{settings.headerText || profile.name || 'Portfolio'}</a>
          <button className="icon-button" onClick={toggleMode} aria-label="Toggle dark mode">
            {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>
      <main className="portfolio-shell folio-shell" id="top">
        {loading ? <div className="portfolio-refreshing" aria-live="polite">Refreshing portfolio...</div> : null}
        <section className="folio-masthead reveal">
          <div className="folio-masthead-stamp">
            <p className="folio-label">Folio archive</p>
            <p className="folio-ref">REF-{String(recordCount).padStart(4, '0')}</p>
          </div>
          <div className="folio-masthead-copy">
            {settings.showHeroImage && profile.avatar_url ? (
              <img className="folio-avatar" src={profile.avatar_url} alt={profile.name} loading="eager" decoding="async" fetchPriority="high" />
            ) : null}
            <h1>{profile.name || 'Your Name'}</h1>
            <p className="folio-tagline">{profile.tagline || 'A file-cabinet archive of work, capabilities, and professional record.'}</p>
            {archiveSummary ? <p className="folio-summary">{archiveSummary}</p> : null}
          </div>
          <div className="folio-masthead-meta">
            <dl>
              <div><dt>Location</dt><dd>{profile.location || 'Remote'}</dd></div>
              <div><dt>Status</dt><dd>{profile.availability_status || 'Available'}</dd></div>
              <div><dt>Records</dt><dd>{recordCount} projects</dd></div>
              <div><dt>Sections</dt><dd>{orderedSections.length} files</dd></div>
            </dl>
            <div className="folio-masthead-actions">
              {settings.showHire ? <a className="button" href={`mailto:${profile.email}`}>Open inquiry</a> : null}
              {profile.resume_url ? <a className="button secondary" href={profile.resume_url}>Resume</a> : null}
            </div>
          </div>
        </section>
        <section className="folio-archive-grid reveal">
          <nav className="folio-index-panel" aria-label="Archive sections">
            <div className="folio-index-head">
              <p className="folio-label">Section index</p>
              <h2>Records drawer</h2>
            </div>
            <div className="folio-index-list">
              {orderedSections.map((section, index) => {
                const count = getSectionCount(section.key, data, groupedSkills, profile);
                return (
                  <button
                    key={section.key}
                    className={`folio-tab${activeTab === section.key ? ' folio-tab-active' : ''}`}
                    onClick={() => setActiveTab(section.key)}
                  >
                    <span className="folio-tab-num">{String(index + 1).padStart(2, '0')}</span>
                    <span className="folio-tab-copy">
                      <strong>{sectionTitles[section.key] || section.key}</strong>
                      <span>{count} entries</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
          <article className="folio-active-file">
            <div className="folio-active-file-head">
              <div>
                <p className="folio-label">Open file</p>
                <h2>{activeSection ? (sectionTitles[activeSection.key] || activeSection.key) : 'No file selected'}</h2>
              </div>
              {activeSection ? (
                <div className="folio-active-file-meta">
                  <span>{String(activeSectionIndex + 1).padStart(2, '0')} / {String(orderedSections.length).padStart(2, '0')}</span>
                  <span>{activeSectionCount} entries</span>
                </div>
              ) : null}
            </div>
            <div className="folio-drawer">
              {activeSection ? (
                <div key={activeSection.key} className="folio-drawer-body">
                  {activeSection.node}
                </div>
              ) : null}
            </div>
          </article>
          <aside className="folio-sidecar">
            {featuredRecord ? (
              <Link className="folio-featured-record" to={`/projects/${featuredRecord.slug}`}>
                <p className="folio-label">Featured case</p>
                <h3>{featuredRecord.title}</h3>
                <p>{featuredRecord.short_description}</p>
                {featuredRecord.cover_image_url ? <img src={featuredRecord.cover_image_url} alt={featuredRecord.title} loading="lazy" decoding="async" /> : <div className="folio-record-placeholder" />}
                <span className="folio-featured-cta">Open project file</span>
              </Link>
            ) : null}
            <div className="folio-sidecard">
              <p className="folio-label">Quick facts</p>
              <div className="folio-fact-list">
                <div><span>Projects</span><strong>{recordCount}</strong></div>
                <div><span>Experience</span><strong>{data.experience?.length ?? 0}</strong></div>
                <div><span>Skills</span><strong>{data.skills?.length ?? 0}</strong></div>
              </div>
            </div>
            {data.socials?.length ? (
              <div className="folio-sidecard">
                <p className="folio-label">External links</p>
                <div className="folio-socials">
                  {data.socials.map((social) => (
                    <a key={social.id} href={social.url} aria-label={social.platform} className="icon-button"><Icon name={social.icon_name} /></a>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </section>
        {showProjectsSection && data.projects?.length ? (
          <section className="folio-records reveal" id="projects">
            <div className="folio-records-head">
              <p className="folio-label">Project records</p>
              <h2>Case files</h2>
            </div>
            <div className="folio-records-grid">
              {data.projects.map((project, index) => (
                <Link key={project.id} className="folio-record" to={`/projects/${project.slug}`}>
                  <span className="folio-record-id">{String(index + 1).padStart(3, '0')}</span>
                  {project.cover_image_url ? <img src={project.cover_image_url} alt={project.title} loading="lazy" decoding="async" /> : <div className="folio-record-placeholder" />}
                  <div className="folio-record-copy">
                    <strong>{project.title}</strong>
                    <p>{project.short_description}</p>
                    <span className="folio-label">Open file</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
        {!!skillGroups.length ? (
          <section className="folio-skill-ledger reveal">
            <p className="folio-label">Capability index</p>
            <h2>Skills on record</h2>
            <div className="folio-skill-groups">
              {skillGroups.map(([category, skills]) => (
                <article key={category} className="folio-skill-group">
                  <h3>{category}</h3>
                  <div className="folio-skill-chips">
                    {skills.map((skill) => <span className="tag" key={skill.id}>{skill.name}</span>)}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <a className={`back-to-top ${showBackToTop ? 'is-visible' : ''}`} href="#top" aria-label="Back to top" aria-hidden={!showBackToTop} tabIndex={showBackToTop ? 0 : -1}>
        <ArrowUp className="h-4 w-4" />
      </a>
    </div>
  );
}

function DispatchPortfolio({ data, loading, mode, orderedSections, profile, settings, showBackToTop, showProjectsSection, toggleMode }) {
  const issueNum = `Vol. ${new Date().getFullYear()} / No. ${String(data.projects?.length ?? 1).padStart(2, '0')}`;
  const featuredProject = data.projects?.[0] ?? null;
  const secondaryProjects = data.projects?.slice(1, 4) ?? [];
  const leadSection = orderedSections[0] ?? null;
  const secondarySections = orderedSections.slice(1);
  const editorNote = summarizeRichText(profile.bio || featuredProject?.short_description || '', 210);
  const briefs = [
    { label: 'Projects', value: String(data.projects?.length ?? 0).padStart(2, '0') },
    { label: 'Roles', value: String(data.experience?.length ?? 0).padStart(2, '0') },
    { label: 'Skills', value: String(data.skills?.length ?? 0).padStart(2, '0') },
    { label: 'Links', value: String(data.socials?.length ?? 0).padStart(2, '0') }
  ];

  return (
    <div className={`portfolio-page portfolio-template-${settings.portfolioTemplate} portfolio-style-${settings.visualStyle} portfolio-bg-effect-${settings.backgroundEffect}`}>
      <header className="site-nav dispatch-nav">
        <div className="site-nav-inner dispatch-nav-inner">
          <span className="dispatch-nav-issue">{issueNum}</span>
          <a href="#top" className="dispatch-masthead-title font-heading">{settings.headerText || profile.name || 'Portfolio'}</a>
          <button className="icon-button" onClick={toggleMode} aria-label="Toggle dark mode">
            {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
        <div className="dispatch-nav-rule" />
        <div className="dispatch-nav-ticker">
          <span>{profile.tagline || 'Independent creative portfolio'}</span>
          <span className="dispatch-sep">/</span>
          <span>{profile.location || 'Remote'}</span>
          <span className="dispatch-sep">/</span>
          <span>{profile.availability_status || 'Available for work'}</span>
        </div>
      </header>
      <main className="portfolio-shell dispatch-shell" id="top">
        {loading ? <div className="portfolio-refreshing" aria-live="polite">Refreshing portfolio...</div> : null}
        <section className="dispatch-front reveal">
          <div className="dispatch-front-top">
            <div className="dispatch-headline">
              <p className="dispatch-label">Front page</p>
              <h1>{profile.name || 'Your Name'}</h1>
              <p className="dispatch-deck">{profile.tagline || 'An editorial portfolio laid out like a broadsheet, structured, readable, direct.'}</p>
              <div className="dispatch-front-actions">
                {settings.showHire ? <a className="button" href={`mailto:${profile.email}`}>Commission work</a> : null}
                <a className="button secondary" href="#dispatch-stories">Browse stories</a>
                {profile.resume_url ? <a className="button secondary" href={profile.resume_url}>Resume</a> : null}
              </div>
            </div>
            <div className="dispatch-front-sidebar">
              {settings.showHeroImage && profile.avatar_url ? (
                <img className="dispatch-avatar" src={profile.avatar_url} alt={profile.name} loading="eager" decoding="async" fetchPriority="high" />
              ) : null}
              <dl className="dispatch-byline">
                <div><dt>By</dt><dd>{profile.name || 'Author'}</dd></div>
                <div><dt>Location</dt><dd>{profile.location || 'Remote'}</dd></div>
                <div><dt>Contact</dt><dd>{profile.email || 'See contact section'}</dd></div>
              </dl>
              <div className="dispatch-socials">
                {data.socials?.map((social) => (
                  <a key={social.id} href={social.url} aria-label={social.platform} className="icon-button"><Icon name={social.icon_name} /></a>
                ))}
              </div>
            </div>
          </div>
          <div className="dispatch-front-lower">
            {featuredProject ? (
              <Link className="dispatch-lead-story" to={`/projects/${featuredProject.slug}`}>
                {featuredProject.cover_image_url ? <img src={featuredProject.cover_image_url} alt={featuredProject.title} loading="lazy" decoding="async" /> : null}
                <div className="dispatch-lead-copy">
                  <p className="dispatch-label">Lead story</p>
                  <h2>{featuredProject.title}</h2>
                  <p>{featuredProject.short_description}</p>
                </div>
              </Link>
            ) : null}
            <aside className="dispatch-brief-stack">
              {editorNote ? (
                <article className="dispatch-editor-note">
                  <p className="dispatch-label">Editor's note</p>
                  <p>{editorNote}</p>
                </article>
              ) : null}
              <div className="dispatch-news-grid">
                {briefs.map((brief) => (
                  <article className="dispatch-brief-card" key={brief.label}>
                    <strong>{brief.value}</strong>
                    <span>{brief.label}</span>
                  </article>
                ))}
              </div>
              {secondaryProjects.length ? (
                <div className="dispatch-secondary-list">
                  <p className="dispatch-label">Inside this issue</p>
                  {secondaryProjects.map((project) => (
                    <Link key={project.id} to={`/projects/${project.slug}`}>
                      <strong>{project.title}</strong>
                      <span>{project.short_description}</span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </aside>
          </div>
        </section>
        <div className="dispatch-rule" />
        {showProjectsSection && data.projects?.length ? (
          <section className="dispatch-reel reveal" id="projects">
            <div className="dispatch-reel-head">
              <p className="dispatch-label">Project archive</p>
              <h2>The work</h2>
            </div>
            <div className="dispatch-reel-grid">
              {data.projects.slice(0, 6).map((project) => (
                <Link key={project.id} className="dispatch-story-card" to={`/projects/${project.slug}`}>
                  {project.cover_image_url ? <img src={project.cover_image_url} alt={project.title} loading="lazy" decoding="async" /> : null}
                  <div>
                    <p className="dispatch-label">Project</p>
                    <strong>{project.title}</strong>
                    <p>{project.short_description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
        <div className="dispatch-rule" />
        {leadSection ? (
          <section className="dispatch-feature reveal" id="dispatch-stories">
            <div className="dispatch-feature-head">
              <p className="dispatch-label">Feature section</p>
              <h2>{sectionTitles[leadSection.key] || leadSection.key}</h2>
            </div>
            <div className="dispatch-feature-body">
              {leadSection.node}
            </div>
          </section>
        ) : null}
        <div className="dispatch-columns">
          {secondarySections.map((section, index) => (
            <article className={`dispatch-column dispatch-column-${index % 3}`} key={section.key}>
              <div className="dispatch-column-flag">
                <span className="dispatch-label">{sectionTitles[section.key] || section.key}</span>
                <div className="dispatch-column-rule" />
              </div>
              <div className="dispatch-column-body">
                {section.node}
              </div>
            </article>
          ))}
        </div>
      </main>
      <a className={`back-to-top ${showBackToTop ? 'is-visible' : ''}`} href="#top" aria-label="Back to top" aria-hidden={!showBackToTop} tabIndex={showBackToTop ? 0 : -1}>
        <ArrowUp className="h-4 w-4" />
      </a>
    </div>
  );
}
