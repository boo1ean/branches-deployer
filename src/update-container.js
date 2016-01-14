var Promise = require('bluebird');
var yaml = require('yamljs');
var exec = require('child_process').execSync;
var fmt = require('util').format;

module.exports = function updateContainer (workspacePath, branchName) {
	var config = yaml.load(fmt('%s/docker-compose.yml', workspacePath));
	var lowerBranchName = branchName.toLowerCase();

	if (!config[lowerBranchName]) {
		console.log('Branch %s does not exist, can not update, sry bro :(');
		return;
	}

	return Promise
		.resolve(createBranchCopy())
		.then(execContainerUpdate)
		.then(reportSuccess)
		.catch(console.error);

	function createBranchCopy () {
		console.log('copy start');
		exec(fmt('cd %s/repo; git checkout %s; git pull origin %s', workspacePath, branchName, branchName));
		exec(fmt('mkdir -p %s/branches/%s; rsync -rv --exclude .git --exclude node_modules %s/repo/* %s/branches/%s', workspacePath, branchName, workspacePath, workspacePath, branchName));
		exec(fmt('ln -fs /repo/node_modules %s/branches/%s/node_modules', workspacePath, branchName));
		exec(fmt('ln -fs /repo/vendor %s/branches/%s/vendor', workspacePath, branchName));
		exec(fmt('ln -fs /repo/.git %s/branches/%s/.git', workspacePath, branchName));
		exec(fmt('cp %s/repo/.bowerrc %s/branches/%s/', workspacePath, workspacePath, branchName));
		console.log('copy end');
	}

	function execContainerUpdate () {
		console.log('exec container update');
		exec(fmt("docker exec %s ad deploy local", lowerBranchName));
		console.log('exec container update done');
	}

	function reportSuccess () {
		console.log('UPDATE DONE MATHERFUCKER!!!!');
	}
};
