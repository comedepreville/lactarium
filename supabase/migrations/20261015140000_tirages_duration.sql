-- Durée du tirage en minutes (nullable pour les lignes existantes).
-- Côté app : obligatoire à la création / mise à jour.

alter table public.tirages
  add column if not exists duration integer
  check (duration is null or (duration >= 1 and duration <= 120));

comment on column public.tirages.duration is 'Durée du tirage en minutes';
