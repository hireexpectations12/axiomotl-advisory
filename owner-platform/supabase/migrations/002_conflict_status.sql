-- Return HTTP 409 directly through PostgREST; do not classify a stale editor version as a retryable serialization failure.
create or replace function public.owner_change(p_site uuid, p_actor uuid, p_action text, p_expected bigint, p_document jsonb default null, p_revision uuid default null)
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

-- On this newly provisioned dedicated project, clean up only our stalled owner_change
-- test requests left retrying the previous serialization error. Do not terminate
-- unrelated requests or the SQL editor session applying this migration.
select pg_terminate_backend(pid)
from pg_stat_activity
where usename = 'authenticator'
  and state = 'active'
  and query like '%owner_change%'
  and query_start < now() - interval '60 seconds'
  and pid <> pg_backend_pid();
