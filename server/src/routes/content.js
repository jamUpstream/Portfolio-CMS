import express from 'express';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { PDFParse } from 'pdf-parse';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { supabaseAdmin } from '../utils/supabase.js';

const router = express.Router();

const resources = {
  projects: { table: 'projects', order: 'sort_order', publicFilter: { status: 'published' }, slug: true },
  experience: { table: 'experience', order: 'sort_order' },
  education: { table: 'education', order: 'sort_order' },
  certificates: { table: 'certificates', order: 'sort_order' },
  skills: { table: 'skills', order: 'category,sort_order' },
  services: { table: 'services', order: 'sort_order' },
  testimonials: { table: 'testimonials', order: 'sort_order' },
  'social-links': { table: 'social_links', order: 'sort_order' }
};

const protectedResources = Object.keys(resources);
const idSchema = z.string().uuid();
const allowedUploadBuckets = new Set(['avatars', 'project-covers', 'logos', 'certificates', 'og-images', 'icons', 'resumes']);

const resumeImportSchema = {
  type: 'object',
  properties: {
    profile: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        tagline: { type: 'string' },
        bio: { type: 'string' },
        email: { type: 'string' },
        location: { type: 'string' },
        availability_status: { type: 'string' }
      },
      additionalProperties: false
    },
    experience: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          company: { type: 'string' },
          role: { type: 'string' },
          description: { type: 'string' },
          start_date: { type: 'string' },
          end_date: { type: 'string' },
          location: { type: 'string' },
          employment_type: { type: 'string' }
        },
        additionalProperties: false
      }
    },
    education: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          institution: { type: 'string' },
          degree: { type: 'string' },
          field_of_study: { type: 'string' },
          start_date: { type: 'string' },
          end_date: { type: 'string' },
          description: { type: 'string' }
        },
        additionalProperties: false
      }
    },
    skills: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          category: { type: 'string' },
          proficiency: { type: 'number' }
        },
        additionalProperties: false
      }
    },
    certificates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          issuer: { type: 'string' },
          issue_date: { type: 'string' },
          expiry_date: { type: 'string' },
          credential_url: { type: 'string' }
        },
        additionalProperties: false
      }
    }
  },
  required: ['profile', 'experience', 'education', 'skills', 'certificates'],
  additionalProperties: false
};

function cleanPayload(payload) {
  return Object.fromEntries(
    Object.entries(payload ?? {}).map(([key, value]) => {
      if (key.endsWith('_date')) return [key, normalizeDateValue(value)];
      return [key, value === '' ? null : value];
    })
  );
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cleanResourcePayload(resource, payload) {
  const cleaned = cleanPayload(payload);
  if (resource === 'projects' && !cleaned.slug && cleaned.title) {
    return { ...cleaned, slug: slugify(cleaned.title) };
  }
  return cleaned;
}

function normalizeDateValue(value) {
  if (value == null) return null;

  const textValue = String(value).trim();
  if (!textValue || /^present$/i.test(textValue)) return null;
  if (/^\d{4}$/.test(textValue)) return `${textValue}-01-01`;
  if (/^\d{4}-\d{2}$/.test(textValue)) return `${textValue}-01`;

  return textValue;
}

async function extractResumeText(file) {
  const mime = file.mimetype || '';
  const ext = path.extname(file.originalname || '').toLowerCase();

  if (mime.includes('pdf') || ext === '.pdf') {
    const parser = new PDFParse({ data: file.buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  if (mime.startsWith('text/') || ['.txt', '.md'].includes(ext)) {
    return file.buffer.toString('utf8');
  }

  throw new Error('Unsupported resume file. Upload a PDF or TXT file.');
}

function parseGroqJson(content) {
  const raw = String(content || '').trim();
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Groq returned a response that was not valid JSON.');
    return JSON.parse(match[0]);
  }
}

async function extractResumeWithGroq(text) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Missing GROQ_API_KEY in the server environment.');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'Extract portfolio CMS data from a resume.',
            'Return JSON only with keys: profile, experience, education, skills, certificates.',
            'Use plain strings. Use HTML paragraphs/lists for description and bio fields.',
            'Dates may be YYYY, YYYY-MM, YYYY-MM-DD, Present, or empty string.',
            'Skill proficiency is 1 to 5. Do not invent facts that are not supported by the resume.'
          ].join(' ')
        },
        {
          role: 'user',
          content: `JSON shape:\n${JSON.stringify(resumeImportSchema)}\n\nResume text:\n${text.slice(0, 45000)}`
        }
      ]
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || `Groq request failed with ${response.status}`);
  return parseGroqJson(payload.choices?.[0]?.message?.content);
}

function isSchemaSetupError(error) {
  return /Could not find the table|schema cache|relation .* does not exist/i.test(error?.message ?? '');
}

function throwSchemaSetupError(error) {
  if (isSchemaSetupError(error)) {
    throw new Error('Supabase schema is not ready. Run the SQL migrations before using the API.');
  }
}

function applyOrder(query, order) {
  return order.split(',').reduce((current, key) => current.order(key.trim(), { ascending: true }), query);
}

