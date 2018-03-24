const pg = require('../pg'),
      cfg = require('../config');

async function load_data() {
  let { rows: sources } = await pg.query(`
    select id, name
    from sources
    where out_of_service is null
      and in_service < now()
      and next_update_at < now()
    order by next_update_at
  `);

  for ( let source of sources ) {
    console.log(`Loading ${source.name}...`);

    let events = await require(`./sources/${source.name}`)();

    const pgc = await pg.connect();

    await pgc.query('begin');

    let { rows: existing } = await pgc.query(
      `
        select id, club, zip_id,
               to_char(starts_on, 'YYYY-MM-DD') as starts_on
        from events
        where source_id = \$1
      `,
      [source.id]
    );

    existing = existing || [];

    let existing_ids = [];

    for ( let evt of events ) {
      let exists = existing.find((e) => {
        return e.club.toLowerCase() === evt.club.toLowerCase() &&
               // == to allow for nulls and undefineds to mingle
               e.zip_id == evt.zip_id &&
               e.starts_on === evt.date;
      });

      if ( exists ) {
        existing_ids.push(exists.id);
        continue;
      }

      console.log("Creating " + evt.club + " on " + evt.date);

      await pgc.query(`
        insert into events (
          source_id, type_id, starts_on, city, state, zip_id, club, description, premium_url
        ) values (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        )
      `, [
        source.id,
        evt.type_id,
        evt.date,
        evt.city,
        evt.state,
        evt.zip_id,
        evt.club,
        evt.description,
        evt.premium_url || null
      ]);
    }

    existing = existing.filter((e) => existing_ids.indexOf(e.id) === -1);

    for ( let evt of existing ) {
      console.log("Deleting existing " + evt.id);
      await pgc.query('delete from events where id = $1', [evt.id]);
    }

    await pgc.query(
      `
        update sources
           set next_update_at = now() + '1 day'::interval
        where id = $1
      `,
      [ source.id ]
    );

    await pgc.query('commit');
  }
}

load_data().then(() => {
  console.log("All done");
  process.exit(0);
}, (err) => {
  console.log(err);
});
