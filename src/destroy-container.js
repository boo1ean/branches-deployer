var Promise = require('bluebird');
var yaml = require('yamljs');
var exec = require('child_process').execSync;
var fmt = require('util').format;
var fs = require('fs');
var generatePaths = require('./paths');
var _ = require('lodash');

module.exports = function destroyContainer (workspacePath, branchName, deployConfig) {
	var paths = generatePaths(workspacePath, branchName, deployConfig);
	var config = yaml.load(paths.dockerComposeConfig);

	if (!config[paths.containerName]) {
		console.log('Branch %s does not exist, can not destroy it, sry bro :(', paths.containerName);
		return;
	}

	return Promise
		.resolve(removeBranchDirectory())
		.then(killContainer)
		.then(removeNginxVhost)
		.then(regenerateDockerComposeConfig)
		.then(reportSuccess)
		.catch(console.error);

	function removeBranchDirectory () {
		console.log('start deleting branch directory');
		exec(fmt('rm -rf %s', paths.branch));
		console.log('finished deleting branch directory');
	}

	function killContainer () {
		console.log('start killing container');
		try {
			exec(fmt('docker kill %s', paths.containerName));
		} catch (e) { console.log('container already dead'); }
		console.log('finished killing container');
	}

	function removeNginxVhost () {
		console.log('start removing nginx vhost');
		_.each(deployConfig.vhosts, removeNginxVhost);

		function removeNginxVhost (vhost) {
			var vhostPath = paths.getVhostPath(paths.nginxVhosts, deployConfig.domain, branchName, vhost.name);
			console.log('vhost path: %s', vhostPath);
			console.log('removed: %s',vhostPath);
			exec(fmt('rm %s', vhostPath));
		}

		console.log('finished removing nginx vhosts');
	}

	function regenerateDockerComposeConfig () {
		console.log('start updating docker-compose.yml');
		// Remove destroyed container from links

		_.each(config, (container) => {
			if (container.links) {
				var toRemoveIndex = container.links.indexOf(paths.containerName);
				if (toRemoveIndex != -1) {
					container.links.splice(toRemoveIndex, 1);
				}
			}
		});

		delete config[paths.containerName];
		fs.writeFileSync(paths.dockerComposeConfig, yaml.stringify(config, 4));
		console.log('finished updating docker-compose.yml (removed %s)', paths.containerName);
	}

	function reportSuccess () {
		console.log('DESTROY DONE MATHERFUCKER!!!!');
	}
}
