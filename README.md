# Full-stack Portfolio CMS

A Vite + React portfolio with a CMS-style admin panel, Express API, and Supabase for Postgres, Auth, and Storage.

## Project Structure

```text
client/      React, React Router, Tailwind, Supabase Auth client
server/      Express API with Supabase service-role access
supabase/    SQL migration and seed files
```

## Local Setup

1. Install dependencies:

```bash
npm install
npm run install:all
```

2. Create a Supabase project.

3. Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor.

4. Run `supabase/seed.sql` for starter content.

5. Create an admin user. The default local admin is:

```text
email: admin@panel.com
password: admin123panel
```

With `server/.env` configured, seed or update that user with:

```bash
npm run seed:admin --prefix server
```

Or create the same user manually in Supabase Dashboard:

```text
Authentication > Users > Add user
```

There is intentionally no registration page. The login screen is hidden from site navigation and only available by directly opening `/login`.

6. Configure environment variables.

`server/.env`:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=4000
CLIENT_ORIGIN=http://localhost:5173,https://your-vercel-app.vercel.app
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
```

`client/.env`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:4000/api/v1
```

7. Start both apps:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

API: `http://localhost:4000`

## Features

- Public portfolio homepage and project detail pages
- Hidden `/login` route with Supabase email/password auth
- Protected `/admin/*` routes with persistent Supabase sessions
- CMS sections for profile, projects, experience, education, certificates, skills, services, testimonials, social links, and settings
- Rich text editing with React Quill
- Drag-to-reorder list views using `@dnd-kit/sortable`
- File uploads through Express + Multer to Supabase Storage buckets
- AI resume import for PDF/TXT files through Groq, with an admin review step before saving
- Runtime site settings for primary color, fonts, hero layout, section visibility, OG image, favicon, and hire button
- Dark mode toggle with system preference fallback and localStorage persistence
- SQL tables, indexes, RLS policies, storage buckets, and seed data

## API

Public endpoints live under `/api/v1`:

```text
GET /profile
GET /projects
GET /projects/:slug
GET /experience
GET /education
GET /certificates
GET /skills
GET /services
GET /testimonials
GET /social-links
GET /site-settings
```

Protected endpoints require `Authorization: Bearer <supabase_access_token>`:

```text
PATCH /profile
GET /admin/:resource
POST /:resource
PATCH /:resource/:id
DELETE /:resource/:id
PATCH /site-settings
POST /upload
POST /resume-import
```

## Deployment

Frontend:

- Deploy `client/` to Vercel.
- Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL`.

Backend:

- Deploy `server/` to Railway or Render.
- Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT`, `CLIENT_ORIGIN`, and `GROQ_API_KEY`.
- Set `CLIENT_ORIGIN` to the deployed Vercel URL. Multiple origins can be comma-separated.
- Set `VITE_API_URL` in Vercel to the backend base URL or API URL, for example `https://your-render-service.onrender.com/api/v1`.

Supabase:

- Run the migration and seed SQL in production.
- Create the admin user manually.
- Keep the service role key only on the server. Never expose it to the client.
