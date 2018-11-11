## Overview

My wife Erin and I do a number of different sports with our dogs -- lure coursing, straight racing, obedience, rally, barn hunt, conformation, and probably some that I'm forgetting.  Keeping the calendar together has been a big manual effort, so having some time free, I decided to put together some simple programs to help with the planning.  They're not complicated, but are meaty enough that I think they might be an interesting example.  As we get into the final projects, this would be the sort of thing you might attempt as a "reach".  Yours doesn't need to be this involved, but it certainly shouldn't be more complicated.  Look at the different pieces of this project, and how it's laid out, as a template for what your project might use and look like.  This project is broken up into a few parts, but I keep all of the source code in this single repository, ensuring that my SQL file versions always line up with the right code version.

The first thing I did was decide how I'd structure my application.  One option is to make everything run on the server side.  You go to a URL in the browser and the server builds a page.  When you search for an event, that goes to the server and it generates a new HTML page of results.  This is exactly how the web worked for a long time, and still does in many cases.  Javascript and Node, though, are great for "single page applications", or SPAs.  There's a single page for the browser, using client-side Javascript to render the HTML and handle user input.  The server, or back-end, in this case becomes a data source.  It simply exposes an API that the front end uses however it needs.  Javascript's event-driven nature is a perfect fit for this.  Conceptually, there's no difference between handling an event for "user clicks a button" and "front end requests a piece of data".  Both are events that your code handles asynchronously. 

## Running This Application

1. Create the database, with `createdb events` and load the database files.  If you're in the "dog-events" directory, `psql -d events -f sql/create.sql` should work.
2. Install the Node.js dependencies by running `npm install`.
3. Configure your local settings.  If you used a different database name, change it in config.js.
4. Populate the database by changing to the populate directory and running `node populate.js`.
5. Start a server with `node backend/server.js`
6. Open frontend/events-local.html in your browser

## SQL

The first piece to look at is in the "sql" directory.  That's where I'm setting up my data model, loading zip code data, and creating a latitude + longitude distance function.  The event data is split up over three tables to make it easier to manage.  There's a "sources" table that flags where the data came from, a "types" table for the different types of events, and finally the "events" table with the bulk of the data.  I could also have created a "clubs" table, since the same clubs will be hosting any number of events.  I don't think I'll be accessing the data along that axis -- that is, I'm not expecting to ask, "what events are club X hosting?", so I didn't feel a need to split it off.  It's expensive to ask a database to find all the unique values in a large table, so if you have a particular starting search in mind, it's often a good idea to make sure that there's a table specifically for that type of data.  Here, I'd create a "clubs" table if I needed to show my users a list of all the clubs.  Since I'm only ever reporting the club name in the context of an event, though, I didn't feel like it was necessary to break out.

## Dependencies

I have three different programs that will all use Node.js modules and talk to the database, so I've set up a package.json file in the repository root directory.  I've also added a `pg.js` file to make the Postgres module a little easier to use and a `config.js` to contain any global configuration settings (ie, the database name).  Within each project, I'll include those files as needed with `require('../pg')`, with the `../` telling Node to look one folder up in the tree (`./` is for the current folder).  Any require paths that starts with a . or .. will make Node look for a file you've created, rather than an installed module.

## The Frontend

The next piece of the puzzle is how the user interacts with the app, what I call the frontend.  In my case, it's a single HTML page, a very simple SPA.  It has some input fields for where and when, a button to request the results, and some logic to display them.  Much like the API examples you've seen (or will see) in week 9, this is a very simple page.  When I get the click event, I create a URL to search for the events and send a request to the server with jQuery's `$.get`.  When the data comes back, I format it into HTML and display it.  Everything for my app is directly in index.html, but if your frontend (if you have one) is more complicated, you can certainly move Javascript and CSS into their own files.  The `events-local.html` file is a copy, but it's set up to run everything on a single local computer.

## The Backend

### Populate

The backend is where the meat of my application lives.  The first piece is in the `populate` directory, used to load events from various sources into my database.  In my case, I'm pulling my data from, effectively, an external API.  Every time I run the populate script, it updates, inserts, or deletes data from my database.  If you don't need an API, or the API is used on demand, you may not need a populate script like this.

The populate script knows how to take events gathered from around the web and insert them into my database, trying to avoid duplicates.  I want to pull events from a variety of sources, so populate.js doesn't actually handle fetching the data.  Instead, it delegates out to scripts in the sources directory, each of which return an array of events.  The calendar I'm looking at here doesn't have a nice API, so I'm left to parse data out of the HTML.  I'm using a module called "jsdom" to give me the same sort of DOM manipulation functions I'd have in a web browser, making it relatively easy to parse out the data.  It's just a matter of finding the right tables, then going through them row by row.  That file returns an array of event data, an important step because now none of my other code needs to worry about how ASFA formats its data.  When I add other data sources in the future, as long as I return the data in a similar format, none of my other code should need to change either.  Basically, each module in the "sources" directory converts some external data into my internal representation.  The "sources" part of the code is where it's more complicated than you need for a final project.  If a student were writing this application, I'd be happy enough to see a populate script that only understand a single data source, or maybe even a hard-coded list of events in the database to start. 

All that said, for the sake of simplicity, the database scripts automatically create a set of test data.  It's not necessary to run the populate scripts yourselves, but I've left them in in case you have a similar need.

### Koa Server

The `backend` directory has a `server.js` script that runs with Node.js.  The Koa module makes it a web server, which I'm using to serve up a event search API.  When I load up http://127.0.0.1:4001/events/search/23111/100 in a browser, the Koa framework invokes the handler function I've defined in server.js.  The router module recognizes the URL pattern and automatically picks out the ZIP code and range for me.  My function plugs those two values into a database query, then sends the result back to the requester as JSON.  Just like many other APIs we've looked at (or will), you can interact with it directly, without using an application in front.  Testing out your API separately from whatever front end you use is a great way to make the problem smaller and easier to work on.

There are two important things to call out about the server.  First, it runs on "port" 4001.  Network "sockets", used by software to send and receive data over the network, run on pre-chosen port numbers.  HTTP, the protocol for the web, runs on port 80, while HTTPS is port 443.  When you're writing a custom service, you can generally pick any number between 1024 and 65535.  Your server will "listen" for connections on that port.  A URL can be made to connect on a specific port by adding a ":[port]" after the host name or address.

The other important piece is that the server uses a CORS module, koa2-cors in this case.  CORS, or cross-origin request sharing, is how a browser decides what requests are and are not allowed out of the Javascript security sandbox.  Without the koa2-cors module set to an origin of `*`, the wildcard, a local HTML file at a "file://" URL would not be allowed to connect to your server running on localhost.  CORS isn't needed if your frontend and backend are on the same hostname, such as at https://patrickmcneill.com/events.html.

### Writing Data

My application uses the populate scripts, but it's very possible yours will need to load user data to insert or update records.  All the requests in my example application are HTTP "GET" requests, which only send a URL to the server.  When you're writing a non-trivial amount of data, you should instead use a POST request.  In jQuery, that's done with `$.post(url, object_with_data_to_send)`.  On the Express or Koa side, you can use `app.post(...)` to set up a handler.  You'll look up the data that the user passed in in the request object and use that to build up or fill in an insert or update database query.

