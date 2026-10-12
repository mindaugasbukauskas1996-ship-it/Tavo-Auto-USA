-- Užstato planai (rodomi pradžios puslapyje, redaguojami admin skyde)
create table public.deposit_plans (
  id serial primary key,
  name text not null,
  deposit_eur numeric(10,2) not null check (deposit_eur >= 0),
  max_bid_usd numeric(12,2) not null check (max_bid_usd >= 0),
  active_bids int not null check (active_bids >= 1),
  popular boolean not null default false,
  sort int not null default 0,
  active boolean not null default true
);
alter table public.deposit_plans enable row level security;
create policy "public read" on public.deposit_plans for select using (active);
create policy "admin write" on public.deposit_plans for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create trigger trg_hist_plans after insert or update or delete on public.deposit_plans
  for each row execute function public.log_tariff_change();

insert into public.deposit_plans (name, deposit_eur, max_bid_usd, active_bids, popular, sort) values
  ('Mini', 500, 5000, 1, false, 1),
  ('Standartas', 1000, 10000, 2, true, 2),
  ('Maxi', 2000, 25000, 3, false, 3);
