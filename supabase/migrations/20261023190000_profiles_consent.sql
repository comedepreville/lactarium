-- Lactae — preuve de consentement à l’inscription (infos légales + données de suivi)

alter table public.profiles
  add column if not exists consent_infos_legales_at timestamptz,
  add column if not exists consent_health_at timestamptz,
  add column if not exists consent_legal_version text
    check (
      consent_legal_version is null
      or char_length(trim(consent_legal_version)) between 1 and 40
    );

comment on column public.profiles.consent_infos_legales_at is
  'Horodatage d''acceptation des Infos légales';
comment on column public.profiles.consent_health_at is
  'Horodatage du consentement au traitement des données de suivi (tirages, notes, journal)';
comment on column public.profiles.consent_legal_version is
  'Version des Infos légales acceptée (ex. 2026-10-23)';

-- Copie les consentements depuis les métadonnées Auth à la création du profil
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  consented_infos boolean := (meta->>'consent_infos_legales') = 'true';
  consented_health boolean := (meta->>'consent_health') = 'true';
  legal_version text := nullif(trim(meta->>'consent_legal_version'), '');
begin
  insert into public.profiles (
    id,
    consent_infos_legales_at,
    consent_health_at,
    consent_legal_version
  )
  values (
    new.id,
    case when consented_infos then now() else null end,
    case when consented_health then now() else null end,
    case
      when consented_infos and consented_health then legal_version
      else null
    end
  );
  return new;
end;
$$;
