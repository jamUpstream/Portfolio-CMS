-- Production-safe seed file.
-- This intentionally does not insert demo portfolio content or admin users.
-- Create the admin account in Supabase Auth, then manage content from /admin.

insert into site_settings (key, value, type)
values
  ('site_title', 'Portfolio CMS', 'text'),
  ('header_text', '', 'text'),
  ('theme_primary_color', '#b45309', 'color'),
  ('theme_background_color', '#f6f0e7', 'color'),
  ('theme_text_color', '#1d1a16', 'color'),
  ('theme_surface_color', '#fffaf2', 'color'),
  ('theme_dark_background_color', '#15130f', 'color'),
  ('theme_dark_text_color', '#f4eadc', 'color'),
  ('theme_dark_surface_color', '#1f1b17', 'color'),
  ('font_heading', 'Playfair Display', 'select'),
  ('font_body', 'Manrope', 'select'),
  ('hero_layout', 'split', 'select'),
  ('portfolio_template', 'editorial', 'select'),
  ('visual_style', 'default', 'select'),
  ('background_effect', 'plain', 'select'),
  ('hero_template', 'split', 'select'),
  ('hero_text_position', 'left', 'select'),
  ('hero_heading_position', 'left', 'select'),
  ('hero_tagline_position', 'left', 'select'),
  ('hero_button_position', 'follow', 'select'),
  ('hero_text_size', 'large', 'select'),
  ('hero_image_shape', 'portrait', 'select'),
  ('show_hero_image', 'true', 'boolean'),
  ('sections_visible', '{"about":true,"services":true,"projects":true,"experience":true,"education":true,"skills":true,"certificates":true,"testimonials":true,"contact":true}', 'json'),
  ('section_order', '["about","services","projects","experience","education","skills","certificates","testimonials","contact"]', 'json'),
  ('show_hire_me_button', 'true', 'boolean'),
  ('meta_description', '', 'text'),
  ('og_image_url', '', 'text'),
  ('favicon_url', '', 'text')
on conflict (key) do update set value = excluded.value, type = excluded.type;
