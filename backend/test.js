let lc_asfa = require('./sources/lc_asfa'),
    geo = require('./geo'),
    geolib = require('geolib');

// 1609 meters/mile
let city = process.argv[2],
    state = process.argv[3],
    range = parseInt(process.argv[4], 10) * 1609;

let promises = [
  lc_asfa.fetch_year(2017),
  geo.coords_by_city(city, state)
];

Promise.all(promises).then(
  ([events, here]) => {
    for ( let e of events ) {
      let dist = geolib.getDistance(here, e);

      if ( dist < range ) {
        console.log(`${e.club} on ${e.date} in ${e.city}, ${e.state} is ${Math.ceil(dist / 1609, 1)} miles away`);
      }
    }

    process.exit(0);
  }
);
