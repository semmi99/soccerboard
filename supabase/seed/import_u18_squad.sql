-- One-time data import (not a schema migration): loads the real Rapid
-- Kapfenberg U18 squad from data/spielakte-backup_2026-07-11.json into the
-- players table, for the org created during initial signup.
--
-- Not idempotent by id (source records don't map to uuids); the team lookup
-- guards against creating a duplicate 'U18' team on re-run, but re-running
-- this script will insert duplicate player rows. Kept here for reference/
-- reproducibility rather than automatic re-execution.

insert into public.teams (org_id, name, age_group, season)
select '20b5a8c4-fb4e-4ca1-92c1-81216aa59028', 'U18', 'U18', null
where not exists (
  select 1 from public.teams where org_id = '20b5a8c4-fb4e-4ca1-92c1-81216aa59028' and name = 'U18'
);

insert into public.players (team_id, first_name, last_name, jersey_number, position, strong_foot)
select t.id, p.first_name, p.last_name, p.jersey_number, p.position, p.strong_foot
from public.teams t,
  (values
    ('Nico', 'Klari', 1, 'Torwart', 'Rechts'),
    ('Lionell', 'Stojcevic', 2, 'Torwart', 'Rechts'),
    ('Lukas', 'Schantl', 3, 'Außenverteidigung', 'Rechts'),
    ('Jakob', 'Londer', 4, 'Außenverteidigung', 'Rechts'),
    ('Lukas', 'Poglics', 5, 'Defensives Mittelfeld', 'Rechts'),
    ('Petar', 'Budimir', 6, 'Defensives Mittelfeld', 'Rechts'),
    ('Fineas', 'Moldovan', 7, 'Flügel', 'Rechts'),
    ('Alexander', 'Traußnig', 8, 'Stürmer', 'Rechts'),
    ('Denis', 'Stan', 9, 'Stürmer', 'Rechts')
  ) as p(first_name, last_name, jersey_number, position, strong_foot)
where t.org_id = '20b5a8c4-fb4e-4ca1-92c1-81216aa59028' and t.name = 'U18';
