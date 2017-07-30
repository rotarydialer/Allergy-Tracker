const hapi = require('hapi');
const path = require('path');
const hbs = require('handlebars');

const server = new hapi.Server();

// as a convention (for now), I'll use const for npm module and var for self-defined files/routes.
var routes = require('./config/routes');

/*
TO DO:

✓ Check collections on startup
    If not present, create empty ones
Handle empty collections better (at all!)
✓ List views for each collection (DataTables)
    ✓ Diet changes
    ✓ Reactions
    ✓ Events
    ✓ People
    ✓ Foods
- Further refine collection results by person
✓ Input form for each collection ("edit mode")
✓ Hydrate form fields with data
- Insert/upsert routes
- Implement HTML-friendly error messages with Boom
✓ Implement input validation with Joi
✓ Single-result route
- "Read mode" for a single result
    - Render a link within datatable
- Break all this nonsense out into separate files/modules
    - Lists/views
    - Input/forms
    - Database actions
*/

server.connection({
    port: 9000 // TODO: move this to a config file
});

// inert is used to serve static content, basically (files)
server.register(require('inert'), function (err) {
    if (err) {
        throw err;
    }

    server.route(routes);
    
    // routes for lists/"views" of data
    server.route({
        path: "/list/{collection}",
        method: "GET",
        handler: function (request, reply) {
            collectionName = encodeURIComponent(request.params.collection);

            reply.file('templates/lists/' + collectionName + '.html');
        }
    });

});

// vision is used to serve "views"
server.register([require('vision'), require('inert')], function (err) {
    if (err) {
        throw err;
    }

    // a simple reply with parameter
    server.route({
        method: 'GET',
        path: '/',
        handler: function (request, reply) {
            reply.view('index', { appname: 'Allergy Tracker' });
        }
    });

    // an input form - generic
    // the form must exist in ./templates/forms/
    server.route({
        method: 'GET',
        path: '/input/{formname}',
        handler: function (request, reply) {
            form = encodeURIComponent(request.params.formname);

            reply.view('forms/' + form);
        }
    });

    server.views({
        engines: {
            html: require('handlebars')
        },
        relativeTo: __dirname,
        path: 'templates'
    });

});

server.start(function () {
    console.log('Hapi server running at ' + server.info.uri);
});