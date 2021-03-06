var Promise = require('bluebird');
var yaml = require('yamljs');
var exec = require('child_process').execSync;
var fmt = require('util').format;
var generatePaths = require('./paths');

module.exports = function updateContainer (workspacePath, branchName, deployConfig) {
	var paths = generatePaths(workspacePath, branchName, deployConfig);
	var config = yaml.load(paths.dockerComposeConfig);

	if (!config[paths.containerName]) {
		console.log('Branch %s does not exist, can not update, sry bro :(', paths.containerName);
		return;
	}

	return Promise
		.resolve()
		.then(createBranchCopy)
		.then(execContainerUpdate)
		.then(reportSuccess)
		.catch(console.error);

	function createBranchCopy () {
		console.log('copy start');
		exec(fmt('cd %s; git fetch; git checkout %s --force; git pull', paths.repo, branchName));
		exec(fmt('mkdir -p %s; rsync -rv --exclude .git --exclude node_modules %s/* %s', paths.branch, paths.repo, paths.branch));
		exec(fmt('ln -fs /repo/node_modules %s/node_modules', paths.branch));
		exec(fmt('ln -fs /repo/vendor %s/vendor', paths.branch));
		exec(fmt('ln -fs /repo/.git %s/.git', paths.branch));
		exec(fmt('cp %s/.bowerrc %s/', paths.repo, paths.branch));
		console.log('copy end');
	}

	function execContainerUpdate () {
		console.log('exec container update');
		exec(fmt("docker exec %s ad deploy local", paths.containerName));
		console.log('exec container update done');
	}

	function reportSuccess () {
		console.log('UPDATE DONE MATHERFUCKER!!!!');
	}
};
