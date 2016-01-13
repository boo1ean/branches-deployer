var Promise = require('bluebird');
var yaml = require('yamljs');
var fs = require('fs');
var exec = require('child_process').execSync;
var fmt = require('util').format;
var _ = require('lodash');

var renderVhost = _.template(fs.readFileSync(__dirname + '/vhost').toString());

module.exports = function startContainer (workspacePath, branchName) {
	var config = yaml.load(fmt('%s/docker-compose.yml', workspacePath));
	Promise.all([
		updateNginxConfig(),
		createBranchCopy()
	])
	.then(generateDockerComposeConfig)
	.then(reportSuccess)
	.catch(console.error);

	function updateNginxConfig () {
		exec(fmt('mkdir -p %s/sites-enabled', workspacePath));
		fs.writeFileSync(fmt('%s/sites-enabled/%s',workspacePath, branchName), renderVhost({
			upstream: getUpstream(branchName),
			domain: getDomain(branchName)
		}));
	}

	function createBranchCopy () {
		exec(fmt('cd %s/repo; git fetch; git co %s', workspacePath, branchName));
		exec(fmt('mkdir -p %s/%s; rsync -rv --exclude=.git %s/repo/* %s', workspacePath, branchName, workspacePath, branchName));
	}

	function generateDockerComposeConfig () {
		var nginx = {
			build: './nginx',
			links: []
		};

		var containers = _.omit(config, ['nginx']);
		containers[branchName] = {
			name: branchName,
			build: './app',
			volumes: [fmt('%s/%s:/usr/src/cpa', workspacePath, branchName)]
		};

		_.each(containers, function (container) {
			nginx.links.push(container.name);
		});

		containers['nginx'] = nginx;
		fs.writeFileSync(fmt('%s/docker-compose.yml', workspacePath), yaml.stringify(containers, 4));
	}

	function reportSuccess () {
		console.log('DONE MATHERFUCKER');
	}
}

function getUpstream (branchName) {
	return branchName + ':3000';
}

function getDomain (branchName) {
	return branchName + 'evstaging.com';
}
