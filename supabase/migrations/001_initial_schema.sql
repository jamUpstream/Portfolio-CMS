create extension if not exists "pgcrypto";

create table if not exists profile (
  id uuid primary key default gen_random_uuid(),
  name text,
  tagline text,
  bio text,
  avatar_url text,
  resume_url text,
  email text,
  location text,
  availability_status text,
  updated_at timestamptz default now()
);

create table if not exists social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  url text not null,
  icon_name text,
  sort_order int default 0
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  short_description text,
  cover_image_url text,
  tech_stack text[] default '{}',
  live_url text,
  github_url text,
  featured boolean default false,
  status text not null default 'draft' check (status in ('published', 'draft')),
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists experience (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  role text not null,
  description text,
  start_date date,
  end_date date,
  company_logo_url text,
  location text,
  employment_type text check (employment_type in ('Full-time', 'Part-time', 'Freelance', 'Internship')),
  sort_order int default 0
);

create table if not exists education (
  id uuid primary key default gen_random_uuid(),
  institution text not null,
  degree text,
  field_of_study text,
  start_date date,
  end_date date,
  logo_url text,
  description text,
  sort_order int default 0
);

create table if not exists certificates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  issuer text,
  issue_date date,
  expiry_date date,
  credential_url text,
  image_url text,
  sort_order int default 0
);

create table if not exists skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  proficiency int check (proficiency between 1 and 5),
  icon_url text,
  sort_order int default 0
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  icon_name text,
  sort_order int default 0
);

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_role text,
  author_company text,
  avatar_url text,
  quote text not null,
  featured boolean default false,
  sort_order int default 0
);

create table if not exists site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text,
  type text check (type in ('color', 'text', 'boolean', 'select', 'json'))
);

create index if not exists projects_status_sort_idx on projects (status, sort_order);
create index if not exists projects_slug_idx on projects (slug);
create index if not exists social_links_sort_idx on social_links (sort_order);
create index if not exists experience_sort_idx on experience (sort_order);
create index if not exists education_sort_idx on education (sort_order);
create index if not exists certificates_sort_idx on certificates (sort_order);
create index if not exists skills_category_sort_idx on skills (category, sort_order);
create index if not exists services_sort_idx on services (sort_order);
create index if not exists testimonials_sort_idx on testimonials (sort_order);
create index if not exists site_settings_key_idx on site_settings (key);

alter table profile enable row level security;
alter table social_links enable row level security;
alter table projects enable row level security;
alter table experience enable row level security;
alter table education enable row level security;
alter table certificates enable row level security;
alter table skills enable row level security;
alter table services enable row level security;
alter table testimonials enable row level security;
alter table site_settings enable row level security;

create policy "public can read profile" on profile for select using (true);
create policy "admins can write profile" on profile for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public can read social_links" on social_links for select using (true);
create policy "admins can write social_links" on social_links for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public can read published projects" on projects for select using (status = 'published' or auth.role() = 'authenticated');
create policy "admins can write projects" on projects for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public can read experience" on experience for select using (true);
create policy "admins can write experience" on experience for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public can read education" on education for select using (true);
create policy "admins can write education" on education for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public can read certificates" on certificates for select using (true);
create policy "admins can write certificates" on certificates for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public can read skills" on skills for select using (true);
create policy "admins can write skills" on skills for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public can read services" on services for select using (true);
create policy "admins can write services" on services for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public can read testimonials" on testimonials for select using (true);
create policy "admins can write testimonials" on testimonials for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public can read site_settings" on site_settings for select using (true);
create policy "admins can write site_settings" on site_settings for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('project-covers', 'project-covers', true),
  ('logos', 'logos', true),
  ('certificates', 'certificates', true),
  ('og-images', 'og-images', true),
  ('icons', 'icons', true),
  ('resumes', 'resumes', true)
on conflict (id) do update set public = excluded.public;

create policy "public can read portfolio assets" on storage.objects for select using (
  bucket_id in ('avatars', 'project-covers', 'logos', 'certificates', 'og-images', 'icons', 'resumes')
);

create policy "admins can upload portfolio assets" on storage.objects for insert with check (
  auth.role() = 'authenticated'
  and bucket_id in ('avatars', 'project-covers', 'logos', 'certificates', 'og-images', 'icons', 'resumes')
);

create policy "admins can update portfolio assets" on storage.objects for update using (
  auth.role() = 'authenticated'
  and bucket_id in ('avatars', 'project-covers', 'logos', 'certificates', 'og-images', 'icons', 'resumes')
) with check (
  auth.role() = 'authenticated'
  and bucket_id in ('avatars', 'project-covers', 'logos', 'certificates', 'og-images', 'icons', 'resumes')
);

create policy "admins can delete portfolio assets" on storage.objects for delete using (
  auth.role() = 'authenticated'
  and bucket_id in ('avatars', 'project-covers', 'logos', 'certificates', 'og-images', 'icons', 'resumes')
);
