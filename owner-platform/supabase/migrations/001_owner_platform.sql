-- Run in a dedicated Supabase project. Only the server service role may mutate.
create table public.sites (id uuid primary key, name text not null);
create table public.memberships (site_id uuid references public.sites on delete cascade, user_id uuid references auth.users on delete cascade, primary key(site_id,user_id));
create table public.drafts (site_id uuid primary key references public.sites, document jsonb not null, version bigint not null default 0, updated_at timestamptz not null default now());
create table public.revisions (id uuid primary key default gen_random_uuid(), site_id uuid not null references public.sites, document jsonb not null, label text not null, created_by uuid not null references auth.users, created_at timestamptz not null default now());
create table public.publications (site_id uuid primary key references public.sites, revision_id uuid not null references public.revisions, published_at timestamptz not null default now());
create table public.assets (id uuid primary key default gen_random_uuid(), site_id uuid not null references public.sites, name text not null, object_key text not null unique, url text not null, size bigint not null, created_at timestamptz not null default now());
create function public.reject_revision_change() returns trigger language plpgsql set search_path='' as $$ begin raise exception 'Revisions are immutable'; end $$;
create trigger immutable_revision before update or delete on public.revisions for each row execute function public.reject_revision_change();

alter table public.sites enable row level security;
alter table public.memberships enable row level security;
alter table public.drafts enable row level security;
alter table public.revisions enable row level security;
alter table public.publications enable row level security;
alter table public.assets enable row level security;
create policy own_membership on public.memberships for select to authenticated using(user_id = auth.uid());
create policy owner_sites on public.sites for select to authenticated using(exists(select 1 from public.memberships m where m.site_id = sites.id and m.user_id = auth.uid()));
create policy owner_drafts on public.drafts for select to authenticated using(exists(select 1 from public.memberships m where m.site_id = drafts.site_id and m.user_id = auth.uid()));
create policy owner_revisions on public.revisions for select to authenticated using(exists(select 1 from public.memberships m where m.site_id = revisions.site_id and m.user_id = auth.uid()));
create policy owner_publications on public.publications for select to authenticated using(exists(select 1 from public.memberships m where m.site_id = publications.site_id and m.user_id = auth.uid()));
create policy owner_assets on public.assets for select to authenticated using(exists(select 1 from public.memberships m where m.site_id = assets.site_id and m.user_id = auth.uid()));
revoke all on public.sites,public.memberships,public.drafts,public.revisions,public.publications,public.assets from anon,authenticated;
grant select on public.sites,public.memberships,public.drafts,public.revisions,public.publications,public.assets to authenticated;
grant all on public.sites,public.memberships,public.drafts,public.revisions,public.publications,public.assets to service_role;

create function public.owner_change(p_site uuid, p_actor uuid, p_action text, p_expected bigint, p_document jsonb default null, p_revision uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare d public.drafts; r uuid; doc jsonb; published timestamptz;
begin
  if not exists(select 1 from public.memberships where site_id=p_site and user_id=p_actor) then raise exception 'Owner access required' using errcode='42501'; end if;
  -- A site row lock also serializes first-time seeding, before a draft exists.
  perform 1 from public.sites where id=p_site for update;
  select * into d from public.drafts where site_id=p_site for update;
  if p_action='seed' then
    if d.site_id is null then
      insert into public.drafts(site_id,document) values(p_site,p_document) returning * into d;
      insert into public.revisions(site_id,document,label,created_by) values(p_site,p_document,'Original imported baseline',p_actor);
    end if;
  else
    if d.site_id is null then raise exception 'Draft not initialized'; end if;
    if d.version <> p_expected then raise exception 'Draft changed in another session' using errcode='PT409'; end if;
    if p_action='save' then
      update public.drafts set document=p_document,version=version+1,updated_at=now() where site_id=p_site returning * into d;
    elsif p_action='restore' then
      select document into doc from public.revisions where id=p_revision and site_id=p_site;
      if doc is null then raise exception 'Revision not found' using errcode='P0002'; end if;
      update public.drafts set document=doc,version=version+1,updated_at=now() where site_id=p_site returning * into d;
    elsif p_action='publish' then
      -- The server validates this exact document before calling this function.
      if d.document is distinct from p_document then raise exception 'Draft changed during validation' using errcode='PT409'; end if;
      insert into public.revisions(site_id,document,label,created_by) values(p_site,d.document,'Published revision ' || d.version,p_actor) returning id into r;
      insert into public.publications(site_id,revision_id) values(p_site,r) on conflict(site_id) do update set revision_id=excluded.revision_id,published_at=now();
    else raise exception 'Unknown action'; end if;
  end if;
  select published_at into published from public.publications where site_id=p_site;
  return jsonb_build_object('document',d.document,'version',d.version,'publishedAt',published);
end $$;
revoke all on function public.owner_change(uuid,uuid,text,bigint,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.owner_change(uuid,uuid,text,bigint,jsonb,uuid) to service_role;

create function public.read_published(p_site uuid) returns jsonb language sql stable security definer set search_path='' as $$
  select r.document from public.publications p join public.revisions r on r.id=p.revision_id and r.site_id=p.site_id where p.site_id=p_site;
$$;
revoke all on function public.read_published(uuid) from public;
grant execute on function public.read_published(uuid) to anon,authenticated,service_role;

-- Immutable objects are public assets, but only the validated server upload can write.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('site-media','site-media',true,4194304,array['image/png','image/jpeg','image/gif','image/webp']);
insert into public.sites(id,name) values('00000000-0000-4000-8000-000000000001','Axiomotl');
