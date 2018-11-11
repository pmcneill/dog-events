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
  url             varchar(500),
  in_service      timestamptz default now(),
  out_of_service  timestamptz,
  next_update_at  timestamptz default now()
);

comment on column sources.name is 'Name of the JS class that reads this source';

insert into sources (
  name, title, url
) values (
  'lc_asfa', 'ASFA', 'http://asfa.org'
);

create table events (
  id            serial primary key,
  source_id     integer references sources(id),
  type_id       integer references types(id),
  starts_on     date,
  city          varchar(200),
  state         varchar(2),
  zip_id        integer references zip_codes(id),
  club          varchar(200),
  description   text,
  judge_1       varchar(500),
  judge_2       varchar(500),
  premium_url   varchar(500),
  address       varchar(200)
);
