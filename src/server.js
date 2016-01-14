var githubEvents = require('github-events');
var startContainer = require('./start-container');
var updateContainer = require('./update-container');
var path = require('path');

var events = githubEvents({ port: 3333 });
var workspacePath = path.resolve(__dirname + '/../workspace');

events.on('branch created', (branchName, params) => {
	console.log('new branch created: %s', branchName);
	startContainer(workspacePath, branchName);
});

events.on('commits pushed', (branchName, params) => {
	console.log('update container: %s', branchName);
	updateContainer(workspacePath, branchName);
});

events.on('branch deleted', (branchName, params) => {
	console.log('update container: %s', branchName);
	updateContainer(workspacePath, branchName);
});
