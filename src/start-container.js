var Promise = require('bluebird');
var yaml = require('yamljs');
var fs = require('fs');
var exec = require('child_process').execSync;
var fmt = require('util').format;
var _ = require('lodash');

var renderVhost = _.template(fs.readFileSync(__dirname + '/vhost').toString());

module.exports = function startContainer (workspacePath, branchName) {
	var config = yaml.load(fmt('%s/docker-compose.yml', workspacePath));
	var lowerBranchName = branchName.toLowerCase();

	Promise.all([
		updateNginxConfig(),
		createBranchCopy()
	])
	.then(generateDockerComposeConfig)
	.then(dockerComposeUp)
	.then(reportSuccess)
	.catch(console.error);

	function updateNginxConfig () {
		fs.writeFileSync(fmt('%s/nginx/nginx/sites-enabled/%s',workspacePath, branchName), renderVhost({
			upstream: getUpstream(branchName),
			domain: getDomain(branchName),
			branchName: branchName
		}));
	}

	function createBranchCopy () {
		console.log('start files copy');
		exec(fmt('cd %s/repo; git fetch; git checkout %s', workspacePath, branchName));
		exec(fmt('mkdir -p %s/branches/%s; rsync -rv --exclude .git --exclude node_modules %s/repo/* %s/branches/%s', workspacePath, branchName, workspacePath, workspacePath, branchName));
		exec(fmt('ln -fs /repo/node_modules %s/branches/%s/node_modules', workspacePath, branchName));
		exec(fmt('ln -fs /repo/vendor %s/branches/%s/vendor', workspacePath, branchName));
		exec(fmt('ln -fs /repo/.git %s/branches/%s/.git', workspacePath, branchName));
		exec(fmt('cp %s/repo/.bowerrc %s/branches/%s/', workspacePath, workspacePath, branchName));
		console.log('finished files copy');
	}

	function generateDockerComposeConfig () {
		console.log('containers configs generation started');
		var nginx = {
			container_name: 'nginx',
			build: './nginx',
			ports: ['80:80'],
			volumes: [fmt('%s/nginx/nginx:/etc/nginx', workspacePath)],
			links: []
		};

		var containers = _.omit(config, ['nginx']);
		containers[lowerBranchName] = {
			container_name: lowerBranchName,
			build: fmt('./branches/%s', branchName),
			volumes: [
				fmt('%s/branches/%s:/usr/src/app', workspacePath, branchName),
				fmt('%s/repo:/repo', workspacePath),
			]
		};

		_.each(containers, function (container) {
			nginx.links.push(container.container_name);
		});

		containers['nginx'] = nginx;
		fs.writeFileSync(fmt('%s/docker-compose.yml', workspacePath), yaml.stringify(containers, 4));
		console.log('containers configs generation finished');
	}

	function dockerComposeUp () {
		console.log('run docker-compose up -d');
		exec(fmt('cd %s; docker-compose up -d', workspacePath));
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
