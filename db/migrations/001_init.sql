-- canonical day row
create table if not exists days (
  date date primary key,
  sleep_score integer check (sleep_score between 0 and 100),
  focus_minutes integer default 0 check (focus_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_days_updated
before update on days
for each row execute function set_timestamp();

-- rituals per day (extend with extras JSONB)
create table if not exists rituals (
  date date primary key references days(date) on delete cascade,
  reading_minutes integer default 0 check (reading_minutes >= 0),
  outdoor_minutes integer default 0 check (outdoor_minutes >= 0),
  writing_minutes integer default 0 check (writing_minutes >= 0),
  extras jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_rituals_updated
before update on rituals
for each row execute function set_timestamp();

-- coffee events
create type coffee_type as enum ('espresso', 'v60', 'chemex', 'moka', 'aero', 'cold_brew', 'other');

create table if not exists coffee_log (
  id bigserial primary key,
  date date not null,
  time timestamptz not null default now(),
  type coffee_type not null,
  amount_ml integer check (amount_ml >= 0) default 0,
  caffeine_mg integer check (caffeine_mg >= 0) default 0,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_coffee_by_date on coffee_log(date);

-- runs as events
create table if not exists runs (
  id bigserial primary key,
  date date not null,
  distance_km numeric(6,2) not null check (distance_km >= 0) default 0,
  duration_min numeric(6,2) not null check (duration_min >= 0) default 0,
  avg_pace_sec_per_km integer check (avg_pace_sec_per_km >= 0) default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_runs_by_date on runs(date);

-- goal table (e.g. monthly running distance)
create type goal_kind as enum ('running_distance_km');

create table if not exists monthly_goals (
  id bigserial primary key,
  month date not null, -- first day of month
  kind goal_kind not null,
  target numeric(8,2) not null check (target >= 0),
  unique (month, kind)
);
