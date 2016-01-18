var fmt = require('util').format;
var path = require('path');

const t = {
	branch: '%s/branches/%s-%s',
	dockerComposeConfig: '%s/docker-compose.yml',
	nginxVhosts: '%s/nginx/nginx/sites-enabled',
	nginxImage: '%s/nginx',
	nginxConfigs: '%s/nginx/nginx',
	containerName: '%s-%s'
};

module.exports = function generatePaths (workspacePath, branchName, deployConfig) {
	return {
		lowerBranchName:     branchName.toLowerCase(),
		dockerComposeConfig: fmt(t.dockerComposeConfig, workspacePath),
		branch:              fmt(t.branch, workspacePath, deployConfig.domain.replace(/\./g, '-'), branchName),
		repo:                path.resolve(deployConfig.repoPath),
		nginxVhosts:         fmt(t.nginxVhosts, workspacePath),
		nginxImage:          fmt(t.nginxImage, workspacePath),
		nginxConfigs:        fmt(t.nginxConfigs, workspacePath),
		containerName:       fmt(t.containerName, deployConfig.domain.replace(/\./g, '-'), branchName)
	};
}
