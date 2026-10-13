-- Lactae — enrichissement profiles
-- prénom / date de naissance de l'enfant + type d'utilisateur

alter table public.profiles
  add column child_first_name text
    check (
      child_first_name is null
      or char_length(trim(child_first_name)) between 1 and 80
    ),
  add column child_birth_date date,
  add column user_type text not null default 'user'
    check (user_type in ('user', 'admin', 'soignant'));

comment on column public.profiles.child_first_name is 'Prénom de l''enfant (optionnel)';
comment on column public.profiles.child_birth_date is 'Date de naissance de l''enfant (optionnel)';
comment on column public.profiles.user_type is 'Rôle applicatif : user | admin | soignant';
