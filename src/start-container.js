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
		exec(fmt('cd %s/repo; git fetch; git co %s', workspacePath, branchName));
		exec(fmt('mkdir -p %s/%s; rsync -rv --exclude .git --exclude ./vendor --exclude node_modules %s/repo/* %s/%s', workspacePath, branchName, workspacePath, workspacePath, branchName));
		exec(fmt('ln -fs /repo/node_modules %s/%s/node_modules', workspacePath, branchName));
		exec(fmt('ln -fs /repo/vendor %s/%s/vendor', workspacePath, branchName));
		exec(fmt('ln -fs /repo/.git %s/%s/.git', workspacePath, branchName));
		exec(fmt('cp %s/repo/.bowerrc %s/%s/', workspacePath, workspacePath, branchName));
	}

	function generateDockerComposeConfig () {
		var nginx = {
			container_name: 'nginx',
			build: './nginx',
			ports: ['80:80'],
			volumes: [fmt('%s/nginx/nginx:/etc/nginx', workspacePath)],
			links: []
		};

		var containers = _.omit(config, ['nginx']);
		containers[branchName] = {
			container_name: branchName,
			build: fmt('./%s', branchName),
			volumes: [
				fmt('%s/%s:/usr/src/app', workspacePath, branchName),
				fmt('%s/repo:/repo', workspacePath),
			]
		};

		_.each(containers, function (container) {
			nginx.links.push(container.container_name);
		});

		containers['nginx'] = nginx;
		fs.writeFileSync(fmt('%s/docker-compose.yml', workspacePath), yaml.stringify(containers, 4));
	}

	function dockerComposeUp () {
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
