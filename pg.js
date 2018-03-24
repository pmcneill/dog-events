const pg = require('pg'),
      cfg = require('./config');

const pool = new pg.Pool({
  database: cfg.db_name
});

module.exports = pool;
