const hbs = require('handlebars');
const hbsintl = require('handlebars-intl');

hbsintl.registerWith(hbs);

// "views" are user-facing views of data. 
// e.g., lists of records, views of single records (both read- and edit-mode)
module.exports = [
    {
        method: 'GET', 
        path: '/', 
        handler: function (request, reply) {
            reply.view('index', { appname: 'Allergy Tracker' });
        }
    },
    {
        method: 'GET', 
        path: '/list/{collection}', 
        handler: function (request, reply) {
            collectionName = encodeURIComponent(request.params.collection);

            reply.file('templates/lists/' + collectionName + '.html');
        }
    },
    {
        // an input form - generic
        // the form must exist in /templates/forms/
        method: 'GET', 
        path: '/input/{formname}', 
        handler: function (request, reply) {
            form = encodeURIComponent(request.params.formname);

            reply.view('forms/' + form);
        }
    },
    {
        // read mode for a given record
        // the form must exist in /templates/forms/
        method: 'GET', 
        path: '/read/{type}/{id}', 
        handler: function (request, reply) {
            type = encodeURIComponent(request.params.type);
            id = encodeURIComponent(request.params.id);

            var request = require("request");
            var data;

            // TODO: remove hardcoded root and effed up type/collection
            var url = "http://clive:9000" + "/db/" + type + "s/" + id;

            request({
                url: url,
                json: true
            }, function (error, response, body) {

                if (!error && response.statusCode === 200) {
                    console.log(" ...returning data for _id: " + id);
                    console.log(body); // Print the json response

                    //TODO: put a check here to make sure the JSON is valid
                    data = body;

                    reply.view('forms/' + type + '-read', data );
                } else {
                    console.log("There was an error accessing " + url);
                    console.log(error);
                }
            });
        }
    }
];