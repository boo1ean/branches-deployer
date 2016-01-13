var startContainer = require('./src/generate-configs');
var path = require('path');

startContainer(path.resolve('workspace'), 'master');
