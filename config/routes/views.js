// "views" are user-facing views of data. 
// e.g., lists of records, views of single records (both read- and edit-mode)
module.exports = [
    {
        method: 'GET', 
        path: '/list/{collection}', 
        handler: function (request, reply) {
            collectionName = encodeURIComponent(request.params.collection);

            reply.file('templates/lists/' + collectionName + '.html');
        }
    }
];