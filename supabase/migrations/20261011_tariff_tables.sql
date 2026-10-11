-- Tarifų lentelės (pritaikyta Supabase projekte „tavo-auto-usa“ 2026-10-11).
create table public.ports (
  code text primary key,
  name text not null,
  sort int not null default 0
);

create table public.yards (
  id serial primary key,
  raw_name text not null unique,
  city text not null default '',
  state text not null default '',
  auction text not null,
  needs_review boolean not null default false,
  api_location_id text
);
create index on public.yards (auction, state);

create table public.towing_routes (
  yard_id int not null references public.yards(id) on delete cascade,
  port_code text not null references public.ports(code),
  cargo_type text not null check (cargo_type in ('car','moto')),
  price_usd numeric(10,2) not null check (price_usd >= 0),
  primary key (yard_id, port_code, cargo_type)
);

create table public.sea_rates (
  port_code text not null references public.ports(code),
  size_class text not null check (size_class in ('regular','large','oversize','moto','moto_large')),
  price_usd numeric(10,2) not null check (price_usd >= 0),
  primary key (port_code, size_class)
);

create table public.auction_fee_brackets (
  id serial primary key,
  auction text not null check (auction in ('copart','iaai')),
  from_usd numeric(12,2) not null,
  to_usd numeric(12,2),
  fee_usd numeric(10,2) not null default 0,
  pct numeric(6,4) not null default 0
);

create table public.duty_rates (
  vehicle_type text primary key check (vehicle_type in ('car','moto','truck','classic')),
  pct numeric(6,4),
  label text not null
);

create table public.settings (
  key text primary key,
  value numeric(12,4) not null,
  label text not null,
  unit text not null default ''
);

create table public.tariff_history (
  id bigserial primary key,
  table_name text not null,
  op text not null,
  old_row jsonb,
  new_row jsonb,
  changed_by uuid default auth.uid(),
  changed_at timestamptz not null default now()
);

create or replace function public.log_tariff_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.tariff_history(table_name, op, old_row, new_row)
  values (tg_table_name, tg_op,
          case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
          case when tg_op in ('UPDATE','INSERT') then to_jsonb(new) end);
  return coalesce(new, old);
end $$;
revoke execute on function public.log_tariff_change() from public, anon, authenticated;

create trigger trg_hist_sea after update or delete on public.sea_rates for each row execute function public.log_tariff_change();
create trigger trg_hist_tow after update or delete on public.towing_routes for each row execute function public.log_tariff_change();
create trigger trg_hist_fee after insert or update or delete on public.auction_fee_brackets for each row execute function public.log_tariff_change();
create trigger trg_hist_duty after update on public.duty_rates for each row execute function public.log_tariff_change();
create trigger trg_hist_set after update on public.settings for each row execute function public.log_tariff_change();

alter table public.ports enable row level security;
alter table public.yards enable row level security;
alter table public.towing_routes enable row level security;
alter table public.sea_rates enable row level security;
alter table public.auction_fee_brackets enable row level security;
alter table public.duty_rates enable row level security;
alter table public.settings enable row level security;
alter table public.tariff_history enable row level security;

create policy "public read" on public.ports for select using (true);
create policy "public read" on public.yards for select using (true);
create policy "public read" on public.towing_routes for select using (true);
create policy "public read" on public.sea_rates for select using (true);
create policy "public read" on public.auction_fee_brackets for select using (true);
create policy "public read" on public.duty_rates for select using (true);
create policy "public read" on public.settings for select using (true);

insert into public.duty_rates values
  ('car', 0.10, 'Lengvasis automobilis'),
  ('moto', null, 'Motociklas'),
  ('truck', null, 'Krovininis'),
  ('classic', null, 'Senovinis (30+ m.)');

insert into public.settings values
  ('usd_to_eur', 0.86, 'USD → EUR kursas', 'EUR'),
  ('fx_buffer_pct', 0.02, 'Kurso buferis', '%'),
  ('vat_pct', 0.21, 'PVM', '%'),
  ('declaration_eur', 0, 'Deklaravimas', 'EUR'),
  ('port_fees_eur', 0, 'Uosto mokesčiai', 'EUR'),
  ('unloading_eur', 0, 'Iškrovimas', 'EUR'),
  ('broker_fee_eur', 0, 'Brokerio mokestis', 'EUR');
