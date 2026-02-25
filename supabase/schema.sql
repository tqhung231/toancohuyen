create extension if not exists pgcrypto;

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  number int not null,
  name text not null,
  bonus int not null default 0,
  minus int not null default 0,
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table students
  add column if not exists note text not null default '';

alter table classes enable row level security;
alter table students enable row level security;

drop policy if exists "open classes" on classes;
create policy "open classes"
on classes
for all
using (true)
with check (true);

drop policy if exists "open students" on students;
create policy "open students"
on students
for all
using (true)
with check (true);
