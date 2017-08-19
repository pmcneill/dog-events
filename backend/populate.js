const pg = require('./pg'),
      cfg = require('./config');

async function load_data() {
  for ( let source of cfg.sources ) {
    let events = await require(`./sources/${source}`).fetch_year(2017);

    let { rows } = await pg.query('select id from sources where name = $1', [source]),
        source_id = rows[0].id;

    const pgc = await pg.connect();

    await pgc.query('begin');

    let { rows: existing } = await pgc.query(
      `
        select id, club, zip_id,
               to_char(starts_on, 'YYYY-MM-DD') as starts_on
        from events
        where source_id = \$1
      `,
      [source_id]
    );

    existing = existing || [];

    let existing_ids = [];

    for ( let evt of events ) {
      let exists = existing.find((e) => {
        return e.club.toLowerCase() === evt.club.toLowerCase() &&
               e.zip_id === evt.zip_id &&
               e.starts_on === evt.date;
      });

      if ( exists ) {
        existing_ids.push(exists.id);
        continue;
      }

      console.log("Creating " + evt.club + " on " + evt.date);

      await pgc.query(`
        insert into events (
          source_id, starts_on, city, state, zip_id, club, description, premium_url
        ) values (
          $1, $2, $3, $4, $5, $6, $7, $8
        )
      `, [
        source_id,
        evt.date,
        evt.city,
        evt.state,
        evt.zip_id,
        evt.club,
        evt.type,
        evt.premium || null
      ]);
    }

    existing = existing.filter((e) => existing_ids.indexOf(e.id) === -1);

    for ( let evt of existing ) {
      console.log("Deleting existing " + evt.id);
      await pgc.query('delete from events where id = $1', [evt.id]);
    }

    await pgc.query('commit');
  }
}

load_data().then(() => {
  console.log("All done");
  process.exit(0);
}, (err) => {
  console.log(err);
});
