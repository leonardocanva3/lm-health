drop policy if exists "Users can read own active profile" on public.profiles;

create policy "Users can read own active profile"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
  and active = true
);

comment on policy "Users can read own active profile" on public.profiles is
  'Permite que um usuario autenticado leia apenas o proprio profile ativo para resolver role no login.';
