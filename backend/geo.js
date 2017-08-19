const pg = require('pg');

const pool = new pg.Pool({
  database: 'events'
});

module.exports = {
  zip_by_city: async function(city, state) {
    let { rows } = await pool.query(`
      select id
      from zip_codes
      where lower(city) = lower($1)
        and lower(state) = lower($2)
      limit 1
    `, [ city, state ]);

    if ( rows.length ) {
      return rows[0].id;
    }
  },

  coords_by_city: async function(city, state) {
    let { rows } = await pool.query(`
      select latitude, longitude
      from zip_codes
      where lower(city) = lower($1)
        and lower(state) = lower($2)
      limit 1
    `, [ city, state ]);

    if ( rows.length ) {
      return {
        latitude: rows[0].latitude,
        longitude: rows[0].longitude
      };
    }

    return { latitude: 0, longitude: 0 };
  }
};
