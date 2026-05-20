import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Github, ExternalLink } from 'lucide-react';
import { api } from '../lib/api';
import Skeleton from '../components/Skeleton';
import { useTheme } from '../contexts/ThemeContext';
import { applyDocumentHead } from '../lib/documentHead';

function parseProjectSettings(settings = {}, mode = document.documentElement.dataset.theme || 'light') {
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
    backgroundEffect: settings.background_effect || 'plain'
  };
}

function applyProjectSettings(settings, mode) {
  const parsed = parseProjectSettings(settings, mode);
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

export default function ProjectDetail() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [settings, setSettings] = useState(null);
  const { mode } = useTheme();

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${slug}`),
      api.get('/site-settings')
    ]).then(([projectData, settingsData]) => {
      applyProjectSettings(settingsData, mode);
      setProject(projectData);
      setSettings(settingsData);
    });
  }, [slug]);

  useEffect(() => {
    if (settings) applyProjectSettings(settings, mode);
  }, [settings, mode]);

  const parsedSettings = parseProjectSettings(settings ?? {}, mode);

  if (!project) {
    return (
      <div className={`portfolio-page portfolio-template-${parsedSettings.portfolioTemplate} portfolio-style-${parsedSettings.visualStyle} portfolio-bg-effect-${parsedSettings.backgroundEffect}`}>
        <main className="portfolio-shell"><Skeleton /></main>
      </div>
    );
  }

  return (
    <div className={`portfolio-page portfolio-template-${parsedSettings.portfolioTemplate} portfolio-style-${parsedSettings.visualStyle} portfolio-bg-effect-${parsedSettings.backgroundEffect}`}>
      <main className="portfolio-shell">
        <Link to="/" className="text-sm text-muted">Back to portfolio</Link>
        <article className="project-detail">
          <h1>{project.title}</h1>
          <p>{project.short_description}</p>
          {project.cover_image_url ? <img src={project.cover_image_url} alt={project.title} /> : null}
          <div className="flex flex-wrap gap-2">{project.tech_stack?.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
          <div className="rich-text" dangerouslySetInnerHTML={{ __html: project.description || '' }} />
          <div className="flex gap-3">
            {project.live_url ? <a className="button" href={project.live_url}><ExternalLink className="h-4 w-4" /> Live</a> : null}
            {project.github_url ? <a className="button secondary" href={project.github_url}><Github className="h-4 w-4" /> Code</a> : null}
          </div>
        </article>
      </main>
    </div>
  );
}
