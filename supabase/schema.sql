-- قاعدة بيانات صفحة روابط شَجَن
-- شغّلي الملف كاملًا من Supabase > SQL Editor.
-- بعد التنفيذ: أنشئي مستخدم الإدارة من Authentication > Users
-- ويُفضّل تعطيل التسجيل العام من Authentication > Providers > Email.

create extension if not exists pgcrypto;

create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  brand_name text not null default 'شَجَن',
  page_title text not null default 'شَجَن',
  bio text default 'جميع روابطنا في مكان واحد',
  logo_url text default '',
  background_type text not null default 'color'
    check (background_type in ('color', 'image')),
  background_color text not null default '#f5f2e8',
  background_image_url text default '',
  button_color text not null default '#6f7654',
  button_text_color text not null default '#ffffff',
  button_radius integer not null default 18 check (button_radius between 0 and 60),
  button_shadow boolean not null default true,
  footer_text text default 'جميع الحقوق محفوظة لشَجَن',
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  icon text not null default 'link',
  is_visible boolean not null default true,
  open_new_tab boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists links_sort_order_idx on public.links (sort_order);
create index if not exists links_visibility_idx on public.links (is_visible);

create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  referrer text,
  created_at timestamptz not null default now()
);

create index if not exists page_views_created_at_idx on public.page_views (created_at desc);

create table if not exists public.click_events (
  id bigint generated always as identity primary key,
  link_id uuid references public.links(id) on delete set null,
  link_title text,
  referrer text,
  created_at timestamptz not null default now()
);

create index if not exists click_events_link_id_idx on public.click_events (link_id);
create index if not exists click_events_created_at_idx on public.click_events (created_at desc);

alter table public.site_settings enable row level security;
alter table public.links enable row level security;
alter table public.page_views enable row level security;
alter table public.click_events enable row level security;

-- حذف السياسات السابقة عند إعادة تشغيل الملف
drop policy if exists "public read settings" on public.site_settings;
drop policy if exists "admin manage settings" on public.site_settings;
drop policy if exists "public read visible links" on public.links;
drop policy if exists "admin read all links" on public.links;
drop policy if exists "admin manage links" on public.links;
drop policy if exists "public insert page views" on public.page_views;
drop policy if exists "admin read page views" on public.page_views;
drop policy if exists "public insert click events" on public.click_events;
drop policy if exists "admin read click events" on public.click_events;

create policy "public read settings"
on public.site_settings
for select
to anon, authenticated
using (true);

create policy "admin manage settings"
on public.site_settings
for all
to authenticated
using (true)
with check (true);

create policy "public read visible links"
on public.links
for select
to anon
using (is_visible = true);

create policy "admin read all links"
on public.links
for select
to authenticated
using (true);

create policy "admin manage links"
on public.links
for all
to authenticated
using (true)
with check (true);

create policy "public insert page views"
on public.page_views
for insert
to anon, authenticated
with check (true);

create policy "admin read page views"
on public.page_views
for select
to authenticated
using (true);

create policy "public insert click events"
on public.click_events
for insert
to anon, authenticated
with check (true);

create policy "admin read click events"
on public.click_events
for select
to authenticated
using (true);

-- إحصاءات مجمعة للإدارة، حتى تبقى الأعداد دقيقة عند تجاوز 1000 نقرة.
create or replace function public.get_admin_analytics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'authenticated' then
    raise exception 'Not authorized';
  end if;

  return jsonb_build_object(
    'total_views', (select count(*) from public.page_views),
    'total_clicks', (select count(*) from public.click_events),
    'by_link', coalesce(
      (
        select jsonb_object_agg(grouped.link_id, grouped.click_count)
        from (
          select link_id::text as link_id, count(*) as click_count
          from public.click_events
          where link_id is not null
          group by link_id
        ) as grouped
      ),
      '{}'::jsonb
    )
  );
end;
$$;

revoke all on function public.get_admin_analytics() from public;
grant execute on function public.get_admin_analytics() to authenticated;

-- مساحة عامة لصور الشعار والخلفية
insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "public read site assets" on storage.objects;
drop policy if exists "admin upload site assets" on storage.objects;
drop policy if exists "admin update site assets" on storage.objects;
drop policy if exists "admin delete site assets" on storage.objects;

create policy "public read site assets"
on storage.objects
for select
to public
using (bucket_id = 'site-assets');

create policy "admin upload site assets"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'site-assets');

create policy "admin update site assets"
on storage.objects
for update
to authenticated
using (bucket_id = 'site-assets')
with check (bucket_id = 'site-assets');

create policy "admin delete site assets"
on storage.objects
for delete
to authenticated
using (bucket_id = 'site-assets');

-- روابط تجريبية أولية، ويمكن حذفها من لوحة التحكم.
insert into public.links (title, url, icon, sort_order)
select 'تواصلي معنا عبر واتساب', 'https://wa.me/966501008713', 'whatsapp', 0
where not exists (select 1 from public.links);

insert into public.links (title, url, icon, sort_order)
select 'Instagram', 'https://instagram.com/', 'instagram', 1
where (select count(*) from public.links) = 1;
