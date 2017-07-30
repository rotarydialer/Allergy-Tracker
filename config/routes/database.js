const mongodb = require('mongodb');
const dbclient = mongodb.MongoClient;
const joi = require('joi');
const uuid = require('node-uuid');
const monk = require('monk');

const connectionstring = 'mongodb://localhost:27017/allergytracker';
const db = monk(connectionstring);

db.then(() => {
  console.log('Monk: connected correctly to server...');

  checkCollections();

})

module.exports = [
    {
        method: 'GET', 
        path: '/db/{collection}', 
        handler: function (request, reply) {
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
    },
    {
        method: 'GET', 
        path: '/db/{collection}/{id}', 
        handler: function getDbResultById (request, reply) {
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
    },
    {
        method: 'POST', 
        path: '/db/save/{collection}', 
        handler: function getDbResultById (request, reply) {

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
    },
    {
        // using monk for simple db interactions
        method: 'GET', 
        path: '/monk/foods', 
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
    },
    {
        // using monk for simple db interactions:
        // db data to populate drop-down fields in entry forms
        // hardcode these few; figure out passing in params to monk later
        method: 'GET', 
        path: '/monk/people/names', 
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
                reply(results);
            });
        }
    }
];

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