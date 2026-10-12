-- Paskyros, statymai, planų užsakymai, mėgstamiausi, Telegram pranešimai.
-- Pritaikyta projekte 2026-10-12 keliomis migracijomis; čia — suvestinė.

alter table public.profiles
  add column first_name text not null default '', add column last_name text not null default '',
  add column country text not null default 'Lietuva', add column address text not null default '',
  add column city text not null default '', add column zip text not null default '',
  add column company_name text not null default '', add column company_code text not null default '',
  add column vat_code text not null default '', add column company_address text not null default '';

revoke update on public.profiles from authenticated, anon;
grant update (first_name, last_name, full_name, phone, country, address, city, zip, company_name, company_code, vat_code, company_address)
  on public.profiles to authenticated;
alter policy "own profile update" on public.profiles using (id = (select auth.uid())) with check (id = (select auth.uid()));

create table public.app_config (key text primary key, value text not null default '');
create table public.user_plans (
  id bigserial primary key, user_id uuid not null references auth.users(id) on delete cascade,
  plan_id int references public.deposit_plans(id), name text not null, deposit_eur numeric(10,2) not null,
  max_bid_usd numeric(12,2) not null, active_bids int not null,
  status text not null default 'pending' check (status in ('pending','active','refund_requested','refunded','cancelled')),
  admin_note text not null default '', created_at timestamptz not null default now(), activated_at timestamptz, closed_at timestamptz);
create table public.bids (
  id bigserial primary key, user_id uuid not null references auth.users(id) on delete cascade,
  lot_id text not null references public.lots(id), max_bid_usd numeric(12,2) not null check (max_bid_usd > 0),
  status text not null default 'pending' check (status in ('pending','placed','won','lost','cancelled')),
  final_price_usd numeric(12,2), admin_note text not null default '', lot_title text, auction_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create unique index bids_one_open_per_lot on public.bids (user_id, lot_id) where status in ('pending','placed');
create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade, lot_id text not null references public.lots(id),
  created_at timestamptz not null default now(), primary key (user_id, lot_id));

-- RLS: klientas mato tik savo įrašus; adminas — viską. Rašymas tik per funkcijas:
--   place_bid(lot, suma)  — tikrina aktyvų planą, maks. sumą, aktyvių statymų limitą, ar aukcionas nesibaigė
--   cancel_bid(id), request_plan(plan), request_refund(id)
--   notify_admin(tekstas) — Telegram per pg_net (raktas Vault: telegram_bot_token, ID: app_config.telegram_chat_id)
--   set_telegram / telegram_status / test_telegram — admin nustatymai
-- Pilnas funkcijų kodas: Supabase projekto migracijos „bid_functions_and_notify“ ir „telegram_admin_functions“.
