const pg = require('../pg'),
      cors = require('koa2-cors'),
      koa = require('koa');

const app = new koa();

app.use(cors({ origin: '*' }));

app.use(async (ctx) => {
  let [url] = ctx.request.url.split('?'),
      [start_zip, range] = url.substr(1).split('/').slice(-2);

  let { rows: events } = await pg.query(`
    with events_with_range as (
      select e.*, geodistance(z1.latitude, z1.longitude, z2.latitude, z2.longitude) as distance
      from events e join zip_codes z1 on (z1.id = e.zip_id),
           zip_codes z2
      where z2.id = (select id from zip_codes where zip = $1 limit 1)
        and e.starts_on > now()
    )
    select r.id, r.distance, r.club, r.city, r.state, r.premium_url,
           to_char(r.starts_on, 'YYYY-MM-DD') as starts_on
    from events_with_range r
    where r.distance < $2
    order by r.starts_on, r.distance
  `, [start_zip, range]);

  console.log("Searching for events within " + range + " of " + start_zip + ", found " + events.length);

  ctx.body = events;
});

app.listen(4001);
