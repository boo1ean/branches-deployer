var Promise = require('bluebird');
var yaml = require('yamljs');
var exec = require('child_process').execSync;
var fmt = require('util').format;
var _ = require('lodash');

module.exports = function updateContainer (workspacePath, branchName) {
	var config = yaml.load(fmt('%s/docker-compose.yml', workspacePath));

	if (!config[branchName]) {
		console.log('Branch %s does not exist, can not update, sry bro :(');
		return;
	}

	return Promise.resolve(createBranchCopy())
		.then(function execDeploy () {
			exec(fmt("docker exec %s ad deploy local", branchName));
		});

	function createBranchCopy () {
		exec(fmt('cd %s/repo; git fetch; git co %s', workspacePath, branchName));
		exec(fmt('mkdir -p %s/%s; rsync -rv --exclude .git --exclude ./vendor --exclude node_modules %s/repo/* %s/%s', workspacePath, branchName, workspacePath, workspacePath, branchName));
		exec(fmt('ln -fs /repo/node_modules %s/%s/node_modules', workspacePath, branchName));
		exec(fmt('ln -fs /repo/vendor %s/%s/vendor', workspacePath, branchName));
		exec(fmt('cp %s/repo/.bowerrc %s/%s/', workspacePath, workspacePath, branchName));
	}
};

