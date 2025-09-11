alter table rituals add column if not exists steps integer default 0 check (steps >= 0);
alter table rituals add column if not exists journaled boolean default false;
-- Add a tasting descriptor to coffee_log for weekly donut chart
alter table coffee_log add column if not exists tasting varchar(50);
-- Optional: index if you log lots of brews
create index if not exists idx_coffee_tasting on coffee_log (tasting);