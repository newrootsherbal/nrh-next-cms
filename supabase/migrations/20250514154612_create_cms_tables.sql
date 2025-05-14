-- supabase/migrations/[timestamp]_create_cms_tables.sql

-- lowercase sql

-- table: pages
create table public.pages (
  id uuid not null default gen_random_uuid() primary key,
  title text not null,
  slug text not null,
  language_id bigint not null references public.languages (id) on delete restrict, -- link to languages table
  status text not null default 'draft', -- 'draft', 'published', 'archived'
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  author_id uuid references auth.users (id) on delete set null, -- link to auth.users
  meta_title text,
  meta_description text,

  -- ensure unique slug per language
  constraint pages_slug_language_id_key unique (slug, language_id),

  -- status check constraint
  constraint pages_status_check check (status in ('draft', 'published', 'archived'))
);

comment on table public.pages is 'static pages content (e.g., about us, contact).';
comment on column public.pages.slug is 'unique identifier for the page, combined with language_id.';
comment on column public.pages.status is 'publication status of the page.';
comment on column public.pages.author_id is 'the user who created or last updated the page.';
comment on column public.pages.meta_title is 'seo meta title for the page.';
comment on column public.pages.meta_description is 'seo meta description for the page.';

-- table: posts
create table public.posts (
  id uuid not null default gen_random_uuid() primary key,
  title text not null,
  slug text not null,
  language_id bigint not null references public.languages (id) on delete restrict, -- link to languages table
  status text not null default 'draft', -- 'draft', 'published', 'archived'
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  published_at timestamp with time zone, -- date when the post was published
  author_id uuid references auth.users (id) on delete set null, -- link to auth.users
  excerpt text, -- short summary
  meta_title text,
  meta_description text,

  -- ensure unique slug per language
  constraint posts_slug_language_id_key unique (slug, language_id),

  -- status check constraint
  constraint posts_status_check check (status in ('draft', 'published', 'archived'))
);

comment on table public.posts is 'blog posts or articles.';
comment on column public.posts.excerpt is 'a short summary of the post.';
comment on column public.posts.published_at is 'the date and time the post was published.';

-- table: media
create table public.media (
  id uuid not null default gen_random_uuid() primary key,
  file_name text not null,
  object_key text not null unique, -- unique key in r2 bucket
  file_type text, -- mime type
  size bigint, -- file size in bytes
  uploaded_at timestamp with time zone not null default now(),
  uploaded_by uuid references auth.users (id) on delete set null -- user who uploaded
);

comment on table public.media is 'metadata for media assets stored in cloudflare r2.';
comment on column public.media.object_key is 'the unique key or path of the object in the r2 bucket.';
comment on column public.media.uploaded_by is 'the user who uploaded the media file.';

-- table: blocks
create table public.blocks (
  id uuid not null default gen_random_uuid() primary key,
  type text not null, -- 'text', 'image', 'video', 'html', etc. (defined in app code)
  content jsonb, -- structured data for the block (e.g., text string, image metadata)
  position integer not null default 0, -- order of the block within its parent

  -- polymorphic relationship: a block belongs to EITHER a page or a post
  page_id uuid references public.pages (id) on delete cascade,
  post_id uuid references public.posts (id) on delete cascade,

  -- ensure a block is linked to exactly one parent
  constraint blocks_parent_check check (
    (page_id is not null and post_id is null) or
    (page_id is null and post_id is not null)
  ),

  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  created_by uuid references auth.users (id) on delete set null -- user who created
);

comment on table public.blocks is 'content blocks used to compose pages and posts.';
comment on column public.blocks.type is 'the type of content block (e.g., text, image, video).';
comment on column public.blocks.content is 'jsonb data specific to the block type.';
comment on column public.blocks.position is 'the order of the block within its parent content.';
comment on column public.blocks.page_id is 'foreign key to the pages table if the block belongs to a page.';
comment on column public.blocks.post_id is 'foreign key to the posts table if the block belongs to a post.';
comment on column public.blocks.created_by is 'the user who created the block.';

-- table: navigation
-- represents navigation menus and items
create table public.navigation (
  id uuid not null default gen_random_uuid() primary key,
  menu text not null, -- 'header', 'footer', etc.
  label text not null, -- the text displayed in the menu
  url text, -- external or internal url
  page_id uuid references public.pages (id) on delete set null, -- link to an internal page (mutually exclusive with url)
  parent_id uuid references public.navigation (id) on delete cascade, -- for nested menu items
  position integer not null default 0, -- order within the menu or parent
  language_id bigint not null references public.languages (id) on delete restrict, -- language of the menu item

  -- ensure a navigation item has either a url or a page_id, not both
  constraint navigation_url_or_page_check check (
    (url is not null and page_id is null) or
    (url is null and page_id is not null) or -- linking to an internal page
    (url is null and page_id is null) -- this case allows a parent item with no direct link
  ),

  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

comment on table public.navigation is 'navigation menu items.';
comment on column public.navigation.menu is 'the menu the item belongs to (e.g., header, footer).';
comment on column public.navigation.label is 'the text displayed for the menu item.';
comment on column public.navigation.url is 'external url or a custom internal path.';
comment on column public.navigation.page_id is 'link to an internal page.';
comment on column public.navigation.parent_id is 'link to a parent navigation item for nesting.';
comment on column public.navigation.position is 'the order of the item within its menu or parent.';
comment on column public.navigation.language_id is 'the language of the navigation item.';

-- (Optional) Triggers to automatically update 'updated_at' timestamps
-- these can be added in separate migration files for clarity if preferred
-- or added here.

-- trigger for pages
create or replace function public.handle_pages_update()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_pages_update
  before update on public.pages
  for each row
  execute procedure public.handle_pages_update();

-- trigger for posts
create or replace function public.handle_posts_update()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_posts_update
  before update on public.posts
  for each row
  execute procedure public.handle_posts_update();

-- trigger for media (optional, if you want to track updates)
create or replace function public.handle_media_update()
returns trigger
language plpgsql
as $$
begin
  new.uploaded_at = now(); -- or a separate updated_at column
  return new;
end;
$$;

-- create trigger on_media_update
--   before update on public.media
--   for each row
--   execute procedure public.handle_media_update();


-- trigger for blocks
create or replace function public.handle_blocks_update()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_blocks_update
  before update on public.blocks
  for each row
  execute procedure public.handle_blocks_update();

-- trigger for navigation
create or replace function public.handle_navigation_update()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_navigation_update
  before update on public.navigation
  for each row
  execute procedure public.handle_navigation_update();
