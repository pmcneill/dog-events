create table types (
  id              serial primary key,
  name            varchar(100)
);

insert into types (name) values
  ('Lure Coursing'),
  ('Conformation'),
  ('Rally'),
  ('Agility'),
  ('Obedience'),
  ('Barn Hunt'),
  ('Straight Racing'),
  ('Oval Racing')
;

create table sources (
  id              serial primary key,
  name            varchar(100),
  title           varchar(100),
  type_id         integer references types(id),
  url             varchar(500),
  in_service      timestamptz default now(),
  out_of_service  timestamptz
);

comment on column sources.name is 'Name of the JS class that reads this source';

insert into sources (
  name, title, type_id, url
)
select 'lc_asfa', 'ASFA', t.id, 'http://asfa.org'
from types t
where t.name = 'Lure Coursing';

create table events (
  id            serial primary key,
  source_id     integer references sources(id),
  starts_on     date,
  city          varchar(200),
  state         varchar(2),
  zip_id        integer references zip_codes(id),
  club          varchar(200),
  description   text,
  judge_1       varchar(500),
  judge_2       varchar(500),
  premium_url   varchar(500)
);
