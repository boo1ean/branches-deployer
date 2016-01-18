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
		containerName:       fmt(t.containerName, deployConfig.domain.replace(/\./g, '-'), branchName),

		getUpstream: getUpstream,
		getUpstreamName: getUpstreamName,
		getDomain: getDomain,
		getVhostPath: getVhostPath
	};
}

function getUpstream (hostName, port) {
	return fmt('%s:%s', hostName, port);
}

function getUpstreamName (baseDomain, branchName, vhostName) {
	return fmt('%s_%s_%s', vhostName, branchName, baseDomain);
}

function getDomain (baseDomain, vhostName, lowerBranchName) {
	if (vhostName === '@') {
		return fmt('%s.%s', lowerBranchName, baseDomain);
	}

	return fmt('%s.%s.%s', vhostName, lowerBranchName, baseDomain);
}

function getVhostPath (baseDomain, branchName, vhostName) {
	return fmt('%s/%s', paths.nginxVhosts, getUpstreamName(baseDomain, branchName, vhostName));
}
