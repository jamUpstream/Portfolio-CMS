import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Github, ExternalLink, X } from 'lucide-react';
import { api } from '../lib/api';
import Skeleton from '../components/Skeleton';
import { useTheme } from '../contexts/ThemeContext';
import { applyPortfolioSettings, parsePortfolioSettings } from '../lib/portfolioTheme';

export default function ProjectDetail() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [settings, setSettings] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
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
  const allProjectImages = [...new Set([project?.cover_image_url, ...galleryImages].filter(Boolean))];
  const activeImage = lightboxIndex != null ? allProjectImages[lightboxIndex] : null;

  if (!project) {
    return (
      <div className={`portfolio-page portfolio-template-${parsedSettings.portfolioTemplate} portfolio-style-${parsedSettings.visualStyle} portfolio-bg-effect-${parsedSettings.backgroundEffect}`}>
        <main className="portfolio-shell"><Skeleton /></main>
      </div>
    );
  }

  function openLightbox(index) {
    if (!allProjectImages[index]) return;
    setLightboxIndex(index);
  }

  function closeLightbox() {
    setLightboxIndex(null);
  }

  function showPreviousImage() {
    if (!allProjectImages.length) return;
    setLightboxIndex((current) => (current == null ? 0 : (current - 1 + allProjectImages.length) % allProjectImages.length));
  }

  function showNextImage() {
    if (!allProjectImages.length) return;
    setLightboxIndex((current) => (current == null ? 0 : (current + 1) % allProjectImages.length));
  }

  useEffect(() => {
    if (lightboxIndex == null) return undefined;

    function onKeyDown(event) {
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') showPreviousImage();
      if (event.key === 'ArrowRight') showNextImage();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex, allProjectImages.length]);

  useEffect(() => {
    if (lightboxIndex == null) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [lightboxIndex]);

  return (
    <div className={`portfolio-page portfolio-template-${parsedSettings.portfolioTemplate} portfolio-style-${parsedSettings.visualStyle} portfolio-bg-effect-${parsedSettings.backgroundEffect}`}>
      <main className="portfolio-shell">
        <Link to="/" className="text-sm text-muted">Back to portfolio</Link>
        <article className="project-detail">
          <h1>{project.title}</h1>
          <p>{project.short_description}</p>
          {project.cover_image_url ? (
            <button type="button" className="project-lightbox-trigger" onClick={() => openLightbox(allProjectImages.indexOf(project.cover_image_url))} aria-label="Enlarge cover image">
              <img src={project.cover_image_url} alt={project.title} loading="lazy" decoding="async" />
            </button>
          ) : null}
          {galleryImages.length ? (
            <section className="project-gallery" aria-label="Project gallery">
              {galleryImages.map((image, index) => (
                <button type="button" key={`${image}-${index}`} className="project-gallery-item" onClick={() => openLightbox(allProjectImages.indexOf(image))} aria-label={`Enlarge screenshot ${index + 1}`}>
                  <img src={image} alt={`${project.title} screenshot ${index + 1}`} loading="lazy" decoding="async" />
                </button>
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
      {activeImage ? (
        <div className="project-lightbox-layer" role="dialog" aria-modal="true" aria-label="Project image viewer">
          <button type="button" className="project-lightbox-backdrop" onClick={closeLightbox} aria-label="Close image viewer" />
          <div className="project-lightbox-panel">
            <button type="button" className="icon-button project-lightbox-close" onClick={closeLightbox} aria-label="Close image viewer">
              <X className="h-4 w-4" />
            </button>
            <button type="button" className="icon-button project-lightbox-nav project-lightbox-prev" onClick={showPreviousImage} aria-label="Previous image">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <img className="project-lightbox-image" src={activeImage} alt={`${project.title} enlarged screenshot ${lightboxIndex + 1}`} />
            <button type="button" className="icon-button project-lightbox-nav project-lightbox-next" onClick={showNextImage} aria-label="Next image">
              <ChevronRight className="h-5 w-5" />
            </button>
            <p className="project-lightbox-counter">{lightboxIndex + 1} / {allProjectImages.length}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
