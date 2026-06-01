import { z } from 'zod';

const text = z.string().optional().nullable();
const number = z.coerce.number().optional();

export const resources = {
  projects: {
    label: 'Projects',
    singular: 'Project',
    path: '/projects',
    columns: ['title', 'status', 'featured', 'sort_order'],
    imageFields: [
      { name: 'cover_image_url', label: 'Cover image', bucket: 'project-covers' },
      { name: 'gallery_image_urls', label: 'Project gallery', bucket: 'project-covers', multiple: true, maxFiles: 5 }
    ],
    richFields: ['description'],
    schema: z.object({
      title: z.string().min(1),
      slug: z.string().min(1),
      short_description: text,
      description: text,
      cover_image_url: text,
      gallery_image_urls: z.array(z.string().url()).max(5).optional().default([]),
      tech_stack: z.string().optional(),
      live_url: text,
      github_url: text,
      featured: z.coerce.boolean().default(false),
      status: z.enum(['published', 'draft']).default('draft'),
      sort_order: number
    })
  },
  experience: {
    label: 'Experience',
    singular: 'Experience',
    path: '/experience',
    columns: ['company', 'role', 'employment_type', 'sort_order'],
    imageFields: [{ name: 'company_logo_url', label: 'Company logo', bucket: 'logos' }],
    richFields: ['description'],
    schema: z.object({
      company: z.string().min(1),
      role: z.string().min(1),
      description: text,
      start_date: text,
      end_date: text,
      company_logo_url: text,
      location: text,
      employment_type: text,
      sort_order: number
    })
  },
  education: {
    label: 'Education',
    singular: 'Education',
    path: '/education',
    columns: ['institution', 'degree', 'field_of_study', 'sort_order'],
    imageFields: [{ name: 'logo_url', label: 'Logo', bucket: 'logos' }],
    schema: z.object({
      institution: z.string().min(1),
      degree: text,
      field_of_study: text,
      start_date: text,
      end_date: text,
      logo_url: text,
      description: text,
      sort_order: number
    })
  },
  certificates: {
    label: 'Certificates',
    singular: 'Certificate',
    path: '/certificates',
    columns: ['title', 'issuer', 'issue_date', 'sort_order'],
    imageFields: [{ name: 'image_url', label: 'Certificate image', bucket: 'certificates' }],
    schema: z.object({
      title: z.string().min(1),
      issuer: text,
      issue_date: text,
      expiry_date: text,
      credential_url: text,
      image_url: text,
      sort_order: number
    })
  },
  skills: {
    label: 'Skills',
    singular: 'Skill',
    path: '/skills',
    columns: ['name', 'category', 'proficiency', 'sort_order'],
    imageFields: [{ name: 'icon_url', label: 'Icon', bucket: 'icons' }],
    schema: z.object({
      name: z.string().min(1),
      category: text,
      proficiency: z.coerce.number().min(1).max(5).default(3),
      icon_url: text,
      sort_order: number
    })
  },
  services: {
    label: 'Services',
    singular: 'Service',
    path: '/services',
    columns: ['title', 'icon_name', 'sort_order'],
    schema: z.object({
      title: z.string().min(1),
      description: text,
      icon_name: text,
      sort_order: number
    })
  },
  testimonials: {
    label: 'Testimonials',
    singular: 'Testimonial',
    path: '/testimonials',
    columns: ['author_name', 'author_company', 'featured', 'sort_order'],
    imageFields: [{ name: 'avatar_url', label: 'Avatar', bucket: 'avatars' }],
    schema: z.object({
      author_name: z.string().min(1),
      author_role: text,
      author_company: text,
      avatar_url: text,
      quote: text,
      featured: z.coerce.boolean().default(false),
      sort_order: number
    })
  },
  'social-links': {
    label: 'Social Links',
    singular: 'Social Link',
    path: '/social-links',
    columns: ['platform', 'url', 'icon_name', 'sort_order'],
    schema: z.object({
      platform: z.string().min(1),
      url: z.string().url(),
      icon_name: text,
      sort_order: number
    })
  }
};

function normalizeDateValue(value) {
  if (value == null) return null;

  const textValue = String(value).trim();
  if (!textValue || /^present$/i.test(textValue)) return null;
  if (/^\d{4}$/.test(textValue)) return `${textValue}-01-01`;
  if (/^\d{4}-\d{2}$/.test(textValue)) return `${textValue}-01`;

  return textValue;
}

function formatDateForForm(key, value) {
  if (value == null) return '';

  const textValue = String(value).trim();
  if (!key.endsWith('_date') || !textValue) return textValue;
  if (/^\d{4}-01-01$/.test(textValue)) return textValue.slice(0, 4);
  if (/^\d{4}-\d{2}-01$/.test(textValue)) return textValue.slice(0, 7);

  return textValue;
}

export function normalizePayload(resourceKey, values) {
  const normalized = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      key.endsWith('_date') ? normalizeDateValue(value) : value
    ])
  );

  if (resourceKey === 'projects') {
    const gallery = Array.isArray(normalized.gallery_image_urls)
      ? normalized.gallery_image_urls.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 5)
      : [];

    return {
      ...normalized,
      gallery_image_urls: gallery,
      tech_stack: typeof normalized.tech_stack === 'string'
        ? normalized.tech_stack.split(',').map((item) => item.trim()).filter(Boolean)
        : normalized.tech_stack
    };
  }
  return normalized;
}

export function toFormValues(row) {
  const normalized = Object.fromEntries(
    Object.entries(row ?? {}).map(([key, value]) => [key, formatDateForForm(key, value)])
  );

  return {
    ...normalized,
    gallery_image_urls: Array.isArray(row?.gallery_image_urls) ? row.gallery_image_urls : [],
    tech_stack: Array.isArray(row?.tech_stack) ? row.tech_stack.join(', ') : row?.tech_stack
  };
}
