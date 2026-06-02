import { useEffect, useRef, useState } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPointerPanning, setIsPointerPanning] = useState(false);
  const lightboxImageRef = useRef(null);
  const pointerPanRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const touchGestureRef = useRef({
    pinchActive: false,
    panActive: false,
    startDistance: 0,
    startZoom: 1,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0
  });
  const { mode } = useTheme();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMessage('');

    Promise.all([
      api.get(`/projects/${slug}`, { cache: 'no-store' }),
      api.get('/site-settings', { cache: 'no-store' })
    ]).then(([projectData, settingsData]) => {
      if (cancelled) return;
      applyPortfolioSettings(settingsData, mode);
      setProject(projectData);
      setSettings(settingsData);
    }).catch((error) => {
      if (cancelled) return;
      setProject(null);
      setErrorMessage(error?.message || 'Could not load this project.');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (settings) applyPortfolioSettings(settings, mode);
  }, [settings, mode]);

  const parsedSettings = parsePortfolioSettings(settings ?? {}, mode);
  const galleryImages = Array.isArray(project?.gallery_image_urls)
    ? project.gallery_image_urls.filter(Boolean).slice(0, 5)
    : [];
  const allProjectImages = [...new Set([project?.cover_image_url, ...galleryImages].filter(Boolean))];
  const hasManyImages = allProjectImages.length > 1;
  const activeImage = lightboxIndex != null ? allProjectImages[lightboxIndex] : null;

  function clampZoom(value) {
    return Math.max(1, Math.min(5, value));
  }

  function clampPan(nextX, nextY, zoom = zoomLevel) {
    if (zoom <= 1) return { x: 0, y: 0 };
    const rect = lightboxImageRef.current?.getBoundingClientRect();
    if (!rect) return { x: nextX, y: nextY };
    const maxX = (rect.width * (zoom - 1)) / 2;
    const maxY = (rect.height * (zoom - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, nextX)),
      y: Math.max(-maxY, Math.min(maxY, nextY))
    };
  }

  function openLightbox(index) {
    if (!allProjectImages.length) return;
    const safeIndex = Number.isInteger(index) && index >= 0 ? index : 0;
    if (!allProjectImages[safeIndex]) return;
    setLightboxIndex(safeIndex);
  }

  function closeLightbox() {
    setLightboxIndex(null);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
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
    if (!activeImage) return;
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, [activeImage]);

  useEffect(() => {
    if (lightboxIndex == null) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [lightboxIndex]);

  function handleWheelZoom(event) {
    if (!activeImage) return;
    event.preventDefault();
    const multiplier = event.deltaY < 0 ? 1.14 : 0.88;
    setZoomLevel((current) => {
      const nextZoom = clampZoom(current * multiplier);
      setPanOffset((currentPan) => (
        nextZoom === 1
          ? { x: 0, y: 0 }
          : clampPan(currentPan.x, currentPan.y, nextZoom)
      ));
      return nextZoom;
    });
  }

  function beginPointerPan(event) {
    if (zoomLevel <= 1 || !activeImage) return;
    if (event.button !== 0) return;
    pointerPanRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: panOffset.x,
      originY: panOffset.y
    };
    setIsPointerPanning(true);
  }

  function movePointerPan(event) {
    if (!pointerPanRef.current.active || zoomLevel <= 1) return;
    const deltaX = event.clientX - pointerPanRef.current.startX;
    const deltaY = event.clientY - pointerPanRef.current.startY;
    setPanOffset(clampPan(pointerPanRef.current.originX + deltaX, pointerPanRef.current.originY + deltaY));
  }

  function endPointerPan() {
    pointerPanRef.current.active = false;
    setIsPointerPanning(false);
  }

  function touchDistance(touches) {
    if (touches.length < 2) return 0;
    const a = touches[0];
    const b = touches[1];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  function onTouchStart(event) {
    if (!activeImage) return;
    if (event.touches.length === 2) {
      touchGestureRef.current.pinchActive = true;
      touchGestureRef.current.panActive = false;
      touchGestureRef.current.startDistance = touchDistance(event.touches);
      touchGestureRef.current.startZoom = zoomLevel;
      return;
    }
    if (event.touches.length === 1 && zoomLevel > 1) {
      const touch = event.touches[0];
      touchGestureRef.current.panActive = true;
      touchGestureRef.current.pinchActive = false;
      touchGestureRef.current.startX = touch.clientX;
      touchGestureRef.current.startY = touch.clientY;
      touchGestureRef.current.originX = panOffset.x;
      touchGestureRef.current.originY = panOffset.y;
    }
  }

  function onTouchMove(event) {
    if (!activeImage) return;
    if (touchGestureRef.current.pinchActive && event.touches.length === 2) {
      event.preventDefault();
      const distance = touchDistance(event.touches);
      if (!distance || !touchGestureRef.current.startDistance) return;
      const ratio = distance / touchGestureRef.current.startDistance;
      const nextZoom = clampZoom(touchGestureRef.current.startZoom * ratio);
      setZoomLevel(nextZoom);
      setPanOffset((currentPan) => clampPan(currentPan.x, currentPan.y, nextZoom));
      return;
    }
    if (touchGestureRef.current.panActive && event.touches.length === 1 && zoomLevel > 1) {
      event.preventDefault();
      const touch = event.touches[0];
      const deltaX = touch.clientX - touchGestureRef.current.startX;
      const deltaY = touch.clientY - touchGestureRef.current.startY;
      setPanOffset(clampPan(touchGestureRef.current.originX + deltaX, touchGestureRef.current.originY + deltaY));
    }
  }

  function onTouchEnd(event) {
    if (event.touches.length < 2) {
      touchGestureRef.current.pinchActive = false;
    }
    if (event.touches.length === 0) {
      touchGestureRef.current.panActive = false;
    }
    if (zoomLevel <= 1) {
      setPanOffset({ x: 0, y: 0 });
    }
  }

  if (loading) {
    return (
      <div className={`portfolio-page portfolio-template-${parsedSettings.portfolioTemplate} portfolio-style-${parsedSettings.visualStyle} portfolio-bg-effect-${parsedSettings.backgroundEffect}`}>
        <main className="portfolio-shell"><Skeleton /></main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={`portfolio-page portfolio-template-${parsedSettings.portfolioTemplate} portfolio-style-${parsedSettings.visualStyle} portfolio-bg-effect-${parsedSettings.backgroundEffect}`}>
        <main className="portfolio-shell">
          <article className="project-detail">
            <h1>Project unavailable</h1>
            <p>{errorMessage || 'This project could not be loaded right now.'}</p>
            <Link to="/" className="button secondary">Back to portfolio</Link>
          </article>
        </main>
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
            <button type="button" className="project-lightbox-btn project-lightbox-close" onClick={closeLightbox} aria-label="Close image viewer">
              <X className="h-4 w-4" />
            </button>
            <div className="project-lightbox-stage">
              {hasManyImages ? (
                <button type="button" className="project-lightbox-btn project-lightbox-nav project-lightbox-prev" onClick={showPreviousImage} aria-label="Previous image">
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : null}
              <div
                className={`project-lightbox-image-wrap ${zoomLevel > 1 ? 'is-zoomed' : ''} ${isPointerPanning ? 'is-panning' : ''}`}
                onWheel={handleWheelZoom}
                onMouseDown={beginPointerPan}
                onMouseMove={movePointerPan}
                onMouseUp={endPointerPan}
                onMouseLeave={endPointerPan}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <img
                  ref={lightboxImageRef}
                  className="project-lightbox-image"
                  src={activeImage}
                  alt={`${project.title} enlarged screenshot ${lightboxIndex + 1}`}
                  draggable="false"
                  style={{ transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoomLevel})` }}
                />
              </div>
              {hasManyImages ? (
                <button type="button" className="project-lightbox-btn project-lightbox-nav project-lightbox-next" onClick={showNextImage} aria-label="Next image">
                  <ChevronRight className="h-5 w-5" />
                </button>
              ) : null}
            </div>
            <p className="project-lightbox-counter">{lightboxIndex + 1} / {allProjectImages.length} · {Math.round(zoomLevel * 100)}%</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
