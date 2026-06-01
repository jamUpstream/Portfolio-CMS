import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Github, ExternalLink } from 'lucide-react';
import { api } from '../lib/api';
import Skeleton from '../components/Skeleton';
import { useTheme } from '../contexts/ThemeContext';
import { applyPortfolioSettings, parsePortfolioSettings } from '../lib/portfolioTheme';

export default function ProjectDetail() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [settings, setSettings] = useState(null);
  const { mode } = useTheme();

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${slug}`, { cache: 'no-store' }),
      api.get('/site-settings', { cache: 'no-store' })
    ]).then(([projectData, settingsData]) => {
      applyPortfolioSettings(settingsData, mode);
      setProject(projectData);
      setSettings(settingsData);
    });
  }, [slug]);

  useEffect(() => {
    if (settings) applyPortfolioSettings(settings, mode);
  }, [settings, mode]);

  const parsedSettings = parsePortfolioSettings(settings ?? {}, mode);
  const galleryImages = Array.isArray(project?.gallery_image_urls)
    ? project.gallery_image_urls.filter(Boolean).slice(0, 5)
    : [];

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
          {project.cover_image_url ? <img src={project.cover_image_url} alt={project.title} loading="lazy" decoding="async" /> : null}
          {galleryImages.length ? (
            <section className="project-gallery" aria-label="Project gallery">
              {galleryImages.map((image, index) => (
                <a key={`${image}-${index}`} href={image} target="_blank" rel="noreferrer" className="project-gallery-item">
                  <img src={image} alt={`${project.title} screenshot ${index + 1}`} loading="lazy" decoding="async" />
                </a>
              ))}
            </section>
          ) : null}
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
