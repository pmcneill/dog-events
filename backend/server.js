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
  // ctx.params.start_zip and ctx.params.range to work with.  Pass
  // those to a database query, then return the result.
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
  `, [ctx.params.start_zip, ctx.params.range]);

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
