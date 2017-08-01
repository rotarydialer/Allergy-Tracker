var includes = require('./includes');
var database = require('./database');
var views = require('./views');

module.exports = [].concat(includes,database,views);