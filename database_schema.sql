-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Mobile Users (App Police Officers)
create table if not exists mobile_users (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  dni text unique not null,
  email text unique not null,
  password text not null, -- In production, hash this!
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. PC Stations (Comisarías)
create table if not exists stations (
  id uuid default uuid_generate_v4() primary key,
  station_id text unique not null, -- e.g., CMS-001
  name text not null, -- e.g., Comisaría Central
  password text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Evaluations (Uploaded from Mobile)
create table if not exists evaluations (
  id uuid default uuid_generate_v4() primary key,
  plate text not null,
  model text,
  location text,
  owner text,
  status text default 'pending', -- pending, processed, discarded
  sender text, -- Name of the mobile user
  dni text, -- DNI of the mobile user
  summary text,
  img_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Reports (Processed/Manual in PC)
create table if not exists reports (
  id uuid default uuid_generate_v4() primary key,
  plate text not null,
  model text,
  location text,
  owner text,
  status text default 'Sospechoso', -- Limpio, Sospechoso, Robado
  time text, -- Stored as string for display simplicity or use timestamp
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
