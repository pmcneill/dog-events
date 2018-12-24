const // A module to talk to my postgresql database
      pg = require('../pg'),
      // The web server framework
      Koa = require('koa'),
      // Koa module for "routing" requests to the right place
      Router = require('koa-router'),
      // Module to simplify the creation of server responses
      respond = require('koa-respond'),
      // Koa module to allow for "cross origin resource sharing".
      // Using this makes it possible to run everything locally, without
      // using a server and hostname
      cors = require('koa2-cors');

// First, create the server.  Koa wraps all of the web server logic for us,
// so we only have to create handlers for certain URLs.  Every request that
// arrives sets off a series of events, which are set up with "app.use".
const app = new Koa(),
      router = new Router();

// First thing, make sure we allow requests from everywhere
app.use(cors({ origin: '*' }));
// Tell it we'll use the "respond" module to make it easier to send data back
app.use(respond({ autoMessage: false }));

// Here's the meat.  We're using the router to say we want to listen for
// requests like /events/search/23111/100.  The ":" in front of start_zip
// and range in the URL string below signal that they're parameters, so the
// values in those places in the URL will be saved out as variables.  The
// "events" and "search" words are part of the pattern, so they must match
// in the URL for this handler to be used.
router.get('search', '/events/search/:start_zip/:range', async (ctx) => {
  // In the function, we've matched a URL pattern so we have
  // ctx.params.start_zip and ctx.params.range to work with. 

  // First, look up the ZIP code they passed in, so we'll have the ID
  // handy for the next query.
  let query_result = await pg.query(`
    select id
    from zip_codes
    where zip = $1
    limit 1
  `, [ ctx.params.start_zip ]);

  // pg.query gives us back a bunch of data.  We only need the "rows"
  // attribute, which has the actual data, and the "id" attribute of that.
  let zip_id = query_result.rows[0].id;
  console.log(`Zip ${ctx.params.start_zip} ID is ${zip_id}`);

  // Now, a query to find the events within range.  We're using a custom
  // "zip_distance" function that returns the distance between two zip
  // code IDs.  One of the IDs comes from the query above, the other is a
  // part of the events table.
  query_result = await pg.query(`
    select e.id,
           zip_distance($1, e.zip_id) as distance,
           e.club, e.city, e.state, e.premium_url,
           to_char(e.starts_on, 'YYYY-MM-DD') as starts_on
    from events e
    where zip_distance($1, e.zip_id) < $2
      and e.starts_on > now()
    order by starts_on, distance
  `, [ zip_id, ctx.params.range ]);

  let events = query_result.rows;

  console.log("Searching for events within " + ctx.params.range + " of " + ctx.params.start_zip + ", found " + events.length);

  // This .ok method is one that koa-respond provides us, to return a "good" result.
  // There are also ".badRequest(error_message)" and ".notFound()" methods that might
  // be useful.
  ctx.ok(events);
});

// Add the router to our server
app.use(router.routes());
app.use(router.allowedMethods());

// And, finally, tell the server to begin listening for connections.  4001
// is the TCP/IP port number, which is how computers distinguish types of
// connections.  Web traffic typically runs on ports 80 (unencrypted) and
// 443 (HTTPS), for instance.  Ports higher than 1024 are typically unreserved
// and safe to use, but if you get a message that your program can't "bind",
// try a different port number.
app.listen(4001, () => console.log("Ready!"));
