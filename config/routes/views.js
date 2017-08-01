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
        path: '/{type}/{id}/read', 
        handler: function (request, reply) {
            type = encodeURIComponent(request.params.type);
            id = encodeURIComponent(request.params.id);

            reply.view('forms/' + type + '-read');
        }
    }
];