var Promise = require('bluebird');
var yaml = require('yamljs');
var fs = require('fs');
var exec = require('child_process').execSync;
var fmt = require('util').format;
var _ = require('lodash');
var generatePaths = require('./paths');

var renderVhost = _.template(fs.readFileSync(__dirname + '/vhost').toString());

module.exports = function startContainer (workspacePath, branchName) {
	var paths = generatePaths(workspacePath, branchName);
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
		fs.writeFileSync(paths.nginxVhost, renderVhost({
			upstream: getUpstream(branchName),
			domain: getDomain(branchName),
			branchName: branchName
		}));
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
		containers[paths.lowerBranchName] = {
			container_name: paths.lowerBranchName,
			build: paths.branch,
			volumes: [
				fmt('%s:/usr/src/app', paths.branch),
				fmt('%s:/repo', paths.repo),
			]
		};

		_.each(containers, function (container) {
			nginx.links.push(container.container_name);
		});

		containers['nginx'] = nginx;
		fs.writeFileSync(paths.dockerComposeConfig, yaml.stringify(containers, 4));
		console.log('containers configs generation finished');
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

function getUpstream (branchName) {
	return branchName + ':3000';
}

function getDomain (branchName) {
	return branchName + '.beatssound.ru';
}
