var path = require('path');
var fs = require('fs');
var githubEvents = require('github-events');
var startContainer = require('./start-container');
var updateContainer = require('./update-container');
var destroyContainer = require('./destroy-container');

var events = githubEvents({ port: 3333 });
var workspacePath = path.resolve(__dirname + '/../workspace');
var config = JSON.parse(fs.readFileSync(__dirname + '/../config.json').toString());

console.log('started with config:');
console.log(JSON.stringify(config, null, 4));

events.on('branch created', (branchName, params) => {
	var repo = params.repository.full_name;
	var deployConfig = config.repos[repo];
	if (!deployConfig) {
		return console.error('repo config not found');
	}

	console.log('new branch created for %s %s', repo, branchName);
	startContainer(workspacePath, branchName, deployConfig);
});

events.on('commits pushed', (branchName, params) => {
	var repo = params.repository.full_name;
	var deployConfig = config.repos[repo];
	if (!deployConfig) {
		return console.error('repo config not found');
	}

	console.log('update container for %s %s', repo, branchName);
	updateContainer(workspacePath, branchName, deployConfig);
});

events.on('branch deleted', (branchName, params) => {
	var repo = params.repository.full_name;
	var deployConfig = config.repos[repo];
	if (!deployConfig) {
		return console.error('repo config not found');
	}

	console.log('destroy container for %s %s', repo, branchName);
	destroyContainer(workspacePath, branchName, deployConfig);
});
