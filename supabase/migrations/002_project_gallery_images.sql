alter table if exists projects
add column if not exists gallery_image_urls text[] default '{}';

update projects
set gallery_image_urls = '{}'
where gallery_image_urls is null;
