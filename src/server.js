var githubEvents = require('github-events');
var generateConfigs = require('./start-container');
var path = require('path');

var events = githubEvents();
var workspacePath = path.resolve(__dirname + '/../workspace');

events.on('new branch created', function (params) {
	var branchName = params.ref;
	console.log('new branch created: %s', branchName);
	startContainer(workspacePath, branchName);
});
