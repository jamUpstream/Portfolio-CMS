import { useEffect, useState } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { GripVertical } from 'lucide-react';
import { api } from '../../lib/api';
import UploadField from '../../components/UploadField';
import Skeleton from '../../components/Skeleton';
import ConfirmDialog from '../../components/ConfirmDialog';
import { applyDocumentHead } from '../../lib/documentHead';
import { applyAdminTheme } from '../../lib/adminTheme';
import { useTheme } from '../../contexts/ThemeContext';

const fonts = [
  'Playfair Display',
  'DM Serif Display',
  'Source Serif 4',
  'Cormorant Garamond',
  'Libre Baskerville',
  'Lora',
  'Merriweather',
  'Fraunces',
  'Syne',
  'Manrope',
  'Inter',
  'IBM Plex Sans',
  'Space Grotesk',
  'Plus Jakarta Sans',
  'Sora',
  'Outfit',
  'Work Sans',
  'Public Sans',
  'Rubik',
  'Montserrat',
  'Poppins',
  'Raleway',
  'Nunito Sans',
  'Cabin',
  'Figtree',
  'Urbanist',
  'Karla',
  'Inconsolata',
  'IBM Plex Mono',
  'JetBrains Mono'
];
const sections = ['about', 'services', 'projects', 'experience', 'education', 'skills', 'certificates', 'testimonials', 'contact'];
const sectionLabels = {
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
const portfolioTemplates = [
  ['editorial', 'Editorial default'],
  ['atelier', 'Atelier warm'],
  ['studio', 'Studio clean'],
  ['noir', 'Noir statement'],
  ['index', 'Index / archive'],
  ['gallery', 'Gallery showcase'],
  ['resume', 'Resume / CV'],
  ['brutalist', 'Brutalist grid'],
  ['magazine', 'Magazine spread'],
  ['minimalist', 'Quiet minimalist'],
  ['terminal', 'Terminal mono'],
  ['luxe', 'Luxury editorial'],
  ['neon', 'Neon tech'],
  ['cards', 'Card deck'],
  ['blueprint', 'Blueprint grid'],
  ['bento', 'Bento systems'],
  ['casefile', 'Case file'],
  ['monograph', 'Monograph'],
  ['signal', 'Signal lab'],
  ['sonata', 'Sonata serif'],
  ['ribbon', 'Ribbon stage'],
  ['signal-paper', 'Signal paper']
];
const visualStyles = [
  ['default', 'Default'],
  ['glass', 'Glass']
];
const heroTemplates = [
  ['split', 'Split portrait'],
  ['centered', 'Centered'],
  ['minimal', 'Minimal'],
  ['statement', 'Statement text'],
  ['panel', 'Panel feature'],
  ['cover', 'Cover-style'],
  ['masthead', 'Masthead'],
  ['asymmetric', 'Asymmetric'],
  ['sidebar', 'Sidebar label'],
  ['stacked', 'Stacked intro'],
  ['badge', 'Badge spotlight'],
  ['runway', 'Runway split'],
  ['poster', 'Poster']
];
const heroAlignmentOptions = [
  ['left', 'Left'],
  ['center', 'Center'],
  ['right', 'Right']
];
const heroButtonPositions = [
  ['follow', 'Follow text position'],
  ['left', 'Left'],
  ['center', 'Center'],
  ['right', 'Right']
];
const heroTextSizes = [
  ['compact', 'Compact'],
  ['balanced', 'Balanced'],
  ['large', 'Large'],
  ['oversized', 'Oversized']
];
const heroImageShapes = [
  ['portrait', 'Portrait'],
  ['square', 'Square'],
  ['circle', 'Circle'],
  ['wide', 'Wide'],
  ['landscape', 'Landscape'],
  ['banner', 'Banner'],
  ['rounded', 'Rounded rectangle'],
  ['soft', 'Soft rounded'],
  ['arch', 'Arch top'],
  ['blob', 'Organic blob'],
  ['diamond', 'Diamond'],
  ['tilted', 'Tilted card'],
  ['polaroid', 'Polaroid'],
  ['frame', 'Framed'],
  ['none', 'No frame']
];
const backgroundEffects = [
  ['plain', 'Plain'],
  ['grid', 'Grid'],
  ['dots', 'Dots'],
  ['circuit', 'Circuit'],
  ['scanlines', 'Scanlines'],
  ['crosshatch', 'Crosshatch'],
  ['aurora', 'Aurora'],
  ['rain', 'Rain'],
  ['plasma', 'Plasma'],
  ['sunset', 'Sunset'],
  ['canopy', 'Canopy'],
  ['galaxy', 'Galaxy'],
  ['aurora-flow', 'Aurora flow (animated)'],
  ['grid-drift', 'Grid drift (animated)'],
  ['orbital', 'Orbital haze (animated)']
];
const themePresets = [
  {
    key: 'ocean-depths',
    label: 'Ocean Depths',
    values: {
      theme_primary_color: '#0f766e',
      theme_background_color: '#ecf7f7',
      theme_text_color: '#0f172a',
      theme_surface_color: '#f8fdfd',
      theme_dark_background_color: '#0b1324',
      theme_dark_text_color: '#d9f3f5',
      theme_dark_surface_color: '#13263d',
      font_heading: 'DM Serif Display',
      font_body: 'Manrope',
      portfolio_template: 'sonata',
      visual_style: 'default',
      background_effect: 'grid'
    }
  },
  {
    key: 'sunset-boulevard',
    label: 'Sunset Boulevard',
    values: {
      theme_primary_color: '#c2410c',
      theme_background_color: '#fff2e2',
      theme_text_color: '#3c1b12',
      theme_surface_color: '#fff8ef',
      theme_dark_background_color: '#221015',
      theme_dark_text_color: '#ffe7cf',
      theme_dark_surface_color: '#342029',
      font_heading: 'Fraunces',
      font_body: 'Plus Jakarta Sans',
      portfolio_template: 'ribbon',
      visual_style: 'default',
      background_effect: 'sunset'
    }
  },
  {
    key: 'forest-canopy',
    label: 'Forest Canopy',
    values: {
      theme_primary_color: '#166534',
      theme_background_color: '#eef5ee',
      theme_text_color: '#11231a',
      theme_surface_color: '#f7fcf8',
      theme_dark_background_color: '#101d16',
      theme_dark_text_color: '#d7f0df',
      theme_dark_surface_color: '#1b2f24',
      font_heading: 'Cormorant Garamond',
      font_body: 'Work Sans',
      portfolio_template: 'atelier',
      visual_style: 'default',
      background_effect: 'canopy'
    }
  },
  {
    key: 'midnight-galaxy',
    label: 'Midnight Galaxy',
    values: {
      theme_primary_color: '#6366f1',
      theme_background_color: '#eef0ff',
      theme_text_color: '#121526',
      theme_surface_color: '#f7f8ff',
      theme_dark_background_color: '#0b1020',
      theme_dark_text_color: '#e2e8ff',
      theme_dark_surface_color: '#171e33',
      font_heading: 'Syne',
      font_body: 'IBM Plex Sans',
      portfolio_template: 'signal-paper',
      visual_style: 'glass',
      background_effect: 'aurora-flow'
    }
  },
  {
    key: 'modern-minimalist',
    label: 'Modern Minimalist',
    values: {
      theme_primary_color: '#334155',
      theme_background_color: '#f3f4f6',
      theme_text_color: '#111827',
      theme_surface_color: '#ffffff',
      theme_dark_background_color: '#0f172a',
      theme_dark_text_color: '#e2e8f0',
      theme_dark_surface_color: '#1e293b',
      font_heading: 'Plus Jakarta Sans',
      font_body: 'Public Sans',
      portfolio_template: 'studio',
      visual_style: 'default',
      background_effect: 'plain'
    }
  },
  {
    key: 'golden-hour',
    label: 'Golden Hour',
    values: {
      theme_primary_color: '#b45309',
      theme_background_color: '#fff7df',
      theme_text_color: '#2c1a0f',
      theme_surface_color: '#fffdf5',
      theme_dark_background_color: '#1a130d',
      theme_dark_text_color: '#fdecc8',
      theme_dark_surface_color: '#2b2018',
      font_heading: 'Fraunces',
      font_body: 'Manrope',
      portfolio_template: 'editorial',
      visual_style: 'default',
      background_effect: 'sunset'
    }
  },
  {
    key: 'arctic-frost',
    label: 'Arctic Frost',
    values: {
      theme_primary_color: '#0ea5e9',
      theme_background_color: '#edf8ff',
      theme_text_color: '#0f172a',
      theme_surface_color: '#f8fcff',
      theme_dark_background_color: '#08172a',
      theme_dark_text_color: '#dbeafe',
      theme_dark_surface_color: '#12253f',
      font_heading: 'Source Serif 4',
      font_body: 'IBM Plex Sans',
      portfolio_template: 'minimalist',
      visual_style: 'glass',
      background_effect: 'aurora'
    }
  },
  {
    key: 'desert-rose',
    label: 'Desert Rose',
    values: {
      theme_primary_color: '#be185d',
      theme_background_color: '#fff1f2',
      theme_text_color: '#3f1023',
      theme_surface_color: '#fff8f9',
      theme_dark_background_color: '#2a1120',
      theme_dark_text_color: '#ffe4ef',
      theme_dark_surface_color: '#3b1d31',
      font_heading: 'Libre Baskerville',
      font_body: 'Karla',
      portfolio_template: 'atelier',
      visual_style: 'default',
      background_effect: 'crosshatch'
    }
  },
  {
    key: 'tech-innovation',
    label: 'Tech Innovation',
    values: {
      theme_primary_color: '#22c55e',
      theme_background_color: '#ecfdf3',
      theme_text_color: '#072618',
      theme_surface_color: '#f5fff9',
      theme_dark_background_color: '#061c15',
      theme_dark_text_color: '#c9fce0',
      theme_dark_surface_color: '#113328',
      font_heading: 'JetBrains Mono',
      font_body: 'IBM Plex Sans',
      portfolio_template: 'signal',
      visual_style: 'default',
      background_effect: 'grid-drift'
    }
  },
  {
    key: 'botanical-garden',
    label: 'Botanical Garden',
    values: {
      theme_primary_color: '#15803d',
      theme_background_color: '#eef9f0',
      theme_text_color: '#10281a',
      theme_surface_color: '#f9fffa',
      theme_dark_background_color: '#0f2116',
      theme_dark_text_color: '#d9f7e1',
      theme_dark_surface_color: '#1a3323',
      font_heading: 'Cormorant Garamond',
      font_body: 'Nunito Sans',
      portfolio_template: 'bento',
      visual_style: 'glass',
      background_effect: 'canopy'
    }
  }
];
const defaultColors = {
  theme_primary_color: '#b45309',
  theme_background_color: '#f6f0e7',
  theme_text_color: '#1d1a16',
  theme_surface_color: '#fffaf2',
  theme_dark_background_color: '#15130f',
  theme_dark_text_color: '#f4eadc',
  theme_dark_surface_color: '#1f1b17'
};

function normalizeSectionOrder(value) {
  let parsed = [];
  try {
    parsed = Array.isArray(value) ? value : JSON.parse(value || '[]');
  } catch {
    parsed = [];
  }
  return [...parsed.filter((section) => sections.includes(section)), ...sections.filter((section) => !parsed.includes(section))];
}

function SectionOrderItem({ section }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li ref={setNodeRef} style={style} className="section-order-item">
      <button className="icon-button drag-handle" type="button" aria-label={`Move ${sectionLabels[section]}`} {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>
      <span>{sectionLabels[section]}</span>
    </li>
  );
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [confirmReset, setConfirmReset] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(themePresets[0].key);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const { mode } = useTheme();
  const { register, handleSubmit, reset, control, watch } = useForm();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 160, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    api.get('/site-settings').then((settings) => {
      reset({
        site_title: settings.site_title ?? 'Portfolio CMS',
        header_text: settings.header_text ?? '',
        theme_primary_color: settings.theme_primary_color ?? defaultColors.theme_primary_color,
        theme_background_color: settings.theme_background_color ?? defaultColors.theme_background_color,
        theme_text_color: settings.theme_text_color ?? defaultColors.theme_text_color,
        theme_surface_color: settings.theme_surface_color ?? defaultColors.theme_surface_color,
        theme_dark_background_color: settings.theme_dark_background_color ?? defaultColors.theme_dark_background_color,
        theme_dark_text_color: settings.theme_dark_text_color ?? defaultColors.theme_dark_text_color,
        theme_dark_surface_color: settings.theme_dark_surface_color ?? defaultColors.theme_dark_surface_color,
        font_heading: settings.font_heading ?? 'Playfair Display',
        font_body: settings.font_body ?? 'Manrope',
        portfolio_template: settings.portfolio_template ?? 'editorial',
        visual_style: settings.visual_style ?? 'default',
        background_effect: settings.background_effect ?? 'plain',
        hero_template: settings.hero_template ?? settings.hero_layout ?? 'split',
        hero_heading_position: settings.hero_heading_position ?? settings.hero_text_position ?? 'left',
        hero_tagline_position: settings.hero_tagline_position ?? settings.hero_text_position ?? 'left',
        hero_button_position: settings.hero_button_position ?? 'follow',
        hero_text_size: settings.hero_text_size ?? 'large',
        hero_image_shape: settings.hero_image_shape ?? 'portrait',
        show_hero_image: settings.show_hero_image !== 'false',
        sections_visible: settings.sections_visible ?? JSON.stringify(Object.fromEntries(sections.map((section) => [section, true]))),
        section_order: settings.section_order ?? JSON.stringify(sections),
        show_hire_me_button: settings.show_hire_me_button !== 'false',
        meta_description: settings.meta_description ?? '',
        og_image_url: settings.og_image_url ?? '',
        favicon_url: settings.favicon_url ?? ''
      });
      setLoading(false);
    });
  }, [reset]);

  async function save(values) {
    try {
      const payload = {
        ...values,
        show_hero_image: values.show_hero_image ? 'true' : 'false',
        show_hire_me_button: values.show_hire_me_button ? 'true' : 'false'
      };
      await api.patch('/site-settings', payload);
      localStorage.removeItem('portfolio-public-cache-v2');
      applyDocumentHead(payload, 'Portfolio CMS');
      applyAdminTheme(payload, mode);
      document.documentElement.style.setProperty('--color-accent', payload.theme_primary_color || '#b45309');
      document.documentElement.style.setProperty('--color-paper', payload.theme_background_color || '#f6f0e7');
      document.documentElement.style.setProperty('--color-ink', payload.theme_text_color || '#1d1a16');
      document.documentElement.style.setProperty('--color-surface', payload.theme_surface_color || '#fffaf2');
      setLastSyncedAt(new Date());
      toast.success('Settings saved');
    } catch (error) {
      toast.error(error.message);
    }
  }

  if (loading) return <Skeleton />;

  const visible = JSON.parse(watch('sections_visible') || '{}');
  const sectionOrder = normalizeSectionOrder(watch('section_order'));
  const visibleSectionOrder = sectionOrder.filter((section) => visible[section] !== false);

  function resetColors() {
    reset({ ...watch(), ...defaultColors });
    document.documentElement.style.setProperty('--color-accent', defaultColors.theme_primary_color);
    document.documentElement.style.setProperty('--color-paper', defaultColors.theme_background_color);
    document.documentElement.style.setProperty('--color-ink', defaultColors.theme_text_color);
    document.documentElement.style.setProperty('--color-surface', defaultColors.theme_surface_color);
    applyAdminTheme(defaultColors, mode);
    toast.success('Default colors restored. Save settings to persist them.');
  }

  function resetSectionOrder() {
    reset({ ...watch(), section_order: JSON.stringify(sections) });
    toast.success('Default section order restored. Save settings to persist it.');
  }

  function applyThemePreset(presetKey) {
    const preset = themePresets.find((item) => item.key === presetKey);
    if (!preset) return;
    const nextValues = { ...watch(), ...preset.values };
    reset(nextValues);
    applyAdminTheme(nextValues, mode);
    document.documentElement.style.setProperty('--color-accent', nextValues.theme_primary_color);
    document.documentElement.style.setProperty('--color-paper', nextValues.theme_background_color);
    document.documentElement.style.setProperty('--color-ink', nextValues.theme_text_color);
    document.documentElement.style.setProperty('--color-surface', nextValues.theme_surface_color);
    toast.success(`Applied ${preset.label}. Save settings to publish it.`);
  }

  function reorderSections(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = visibleSectionOrder.indexOf(active.id);
    const newIndex = visibleSectionOrder.indexOf(over.id);
    const reorderedVisible = arrayMove(visibleSectionOrder, oldIndex, newIndex);
    const hiddenSections = sectionOrder.filter((section) => visible[section] === false);
    reset({ ...watch(), section_order: JSON.stringify([...reorderedVisible, ...hiddenSections]) });
  }

  return (
    <form onSubmit={handleSubmit(save)} className="admin-panel max-w-4xl space-y-6">
      <h1 className="admin-title">Site Settings</h1>
      <div className="settings-head-grid">
        <label className="field">
          <span>Browser tab title</span>
          <input className="input" {...register('site_title')} placeholder="Portfolio CMS" />
        </label>
        <label className="field">
          <span>Header text</span>
          <input className="input" {...register('header_text')} placeholder="Leave blank to use profile name" />
          <small className="field-hint">Text shown in the sticky portfolio header.</small>
        </label>
        <Controller control={control} name="favicon_url" render={({ field }) => <UploadField label="Favicon / tab icon" bucket="og-images" value={field.value} onChange={field.onChange} variant="favicon" />} />
      </div>
      <div className="settings-subhead">
        <span className="field-label">Portfolio colors</span>
        <button className="button secondary compact-button" type="button" onClick={() => setConfirmReset('colors')}>Reset colors</button>
      </div>
      <div className="settings-color-grid">
        <label className="field color-field">
          <span>Accent color</span>
          <input type="color" {...register('theme_primary_color')} />
          <small className="field-hint">Buttons, highlights, links, and badges.</small>
        </label>
        <label className="field color-field">
          <span>Portfolio background</span>
          <input type="color" {...register('theme_background_color')} />
          <small className="field-hint">Main live portfolio page background.</small>
        </label>
        <label className="field color-field">
          <span>Portfolio text</span>
          <input type="color" {...register('theme_text_color')} />
          <small className="field-hint">Primary text color on the live portfolio.</small>
        </label>
        <label className="field color-field">
          <span>Portfolio surface</span>
          <input type="color" {...register('theme_surface_color')} />
          <small className="field-hint">Cards, panels, and secondary buttons.</small>
        </label>
      </div>
      <div>
        <span className="field-label">Dark mode portfolio colors</span>
        <div className="settings-color-grid mt-2">
          <label className="field color-field">
            <span>Dark background</span>
            <input type="color" {...register('theme_dark_background_color')} />
            <small className="field-hint">Portfolio background when dark mode is active.</small>
          </label>
          <label className="field color-field">
            <span>Dark text</span>
            <input type="color" {...register('theme_dark_text_color')} />
            <small className="field-hint">Primary portfolio text in dark mode.</small>
          </label>
          <label className="field color-field">
            <span>Dark surface</span>
            <input type="color" {...register('theme_dark_surface_color')} />
            <small className="field-hint">Portfolio cards and secondary buttons in dark mode.</small>
          </label>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field">
          <span>Heading font</span>
          <select className="input" {...register('font_heading')}>{fonts.map((font) => <option key={font}>{font}</option>)}</select>
        </label>
        <label className="field">
          <span>Body font</span>
          <select className="input" {...register('font_body')}>{fonts.map((font) => <option key={font}>{font}</option>)}</select>
        </label>
      </div>
      <div className="theme-preset-row">
        <label className="field theme-preset-field">
          <span>Theme preset (Theme Factory)</span>
          <select className="input" value={selectedPreset} onChange={(event) => setSelectedPreset(event.target.value)}>
            {themePresets.map((preset) => <option key={preset.key} value={preset.key}>{preset.label}</option>)}
          </select>
          <small className="field-hint">Applies matched colors, fonts, template, visual style, and background effect in one click.</small>
        </label>
        <div className="theme-preset-actions">
          <button type="button" className="button secondary compact-button" onClick={() => applyThemePreset(selectedPreset)}>Apply preset</button>
        </div>
      </div>
      <div className="settings-subhead">
        <span className="field-label">Portfolio layout</span>
      </div>
      <div className="settings-layout-grid">
        <label className="field">
          <span>Portfolio template</span>
          <select className="input" {...register('portfolio_template')}>
            {portfolioTemplates.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Visual style</span>
          <select className="input" {...register('visual_style')}>
            {visualStyles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <small className="field-hint">Default keeps solid surfaces. Glass adds translucent, blurred surfaces across the portfolio.</small>
        </label>
        <label className="field">
          <span>Hero template</span>
          <select className="input" {...register('hero_template')}>
            {heroTemplates.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Hero heading position</span>
          <select className="input" {...register('hero_heading_position')}>
            {heroAlignmentOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Hero tagline position</span>
          <select className="input" {...register('hero_tagline_position')}>
            {heroAlignmentOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Hero button position</span>
          <select className="input" {...register('hero_button_position')}>
            {heroButtonPositions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Hero text size</span>
          <select className="input" {...register('hero_text_size')}>
            {heroTextSizes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Hero image shape</span>
          <select className="input" {...register('hero_image_shape')}>
            {heroImageShapes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <small className="field-hint settings-grid-note">Portfolio template sets the overall spacing, surfaces, and section feel. Colors and hero controls still override it.</small>
      </div>
      <div>
        <span className="field-label">Background effect</span>
        <div className="background-effect-grid mt-2">
          {backgroundEffects.map(([value, label]) => (
            <label className="background-effect-card" key={value}>
              <input type="radio" value={value} {...register('background_effect')} />
              <span className={`background-effect-preview effect-${value}`} aria-hidden="true" />
              <strong>{label}</strong>
            </label>
          ))}
        </div>
        <small className="field-hint mt-2 block">Static portfolio background pattern. Plain uses your selected background color with no added pattern.</small>
      </div>
      <label className="check-field">
        <input type="checkbox" {...register('show_hero_image')} />
        Show hero picture / visual
      </label>
      <div>
        <div className="settings-subhead">
          <span className="field-label">Section order</span>
          <button className="button secondary compact-button" type="button" onClick={() => setConfirmReset('order')}>Reset order</button>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorderSections}>
          <SortableContext items={visibleSectionOrder} strategy={verticalListSortingStrategy}>
            <ol className="section-order-list">
              {visibleSectionOrder.map((section) => <SectionOrderItem key={section} section={section} />)}
            </ol>
          </SortableContext>
        </DndContext>
        {!visibleSectionOrder.length ? <p className="field-hint mt-2">No visible sections selected.</p> : null}
      </div>
      <div>
        <span className="field-label">Visible sections</span>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          {sections.map((section) => (
            <label className="check-field" key={section}>
              <input
                type="checkbox"
                checked={visible[section] !== false}
                onChange={(event) => {
                  const next = { ...visible, [section]: event.target.checked };
                  reset({ ...watch(), sections_visible: JSON.stringify(next) });
                }}
              />
              {sectionLabels[section]}
            </label>
          ))}
        </div>
      </div>
      <label className="check-field">
        <input type="checkbox" {...register('show_hire_me_button')} />
        Show hire me button
      </label>
      <label className="field">
        <span>Meta description</span>
        <textarea className="input min-h-24" {...register('meta_description')} />
      </label>
      <Controller control={control} name="og_image_url" render={({ field }) => <UploadField label="OG image" bucket="og-images" value={field.value} onChange={field.onChange} />} />
      <div className="flex flex-wrap items-center gap-3">
        <button className="button">Save settings</button>
        {lastSyncedAt ? <small className="field-hint">Last synced {lastSyncedAt.toLocaleTimeString()}</small> : null}
      </div>
      <ConfirmDialog
        open={Boolean(confirmReset)}
        title={confirmReset === 'colors' ? 'Reset colors?' : 'Reset section order?'}
        description={confirmReset === 'colors'
          ? 'This restores the default light and dark portfolio/admin colors in the form. Save settings afterward to persist the reset.'
          : 'This restores the default portfolio section order in the form. Save settings afterward to persist the reset.'}
        confirmLabel={confirmReset === 'colors' ? 'Reset colors' : 'Reset order'}
        onCancel={() => setConfirmReset(null)}
        onConfirm={() => {
          if (confirmReset === 'colors') resetColors();
          if (confirmReset === 'order') resetSectionOrder();
          setConfirmReset(null);
        }}
      />
    </form>
  );
}
