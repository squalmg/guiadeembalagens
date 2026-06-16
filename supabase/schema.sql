-- Guia de Embalagens — Dia 2
-- Estrutura inicial para salvar todos os leads de orçamento no Supabase.
-- Rode este SQL no Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.packaging_leads (
  id uuid primary key default gen_random_uuid(),
  lead_id text unique,
  name text not null,
  whatsapp text not null,
  whatsapp_e164 text,
  city text not null,
  state char(2) not null,
  segment text not null,
  packaging_type text not null,
  estimated_quantity integer not null check (estimated_quantity > 0),
  needs_custom text not null check (needs_custom in ('sim', 'nao', 'talvez')),
  desired_deadline text not null,
  notes text,
  source text default 'home_dia_2',
  page text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  lead_score integer not null default 0,
  lead_temperature text not null check (lead_temperature in ('hot', 'medium', 'weak')),
  lead_label text not null,
  routing_recommendation text not null,
  assigned_to text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'quoted', 'won', 'lost', 'nurturing')),
  raw_payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.packaging_lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.packaging_leads(id) on delete cascade,
  event_type text not null,
  description text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_packaging_leads_temperature on public.packaging_leads (lead_temperature);
create index if not exists idx_packaging_leads_status on public.packaging_leads (status);
create index if not exists idx_packaging_leads_city_state on public.packaging_leads (city, state);
create index if not exists idx_packaging_leads_segment on public.packaging_leads (segment);
create index if not exists idx_packaging_leads_created_at on public.packaging_leads (created_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_packaging_leads_updated_at on public.packaging_leads;
create trigger trg_packaging_leads_updated_at
before update on public.packaging_leads
for each row execute function public.set_updated_at();

-- View útil para painel comercial.
create or replace view public.v_packaging_leads_commercial as
select
  id,
  lead_id,
  created_at,
  name,
  whatsapp,
  whatsapp_e164,
  city,
  state,
  segment,
  packaging_type,
  estimated_quantity,
  needs_custom,
  desired_deadline,
  lead_score,
  lead_temperature,
  lead_label,
  routing_recommendation,
  status,
  assigned_to,
  utm_source,
  utm_medium,
  utm_campaign
from public.packaging_leads
order by created_at desc;

-- RLS: para produção, mantenha a escrita pelo backend com SERVICE_ROLE_KEY.
alter table public.packaging_leads enable row level security;
alter table public.packaging_lead_events enable row level security;

-- Não crie policy pública de insert caso use /api/leads.js com service role.
-- Isso evita que qualquer pessoa grave lixo diretamente na tabela.
