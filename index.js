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

    // route for css files and other static assets
    server.route({
        path: "/assets/{path*}",
        method: "GET",
        handler: {
            directory: {
                path: "./assets",
                listing: false,
                index: false
            }
        }
    });

    // route for .js files in node_modules
    server.route({
        path: "/scripts/{path*}",
        method: "GET",
        handler: function (request, reply) {
            pathName = encodeURI(request.params.path);

            // e.g., this script include tag:
            //      <script src="/scripts/@fengyuanchen/datepicker/dist/datepicker.min.js"></script>
            // will resolve to this node module:
            //      ./node_modules/@fengyuanchen/datepicker/dist/datepicker.min.js
            var modInclude = __dirname + '/node_modules/' + pathName;

            //console.log('Include for node module at "' + modInclude + '".' );

            reply.file(modInclude);
        }
    });

    // special route for semantic ui files (https://semantic-ui.com)
    // Superfluous; I want to change this... place these instead in /scripts or /assets above
    // TODO: Rebuild with gulp to desired location? Investigate.
    server.route({
        path: "/semantic/{path*}",
        method: "GET",
        handler: function (request, reply) {
            pathName = encodeURI(request.params.path);

            var modInclude = __dirname + '/semantic/' + pathName;

            reply.file(modInclude);
        }
    });

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
        console.log(' └── id: ' + id);

        dbclient.connect(connectionstring, function connectToDb (err, db) {
            if (err) {
                console.log('Cannot connect to database server at ' + connectionstring, err);
            } else {
                console.log('Connected to database', connectionstring);

                var collection = db.collection(collectionName);

                var ObjectID = require('mongodb').ObjectID;

                collection.findOne({ _id: ObjectID(id) }, function singleResult (err, result) {
                    if (err) {
                        console.log('Collection "' + collectionName + '" not found.')
                        reply(err);
                    } else if (!result) {
                        reply('id "' + id + '" not found in "' + collectionName + '".')
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

                        reply(record);
                        
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

    // monk - db tests
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

    server.route({
        path: "/monk",
        method: "GET",
        handler: function (request, reply) {
            var people = db.get('people');

            people.createIndex('name');

            // field name: 0 excludes from results
            // oddly, excluding all but 1 field fails (500) if you explicitly include that field.
            // however, specifying just one includes _id, so it needs to be explicitly excluded.
            reply(people.find({}, {
                fields: {
                    gender: 0,
                    _id: 0
                },
                sort: {
                    name: 1
                }
            }));

            // sort by gender ascending (1) then by name descending (-1)
            /*reply(people.find({}, {
                fields: {
                    name: 1,
                    gender: 1
                },
                sort: {
                    gender: 1,
                    name: -1
                } 
            }));*/
            //reply(people.find({}, 'name', {sort: {name: 1}})); // without field or sort it just returns _id
            //reply(people.find({name: "Chris"}, {sort: {name: 1}})); // one result example

            //db.close();
        }
    });

    // a fah user page
    server.route({
        method: 'GET',
        path: '/users/{userName}',
        handler: function (request, reply) {
            reply.view('user', { name: encodeURIComponent(request.params.userName) });
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