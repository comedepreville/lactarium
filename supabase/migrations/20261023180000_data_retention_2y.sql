-- Lactae — conservation max 2 ans (tirages + journal)
-- Appelée par le cron app (service role) via RPC.

create or replace function public.purge_data_older_than_retention(
  retention_years integer default 2
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cutoff timestamptz := now() - make_interval(years => retention_years);
  tirages_deleted integer;
  journal_deleted integer;
begin
  if retention_years < 1 then
    raise exception 'retention_years must be >= 1';
  end if;

  delete from public.tirages
  where datetime < cutoff;
  get diagnostics tirages_deleted = row_count;

  delete from public.journal_entries
  where datetime < cutoff;
  get diagnostics journal_deleted = row_count;

  return jsonb_build_object(
    'cutoff', cutoff,
    'retention_years', retention_years,
    'tirages_deleted', tirages_deleted,
    'journal_deleted', journal_deleted
  );
end;
$$;

comment on function public.purge_data_older_than_retention(integer) is
  'Efface tirages et journal plus vieux que retention_years (défaut 2). Service role uniquement.';

revoke all on function public.purge_data_older_than_retention(integer) from public;
revoke all on function public.purge_data_older_than_retention(integer) from anon, authenticated;
grant execute on function public.purge_data_older_than_retention(integer) to service_role;
