-- Vartotojų profiliai, admin rolė ir administratoriaus teisės keisti tarifus.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null default '',
  phone text not null default '',
  role text not null default 'client' check (role in ('client','admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'full_name', ''),
          coalesce(new.raw_user_meta_data->>'phone', ''));
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy "own profile read" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy "own profile update" on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = (select p.role from public.profiles p where p.id = (select auth.uid())));
create policy "admin update profiles" on public.profiles for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "admin write" on public.settings for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin write" on public.duty_rates for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin write" on public.sea_rates for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin write" on public.towing_routes for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin write" on public.yards for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin write" on public.auction_fee_brackets for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin read history" on public.tariff_history for select to authenticated using ((select public.is_admin()));
