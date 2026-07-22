-- Contact and support messages submitted through playpointsystems.com.
-- The API also creates this table defensively when the configured database user permits DDL.

create extension if not exists pgcrypto;

create table if not exists pps_contact_submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  name text not null,
  email text not null,
  topic text not null,
  product text not null,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  constraint pps_contact_submissions_kind_check check (kind in ('contact', 'support')),
  constraint pps_contact_submissions_status_check check (status in ('new', 'in_progress', 'resolved', 'spam'))
);

create index if not exists pps_contact_submissions_status_created_idx
  on pps_contact_submissions(status, created_at desc);
