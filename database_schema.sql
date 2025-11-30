-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. STATIONS (Comisarías / Usuarios PC)
create table public.stations (
  id uuid default uuid_generate_v4() primary key,
  station_id text unique not null, -- e.g., "CMS-001"
  name text not null,              -- e.g., "Comisaría Central"
  password text not null,          -- In production, store hashed passwords!
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. REPORTS (Placas Confirmadas / Historial)
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  plate text not null,
  model text,
  location text,
  owner text,
  status text not null check (status in ('Limpio', 'Sospechoso', 'Robado')),
  time text, -- Storing formatted time as requested, or use timestamp
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  station_id uuid references public.stations(id) -- Who created this report
);

-- 3. EVALUATIONS (Solicitudes desde Móvil)
create table public.evaluations (
  id uuid default uuid_generate_v4() primary key,
  plate text not null,
  model text,
  location text,
  owner text,
  sender text, -- e.g., "Oficial Ramirez"
  dni text,
  summary text,
  img_url text,
  status text not null default 'pending' check (status in ('pending', 'discarded', 'reviewing', 'processed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) - Optional but recommended
alter table public.stations enable row level security;
alter table public.reports enable row level security;
alter table public.evaluations enable row level security;

-- Policies (Open for now for ease of development, lock down later)
create policy "Enable all access for all users" on public.stations for all using (true);
create policy "Enable all access for all users" on public.reports for all using (true);
create policy "Enable all access for all users" on public.evaluations for all using (true);