async function getRows(config, options = {}) {
  let query = supabaseAdmin.from(config.table).select('*');

  if (options.publicOnly && config.publicFilter) {
    Object.entries(config.publicFilter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { data, error } = await applyOrder(query, config.order);
  throwSchemaSetupError(error);
  if (error) throw error;
  return data ?? [];
}

router.get('/profile', async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from('profile').select('*').limit(1).maybeSingle();
    throwSchemaSetupError(error);
    if (error) throw error;
    res.json(data ?? null);
  } catch (error) {
    next(error);
  }
});

router.patch('/profile', authMiddleware, async (req, res, next) => {
  try {
    const payload = { ...cleanPayload(req.body), updated_at: new Date().toISOString() };
    const { data: existing } = await supabaseAdmin.from('profile').select('id').limit(1).maybeSingle();
    const request = existing?.id
      ? supabaseAdmin.from('profile').update(payload).eq('id', existing.id).select('*').single()
      : supabaseAdmin.from('profile').insert(payload).select('*').single();
    const { data, error } = await request;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/site-settings', async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin.from('site_settings').select('*');
    throwSchemaSetupError(error);
    if (error) throw error;
    res.json(Object.fromEntries((data ?? []).map((row) => [row.key, row.value])));
  } catch (error) {
    next(error);
  }
});

router.patch('/site-settings', authMiddleware, async (req, res, next) => {
  try {
    const rows = Object.entries(req.body ?? {}).map(([key, raw]) => ({
      key,
      value: typeof raw === 'string' ? raw : JSON.stringify(raw),
      type: typeof raw === 'boolean' ? 'boolean' : typeof raw === 'object' ? 'json' : 'text'
    }));

    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .upsert(rows, { onConflict: 'key' })
      .select('*');

    if (error) throw error;
    res.json(Object.fromEntries((data ?? []).map((row) => [row.key, row.value])));
  } catch (error) {
    next(error);
  }
});

router.post('/resume-import', authMiddleware, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Missing resume file' });

    const resumeText = (await extractResumeText(req.file)).replace(/\s+\n/g, '\n').trim();
    if (resumeText.length < 80) {
      return res.status(400).json({ error: 'Could not extract enough text from that resume.' });
    }

    const extracted = await extractResumeWithGroq(resumeText);
    res.json({ extracted, source_text_length: resumeText.length });
  } catch (error) {
    next(error);
  }
});

router.post('/upload', authMiddleware, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Missing file' });

    const bucket = req.body.bucket || 'project-covers';
    if (!allowedUploadBuckets.has(bucket)) {
      return res.status(400).json({ error: `Unsupported upload bucket: ${bucket}` });
    }

    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
    const extension = path.extname(safeName);
    const objectPath = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extension}`;

    const { data: existingBuckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    if (bucketsError) throw bucketsError;
    if (!existingBuckets?.some((item) => item.name === bucket)) {
      const { error: createBucketError } = await supabaseAdmin.storage.createBucket(bucket, { public: true });
      if (createBucketError) throw createBucketError;
    }

    const { error } = await supabaseAdmin.storage.from(bucket).upload(objectPath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false
    });

    if (error) throw error;

    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(objectPath);
    res.status(201).json({ url: data.publicUrl, bucket, path: objectPath, name: req.file.originalname });
  } catch (error) {
    next(error);
  }
});

router.get('/admin/:resource', authMiddleware, async (req, res, next) => {
  try {
    const config = resources[req.params.resource];
    if (!config) return res.status(404).json({ error: 'Unknown resource' });
    res.json(await getRows(config, { publicOnly: false }));
  } catch (error) {
    next(error);
  }
});

router.get('/:resource', async (req, res, next) => {
  try {
    const config = resources[req.params.resource];
    if (!config) return res.status(404).json({ error: 'Unknown resource' });
    res.json(await getRows(config, { publicOnly: true }));
  } catch (error) {
    next(error);
  }
});

router.get('/projects/:slug', async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('slug', req.params.slug)
      .eq('status', 'published')
      .maybeSingle();

    throwSchemaSetupError(error);
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Project not found' });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/:resource', authMiddleware, async (req, res, next) => {
  try {
    const config = resources[req.params.resource];
    if (!config || !protectedResources.includes(req.params.resource)) return res.status(404).json({ error: 'Unknown resource' });
    const { data, error } = await supabaseAdmin.from(config.table).insert(cleanResourcePayload(req.params.resource, req.body)).select('*').single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.patch('/:resource/:id', authMiddleware, async (req, res, next) => {
  try {
    const config = resources[req.params.resource];
    if (!config) return res.status(404).json({ error: 'Unknown resource' });
    idSchema.parse(req.params.id);
    const payload = ['projects'].includes(req.params.resource)
      ? { ...cleanResourcePayload(req.params.resource, req.body), updated_at: new Date().toISOString() }
      : cleanResourcePayload(req.params.resource, req.body);
    const { data, error } = await supabaseAdmin.from(config.table).update(payload).eq('id', req.params.id).select('*').single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.delete('/:resource/:id', authMiddleware, async (req, res, next) => {
  try {
    const config = resources[req.params.resource];
    if (!config) return res.status(404).json({ error: 'Unknown resource' });
    idSchema.parse(req.params.id);
    const { error } = await supabaseAdmin.from(config.table).delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
