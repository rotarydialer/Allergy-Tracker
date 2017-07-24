const hapi = require('hapi');
const joi = require('joi');
const path = require('path');
const mongodb = require('mongodb');
const monk = require('monk');
const hbs = require('handlebars');
const uuid = require('node-uuid');

const server = new hapi.Server();

const connectionstring = 'mongodb://localhost:27017/allergytracker';
const db = monk(connectionstring);

const dbclient = mongodb.MongoClient;

// as a convention (for now), I'll use const for npm module and var for self-defined files/routes.
var routes = require('./config/routes');

db.then(() => {
  console.log('Monk: connected correctly to server');

  checkCollections();

})

function checkCollections() {

    // check the db to make sure the expected collections exist
   var expectedCollections = ['people', 'foods', 'dietchanges', 'reactions', 'events'];

    console.log('Checking for expected collections: ');

    var collCheck;

    // this is probably not necessary, but I ultimately may want to whitelist and allow only certain collections
    expectedCollections.forEach(function(entry) {

        dbclient.connect(connectionstring, function connectToDb (err, db) {
            if (err) {
                console.log('ERROR: Cannot connect to database server at ' + connectionstring, err);
            } else {

                var collection = db.collection(entry);

                collection.find({}).toArray(function multipleResults (err, result) {
                    if (err) {
                        console.log('   └── ' + entry + ': ERROR - ' + err);
                    } else if (result.length) {
                        console.log('   └── ' + entry + ': OK - ' + result.length, 'results.');
                    } else {
                        console.log('   └── ' + entry + ': EMPTY');
                    }

                    db.close();
                });
            }
        });
    });

}


/*
TO DO:


Check collections on startup
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

var io = require('socket.io')(server.listener);

var count = 0;

io.on('connection', function (socket) {
    socket.emit('count', { count: count });
    socket.on('increment', function () {
        count++;
        console.log('Counter incremented to ' + count);
        io.sockets.emit('count', { count: count });
    });
});

// inert is used to serve static content, basically (files)
server.register(require('inert'), function (err) {
    if (err) {
        throw err;
    }

    server.route(routes);

    // ------------------------------------------------------------------------------------------------ //
    // hit the database
    server.route({
        method: 'GET',
        path: '/db/{collection}',
        handler: getDbCollection
    });

    function getDbCollection (request, reply) {
        collectionName = encodeURIComponent(request.params.collection);
        id = encodeURIComponent(request.params.id);
        var queryId=null;

        console.log('Request to connect to collection "' + collectionName + '"');

        dbclient.connect(connectionstring, function connectToDb (err, db) {
            if (err) {
                console.log('Cannot connect to database server at ' + connectionstring, err);
            } else {
                console.log('Connected to database', connectionstring);

                var collection = db.collection(collectionName);

                // ugh, put a check here for id I guess.

                collection.find({}).toArray(function multipleResults (err, result) {
                    if (err) {
                        console.log('Collection "' + collectionName + '" not found.')
                        reply(err);
                    } else if (result.length) {
                        console.log('>', result.length, 'results in collection "' + collectionName + '".');

                        var data = {};
                        data['data'] = result;

                        reply(data);
                    } else {
                        reply('Nothing found in "' + collectionName + '".')
                    }

                    db.close();
                });
            }

        });
    }

    server.route({
        method: 'GET',
        path: '/db/{collection}/{id}',
        handler: getDbResultById
    });

    function getDbResultById (request, reply) {
        collectionName = encodeURIComponent(request.params.collection);
        id = encodeURIComponent(request.params.id);
        var queryId=null;

        console.log('Request "' + collectionName + '", _id:', id);

        dbclient.connect(connectionstring, function connectToDb (err, db) {
            if (err) {
                console.log('Cannot connect to database server at ' + connectionstring, err);
            } else {
                var collection = db.collection(collectionName);

                collection.findOne({ _id: id }, function singleResult (err, result) {
                    if (err) {
                        console.log('Collection "' + collectionName + '" not found.')
                        reply(err);
                    } else if (!result) {
                        console.log('ERROR: _id "' + id + '" not found in "' + collectionName + '".');
                        reply('id "' + id + '" not found in "' + collectionName + '".');
                    } else {
                        reply(result);
                    }

                    db.close();
                });
            }

        });
    }
    
    // save to the database
    server.route({
        method: 'POST',
        path: '/db/save/{collection}',
        handler: function (request, reply) {
            var dbclient = mongodb.MongoClient;

            collectionName = encodeURIComponent(request.params.collection);

            console.log('Request to connect to collection "' + collectionName + '"');

            dbclient.connect(connectionstring, function (err, db) {
                if (err) {
                    console.log('Cannot connect to database server at ' + connectionstring, err);
                } else {
                    var collection = db.collection(collectionName);

                    const record = request.payload;

                    //Create an id
                    record._id = uuid.v1();

                    console.log('Saving to database/collection', connectionstring, collectionName);
                    console.log(record);

                    collection.save(record, function (err, result) {

                        if (err) {
                            reply(err);
                        }

                        reply.file('templates/lists/' + collectionName + '.html');
                        
                        db.close();

                    });

                }

            });
        },
        config: {
            validate: {
                payload: {
                    person: joi.string().required(),
                    description: joi.string(),
                    date: joi.date().required(),
                    foodsremoved: joi.array().items(joi.string().allow('')).single(),
                    foodsadded: joi.array().items(joi.string().allow('')).single(),
                    suspectedfoods: joi.array().items(joi.string().allow('')).single(),
                    severity: joi.number().integer().allow(''),
                    comments: joi.string().allow(''),
                    details: joi.string().allow('')
                }
            }
        }
    });

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

    // monk - db data to populate drop-down fields in entry forms
    // hardcode these few; figure out passing in params to monk later
    server.route({
        path: "/monk/people/names",
        method: "GET",
        handler: function (request, reply) {
            var people = db.get('people');

            people.find({}, {
                fields: {
                    gender: 0,
                    _id: 0
                },
                sort: {
                    name: 1
                }
            }, function(err, results) {
                var obj = {
                    fromDB: results
                }
                //reply(obj);
                reply(results);
            });
        }
    });

    server.route({
        path: "/monk/foods",
        method: "GET",
        handler: function (request, reply) {
            var foods = db.get('foods');

            var data = {};
            data = foods.find({}, {
                fields: {
                    foodname: 1,
                    _id: 0
                },
                sort: {
                    foodname: 1
                }
            });

            reply(data);
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