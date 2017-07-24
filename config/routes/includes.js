module.exports = [
    {
        method: 'GET', path: '/assets/{path*}', handler: {
            directory: {
                path: "./assets",
                listing: false,
                index: false
            }
        }
    },
    {
        method: 'GET', path: '/scripts/{path*}', handler: function (request, reply) {
            pathName = encodeURI(request.params.path);

            // e.g., this script include tag:
            //      <script src="/scripts/@fengyuanchen/datepicker/dist/datepicker.min.js"></script>
            // will resolve to this node module:
            //      ./node_modules/@fengyuanchen/datepicker/dist/datepicker.min.js
            var modInclude = './node_modules/' + pathName;

            console.log('Include for node module at "' + modInclude + '".' );

            reply.file(modInclude);
        }
    },
    {
        method: 'GET', path: '/semantic/{path*}', handler: function (request, reply) {
            pathName = encodeURI(request.params.path);

            var modInclude = './semantic/' + pathName;

            console.log('Include for semantic node module at "' + modInclude + '".' );

            reply.file(modInclude);
        }
    }
];