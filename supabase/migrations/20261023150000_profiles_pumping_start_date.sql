-- Lactae — suppression du prénom enfant + renommage date de naissance
-- en date de début de tirage de lait

alter table public.profiles
  drop column if exists child_first_name;

alter table public.profiles
  rename column child_birth_date to pumping_start_date;

comment on column public.profiles.pumping_start_date is
  'Date de début de tirage de lait (optionnel)';
