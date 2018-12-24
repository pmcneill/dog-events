create or replace function geodistance(alat double precision, alng double precision, blat double precision, blng double precision)
returns double precision AS
$$
select asin(
  sqrt(
    sin(radians($3-$1)/2)^2 +
    sin(radians($4-$2)/2)^2 *
    cos(radians($1)) *
    cos(radians($3))
  )
) * 7926.3352 AS distance;
$$
language sql immutable cost 100;

create or replace function zip_distance(zip_id_1 integer, zip_id_2 integer) returns double precision as
$$
  select geodistance(z1.latitude, z1.longitude, z2.latitude, z2.longitude)
  from zip_codes z1, zip_codes z2
  where z1.id = zip_id_1
    and z2.id = zip_id_2;
$$
language sql immutable cost 100;
