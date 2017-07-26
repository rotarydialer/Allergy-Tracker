const mongodb = require('mongodb');
const dbclient = mongodb.MongoClient;

const connectionstring = 'mongodb://localhost:27017/allergytracker';

module.exports = [
    {
        method: 'GET', 
        path: '/db/{collection}', 
        handler: function (request, reply) {
            collectionName = encodeURIComponent(request.params.collection);
            id = encodeURIComponent(request.params.id);
            console.log('Here comes ' + collectionName);
            var queryId=null;

            console.log('ROUTED request to connect to collection "' + collectionName + '"');

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
        method: 'GET', path: '/sepepepe/{path*}', handler: function (request, reply) {
            pathName = encodeURI(request.params.path);

            var modInclude = './semantic/' + pathName;

            //console.log('Include for semantic node module at "' + modInclude + '".' );

            reply.file(modInclude);
        }
    }
];

// function checkCollections() {

//     // check the db to make sure the expected collections exist
//    var expectedCollections = ['people', 'foods', 'dietchanges', 'reactions', 'events'];

//     console.log('Checking for expected collections: ');

//     var collCheck;

//     // this is probably not necessary, but I ultimately may want to whitelist and allow only certain collections
//     expectedCollections.forEach(function(entry) {

//         dbclient.connect(connectionstring, function connectToDb (err, db) {
//             if (err) {
//                 console.log('ERROR: Cannot connect to database server at ' + connectionstring, err);
//             } else {

//                 var collection = db.collection(entry);

//                 collection.find({}).toArray(function multipleResults (err, result) {
//                     if (err) {
//                         console.log('   └── ' + entry + ': ERROR - ' + err);
//                     } else if (result.length) {
//                         console.log('   └── ' + entry + ': OK - ' + result.length, 'results.');
//                     } else {
//                         console.log('   └── ' + entry + ': EMPTY');
//                     }

//                     db.close();
//                 });
//             }
//         });
//     });

// }