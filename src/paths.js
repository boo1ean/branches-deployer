var fmt = require('util').format;

const templates = {
	branch: '%s/branches/%s',
	dockerComposeConfig: '%s/docker-compose.yml',
	repo: '%s/repo',
	nginxVhost: '%s/nginx/nginx/sites-enabled/%s',
	nginxImage: '%s/nginx',
	nginxConfigs: '%s/nginx/nginx'
};

module.exports = function generatePaths (workspacePath, branchName) {
	return {
		lowerBranchName:     branchName.toLowerCase(),
		dockerComposeConfig: fmt(t.dockerComposeConfig, workspacePath),
		branch:              fmt(t.branch, workspacePath, branchName),
		repo:                fmt(t.repo, workspacePath),
		nginxVhost:          fmt(t.nginxVhost, workspacePath, branchName),
		nginxImage:          fmt(t.nginxImage, workspacePath),
		nginxConfigs:        fmt(t.nginxConfigs, workspacePath),
	};
}
