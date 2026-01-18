-- Public users table + volunteer signup linkage + RLS policies

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  created_at timestamptz default now()
);

alter table public.volunteer_signups
  add column if not exists user_id uuid references public.users(id) on delete set null;

create index if not exists volunteer_signups_user_id_idx
  on public.volunteer_signups(user_id);

create or replace function public.handle_new_public_user()
returns trigger as $$
begin
  insert into public.users (id, full_name, email, phone, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', ''),
    now()
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created_public on auth.users;
create trigger on_auth_user_created_public
  after insert on auth.users
  for each row execute procedure public.handle_new_public_user();

-- Backfill existing auth users
insert into public.users (id, full_name, email, phone, created_at)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''),
  u.email,
  coalesce(u.raw_user_meta_data->>'phone', ''),
  u.created_at
from auth.users u
where not exists (select 1 from public.users p where p.id = u.id);

alter table public.users enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select
  using (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

alter table public.volunteer_signups enable row level security;

drop policy if exists "volunteer_signups_insert_public" on public.volunteer_signups;
create policy "volunteer_signups_insert_public" on public.volunteer_signups
  for insert
  with check (true);

drop policy if exists "volunteer_signups_select_own" on public.volunteer_signups;
create policy "volunteer_signups_select_own" on public.volunteer_signups
  for select
  using (auth.uid() = user_id);
