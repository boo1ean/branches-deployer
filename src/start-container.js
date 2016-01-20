var Promise = require('bluebird');
var yaml = require('yamljs');
var fs = require('fs');
var exec = require('child_process').execSync;
var fmt = require('util').format;
var _ = require('lodash');
var generatePaths = require('./paths');

var renderVhost = _.template(fs.readFileSync(__dirname + '/vhost').toString());

module.exports = function startContainer (workspacePath, branchName, deployConfig) {
	var paths = generatePaths(workspacePath, branchName, deployConfig);
	var config = yaml.load(paths.dockerComposeConfig);

	Promise.all([
		updateNginxConfig(),
		createBranchCopy()
	])
		.then(generateDockerComposeConfig)
		.then(dockerComposeUp)
		.then(reportSuccess)
		.catch(console.error);

	function updateNginxConfig () {
		console.log('generate nginx vhosts');

		_.each(deployConfig.vhosts, generateVhostConfig);

		function generateVhostConfig (vhost) {
			var vhostParams = {
				upstream: paths.getUpstream(paths.containerName, vhost.port),
				upstreamName: paths.getUpstreamName(deployConfig.domain, branchName, vhost.name),
				domain: paths.getDomain(deployConfig.domain, vhost.name, paths.lowerBranchName)
			};
			var vhostPath = paths.getVhostPath(paths.nginxVhosts, deployConfig.domain, branchName, vhost.name);
			var vhostConfig = renderVhost(vhostParams);

			console.log('vhost path: %s', vhostPath);
			console.log('vhost params:');
			console.log(JSON.stringify(vhostParams, null, 4));

			fs.writeFileSync(vhostPath, vhostConfig);
		}
		console.log('generate nginx vhosts');
	}

	function createBranchCopy () {
		console.log('start files copy');
		exec(fmt('cd %s; git fetch; git checkout %s', paths.repo, branchName));
		exec(fmt('mkdir -p %s; rsync -rv --exclude .git --exclude node_modules %s/* %s', paths.branch, paths.repo, paths.branch));
		exec(fmt('ln -fs /repo/node_modules %s/node_modules', paths.branch));
		exec(fmt('ln -fs /repo/vendor %s/vendor', paths.branch));
		exec(fmt('ln -fs /repo/.git %s/.git', paths.branch));
		exec(fmt('cp %s/.bowerrc %s/', paths.repo, paths.branch));
		console.log('finished files copy');
	}

	function generateDockerComposeConfig () {
		console.log('containers configs generation started');
		var nginx = {
			container_name: 'nginx',
			build: paths.nginxImage,
			ports: ['80:80'],
			volumes: [fmt('%s:/etc/nginx', paths.nginxConfigs)],
			links: []
		};

		var containers = _.omit(config, ['nginx']);
		containers[paths.containerName] = {
			container_name: paths.containerName,
			build: paths.branch,
			volumes: [
				fmt('%s:/usr/src/app', paths.branch),
				fmt('%s:/repo', paths.repo),
			]
		};

		// Reset links
		// It will be populated below with new links
		_.each(containers, (container) => {
			if (container.links) {
				container.links = [];
			}
		});

		if (deployConfig.links) {
			containers[paths.containerName].links = [];
		}

		if (deployConfig.branches[branchName]) {
			containers[paths.containerName] = _.extend(containers[paths.containerName], deployConfig.branches[branchName]);
		}

		_.each(containers, (containerToLink) => {
			// Add links to containers with link flag
			_.each(containers, (container) => {
				if (container.links && container.container_name != containerToLink.container_name) {
					container.links.push(containerToLink.container_name);
				}
			});

			nginx.links.push(containerToLink.container_name);
		});

		containers['nginx'] = nginx;
		fs.writeFileSync(paths.dockerComposeConfig, yaml.stringify(containers, 4));
		console.log('containers configs generation finished: %s', paths.containerName);
	}

	function dockerComposeUp () {
		console.log('start docker-compose up -d');
		exec(fmt('cd %s; docker-compose up -d', workspacePath));
		console.log('finshed docker-compose up -d');
	}

	function reportSuccess () {
		console.log('DONE MATHERFUCKER');
	}
}
