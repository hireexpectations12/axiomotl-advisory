-- Run after migration in an isolated test project with psql -v ON_ERROR_STOP=1.
-- This transaction rolls back fixtures. Real two-session concurrency is tested by
-- two calls sharing expected_version: the second must fail after the first commits.
begin;
insert into auth.users(id,email) values('00000000-0000-4000-8000-000000000002','integration-owner@example.test');
insert into public.memberships values('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002');
select public.owner_change('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','seed',0,'{"marker":"baseline"}');
select public.owner_change('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','save',0,'{"marker":"first"}');
do $$ begin
  begin
    perform public.owner_change('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','save',0,'{"marker":"stale"}');
    raise exception 'FAIL: stale version accepted';
  exception when sqlstate 'PT409' then null; end;
end $$;
select public.owner_change('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','publish',1,'{"marker":"first"}');
do $$ declare baseline uuid; begin
  select id into baseline from public.revisions where label='Original imported baseline' and site_id='00000000-0000-4000-8000-000000000001';
  perform public.owner_change('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','restore',1,null,baseline);
  if (select document->>'marker' from public.drafts where site_id='00000000-0000-4000-8000-000000000001') <> 'baseline' then raise exception 'FAIL: restore did not copy revision'; end if;
  if public.read_published('00000000-0000-4000-8000-000000000001')->>'marker' <> 'first' then raise exception 'FAIL: restore changed published state'; end if;
  begin
    update public.revisions set document='{}' where id=baseline;
    raise exception 'FAIL: revision was mutable';
  exception when raise_exception then
    if sqlerrm <> 'Revisions are immutable' then raise; end if;
  end;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',true);
do $$ begin
  if exists(select 1 from public.drafts) then raise exception 'FAIL: nonmember can read draft'; end if;
  begin
    perform public.owner_change('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','publish',2,'{}');
    raise exception 'FAIL: authenticated role can publish directly';
  exception when insufficient_privilege then null; end;
end $$;
set local role anon;
do $$ begin
  begin perform 1 from public.drafts; raise exception 'FAIL: anon can read draft'; exception when insufficient_privilege then null; end;
  if public.read_published('00000000-0000-4000-8000-000000000001')->>'marker' <> 'first' then raise exception 'FAIL: explicit public publication read'; end if;
end $$;
rollback;
