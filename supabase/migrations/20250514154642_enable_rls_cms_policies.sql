-- supabase/migrations/[timestamp]_enable_rls_cms_policies.sql

-- lowercase sql

-- enable rls on all new cms tables
alter table public.pages enable row level security;
alter table public.posts enable row level security;
alter table public.media enable row level security;
alter table public.blocks enable row level security;
alter table public.navigation enable row level security;

-- policies for pages table
-- allow all authenticated users to read published pages
create policy "authenticated_can_read_published_pages"
on public.pages for select
to authenticated
using (status = 'published');

-- allow anon users to read published pages (for public site)
create policy "anon_can_read_published_pages"
on public.pages for select
to anon
using (status = 'published');

-- allow admins and writers to read all pages (for cms)
create policy "admins_and_writers_can_read_all_pages"
on public.pages for select
to authenticated
using (public.get_current_user_role() in ('ADMIN', 'WRITER'));

-- allow admins and writers to insert pages
create policy "admins_and_writers_can_insert_pages"
on public.pages for insert
to authenticated
with check (public.get_current_user_role() in ('ADMIN', 'WRITER'));

-- allow admins and writers to update pages
create policy "admins_and_writers_can_update_pages"
on public.pages for update
to authenticated
using (public.get_current_user_role() in ('ADMIN', 'WRITER'))
with check (public.get_current_user_role() in ('ADMIN', 'WRITER'));

-- allow admins to delete pages
create policy "admins_can_delete_pages"
on public.pages for delete
to authenticated
using (public.get_current_user_role() = 'ADMIN');

-- policies for posts table (similar to pages)
-- allow all authenticated users to read published posts
create policy "authenticated_can_read_published_posts"
on public.posts for select
to authenticated
using (status = 'published');

-- allow anon users to read published posts (for public site)
create policy "anon_can_read_published_posts"
on public.posts for select
to anon
using (status = 'published');

-- allow admins and writers to read all posts (for cms)
create policy "admins_and_writers_can_read_all_posts"
on public.posts for select
to authenticated
using (public.get_current_user_role() in ('ADMIN', 'WRITER'));

-- allow admins and writers to insert posts
create policy "admins_and_writers_can_insert_posts"
on public.posts for insert
to authenticated
with check (public.get_current_user_role() in ('ADMIN', 'WRITER'));

-- allow admins and writers to update posts
create policy "admins_and_writers_can_update_posts"
on public.posts for update
to authenticated
using (public.get_current_user_role() in ('ADMIN', 'WRITER'))
with check (public.get_current_user_role() in ('ADMIN', 'WRITER'));

-- allow admins to delete posts
create policy "admins_can_delete_posts"
on public.posts for delete
to authenticated
using (public.get_current_user_role() = 'ADMIN');


-- policies for media table
-- allow all authenticated users to read media (if they have access to content using it)
create policy "authenticated_can_read_media"
on public.media for select
to authenticated
using (true); -- assuming if they can access the CMS, they can see media list

-- allow anon users to read media that is used in published content
-- this policy is more complex and might involve joining with content tables.
-- for simplicity initially, we can make media publicly readable or restricted.
-- let's start by allowing authenticated users to read all media and restrict others.
-- if anon users need media access, we'd refine this.
-- create policy "anon_can_read_used_media" ...

-- allow admins and writers to insert media (upload)
create policy "admins_and_writers_can_insert_media"
on public.media for insert
to authenticated
with check (public.get_current_user_role() in ('ADMIN', 'WRITER'));

-- allow admins and writers to update media (e.g., rename file)
create policy "admins_and_writers_can_update_media"
on public.media for update
to authenticated
using (public.get_current_user_role() in ('ADMIN', 'WRITER'))
with check (public.get_current_user_role() in ('ADMIN', 'WRITER'));

-- allow admins to delete media
create policy "admins_can_delete_media"
on public.media for delete
to authenticated
using (public.get_current_user_role() = 'ADMIN');

-- policies for blocks table
-- allow all authenticated users to read blocks
create policy "authenticated_can_read_blocks"
on public.blocks for select
to authenticated
using (true); -- assuming if they can access the CMS, they can read block data

-- allow anon users to read blocks associated with published content
-- similar to media, this is more complex. For now, restrict anon read.
-- if public site needs blocks, refine this policy.

-- allow admins and writers to insert blocks
create policy "admins_and_writers_can_insert_blocks"
on public.blocks for insert
to authenticated
with check (public.get_current_user_role() in ('ADMIN', 'WRITER'));

-- allow admins and writers to update blocks
create policy "admins_and_writers_can_update_blocks"
on public.blocks for update
to authenticated
using (public.get_current_user_role() in ('ADMIN', 'WRITER'))
with check (public.get_current_user_role() in ('ADMIN', 'WRITER'));

-- allow admins and writers to delete blocks
-- on delete cascade from pages/posts handles deletion when parent is deleted.
-- this policy is for direct block deletion via CMS.
create policy "admins_and_writers_can_delete_blocks"
on public.blocks for delete
to authenticated
using (public.get_current_user_role() in ('ADMIN', 'WRITER'));

-- policies for navigation table
-- allow all authenticated users to read navigation (for CMS)
create policy "authenticated_can_read_navigation"
on public.navigation for select
to authenticated
using (true); -- assuming if they can access the CMS, they can read nav structure

-- allow anon users to read navigation (for public site)
create policy "anon_can_read_navigation"
on public.navigation for select
to anon
using (true); -- navigation is typically public

-- allow admins to manage navigation (insert, update, delete)
create policy "admins_can_manage_navigation"
on public.navigation for all -- covers insert, update, delete
to authenticated
using (public.get_current_user_role() = 'ADMIN')
with check (public.get_current_user_role() = 'ADMIN');
