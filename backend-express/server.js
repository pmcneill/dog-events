const express = require('express');
const cors = require('cors');
const app = express();
const pg = require('../pg');

app.use(cors());

app.get('/', (req, res) => res.send('Hello World!'))

app.get('/events/search/:zip_code/:range', async (req, res) => {
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
  `, [req.params.zip_code, req.params.range]);

  console.log("Searching for events within " + req.params.range + " of " + req.params.zip_code+ ", found " + events.length);

  res.send(events);
});

app.listen(4001, () => console.log('Listening on port 4001!'))
