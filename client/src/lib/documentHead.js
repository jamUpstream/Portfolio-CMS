export function applyDocumentHead(settings = {}, fallbackTitle = 'Portfolio CMS') {
  const title = settings.site_title || fallbackTitle;
  document.title = title;

  const faviconUrl = settings.favicon_url;
  if (!faviconUrl) return;

  let favicon = document.querySelector('link[rel="icon"]');
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    document.head.appendChild(favicon);
  }

  favicon.href = faviconUrl;
}
