var githubEvents = require('github-events');
var startContainer = require('./start-container');
var updateContainer = require('./update-container');
var path = require('path');

var events = githubEvents();
var workspacePath = path.resolve(__dirname + '/../workspace');

events.on('new branch created', function (params) {
	var branchName = params.ref;
	console.log('new branch created: %s', branchName);
	startContainer(workspacePath, branchName);
});

events.on('new commits', function (params) {
	console.log(params);
	var branchName = params.ref;
	console.log('update container: %s', branchName);
	updateContainer(workspacePath, branchName);
});
