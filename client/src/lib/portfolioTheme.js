import { applyDocumentHead } from './documentHead';

const defaultTheme = {
  primary: '#b45309',
  lightBackground: '#f6f0e7',
  lightText: '#1d1a16',
  lightSurface: '#fffaf2',
  darkBackground: '#15130f',
  darkText: '#f4eadc',
  darkSurface: '#1f1b17',
  heading: 'Playfair Display',
  body: 'Manrope',
  portfolioTemplate: 'editorial',
  visualStyle: 'default',
  backgroundEffect: 'plain',
  heroTemplate: 'split',
  heroHeadingPosition: 'left',
  heroTaglinePosition: 'left',
  heroButtonPosition: 'follow',
  heroTextSize: 'large',
  heroImageShape: 'portrait',
  showHeroImage: true,
  showHire: true,
  headerText: ''
};

const defaultSectionOrder = ['about', 'services', 'projects', 'experience', 'education', 'skills', 'certificates', 'testimonials', 'contact'];
let currentFontsKey = '';

function normalizeSectionOrder(value) {
  let parsed = [];
  try {
    parsed = Array.isArray(value) ? value : JSON.parse(value || '[]');
  } catch {
    parsed = [];
  }
  return [...parsed.filter((section) => defaultSectionOrder.includes(section)), ...defaultSectionOrder.filter((section) => !parsed.includes(section))];
}

function ensurePreconnect(href, crossOrigin = false) {
  if (document.head.querySelector(`link[rel="preconnect"][href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = href;
  if (crossOrigin) link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

export function parsePortfolioSettings(settings = {}, mode = document.documentElement.dataset.theme || 'light') {
  const isDark = mode === 'dark';
  let visible = {};
  try {
    visible = JSON.parse(settings.sections_visible || '{}');
  } catch {
    visible = {};
  }
  return {
    primary: settings.theme_primary_color || defaultTheme.primary,
    background: isDark ? (settings.theme_dark_background_color || defaultTheme.darkBackground) : (settings.theme_background_color || defaultTheme.lightBackground),
    text: isDark ? (settings.theme_dark_text_color || defaultTheme.darkText) : (settings.theme_text_color || defaultTheme.lightText),
    surface: isDark ? (settings.theme_dark_surface_color || defaultTheme.darkSurface) : (settings.theme_surface_color || defaultTheme.lightSurface),
    heading: settings.font_heading || defaultTheme.heading,
    body: settings.font_body || defaultTheme.body,
    portfolioTemplate: settings.portfolio_template || defaultTheme.portfolioTemplate,
    visualStyle: settings.visual_style || defaultTheme.visualStyle,
    backgroundEffect: settings.background_effect || defaultTheme.backgroundEffect,
    heroTemplate: settings.hero_template || settings.hero_layout || defaultTheme.heroTemplate,
    heroHeadingPosition: settings.hero_heading_position || settings.hero_text_position || defaultTheme.heroHeadingPosition,
    heroTaglinePosition: settings.hero_tagline_position || settings.hero_text_position || defaultTheme.heroTaglinePosition,
    heroButtonPosition: settings.hero_button_position || defaultTheme.heroButtonPosition,
    heroTextSize: settings.hero_text_size || defaultTheme.heroTextSize,
    heroImageShape: settings.hero_image_shape || defaultTheme.heroImageShape,
    showHeroImage: settings.show_hero_image !== 'false',
    showHire: settings.show_hire_me_button !== 'false',
    headerText: settings.header_text || defaultTheme.headerText,
    sectionOrder: normalizeSectionOrder(settings.section_order),
    visible
  };
}

export function applyPortfolioFonts(heading, body) {
  const key = `${heading}|${body}`;
  if (currentFontsKey === key) return;
  currentFontsKey = key;

  ensurePreconnect('https://fonts.googleapis.com');
  ensurePreconnect('https://fonts.gstatic.com', true);

  const families = [
    `family=${heading.replaceAll(' ', '+')}:wght@400;600;700`,
    `family=${body.replaceAll(' ', '+')}:wght@400;500;700`
  ].join('&');

  let link = document.getElementById('portfolio-fonts');
  if (!link) {
    link = document.createElement('link');
    link.id = 'portfolio-fonts';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

export function applyPortfolioSettings(settings, mode, fallbackTitle = 'Portfolio CMS') {
  const parsed = parsePortfolioSettings(settings, mode);
  applyDocumentHead(settings, fallbackTitle);
  document.documentElement.style.setProperty('--color-accent', parsed.primary);
  document.documentElement.style.setProperty('--color-paper', parsed.background);
  document.documentElement.style.setProperty('--color-ink', parsed.text);
  document.documentElement.style.setProperty('--color-surface', parsed.surface);
  document.documentElement.style.setProperty('--font-heading', `"${parsed.heading}"`);
  document.documentElement.style.setProperty('--font-body', `"${parsed.body}"`);
  applyPortfolioFonts(parsed.heading, parsed.body);
  return parsed;
}
