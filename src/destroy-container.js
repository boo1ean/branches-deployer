var Promise = require('bluebird');
var yaml = require('yamljs');
var exec = require('child_process').execSync;
var fmt = require('util').format;
var generatePaths = require('./paths');

module.exports = function destroyContainer (workspacePath, branchName) {
	var paths = generatePaths(workspacePath, branchName);
	var config = yaml.load(paths.dockerComposeConfig);

	if (!config[paths.lowerBranchName]) {
		console.log('Branch %s does not exist, can not destroy it, sry bro :(', branchName);
		return;
	}

	return Promise
		.resolve(removeBranchDirectory())
		.then(killContainer)
		.then(reportSuccess)
		.then(removeNginxVhost)
		.then(regenerateDockerComposeConfig)
		.catch(console.error);

	function removeBranchDirectory () {
		console.log('start deleting branch directory');
		exec(fmt('rm -rf %s', paths.branch));
		console.log('finished deleting branch directory');
	}

	function killContainer () {
		console.log('start killing container');
		exec(fmt('docker kill %s', paths.lowerBranchName));
		console.log('finished killing container');
	}

	function removeNginxVhost () {
		console.log('start removing nginx vhost');
		exec(fmt('rm %s', paths.nginxVhost));
		console.log('finished removing nginx vhost');
	}

	function regenerateDockerComposeConfig () {
		console.log('start updating docker-compose.yml');
		var toRemoveIndex = config.nginx.links.indexOf(paths.lowerBranchName);
		config.nginx.links.splice(toRemoveIndex, 1);
		delete config[paths.lowerBranchName];
		console.log('finished updating docker-compose.yml');
	}

	function reportSuccess () {
		console.log('UPDATE DONE MATHERFUCKER!!!!');
	}
}
