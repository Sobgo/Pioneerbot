const { execSync } = require('child_process');
var packages = require('./package.json');
var exec = require('child_process').execSync;

var dependencies = packages.dependencies;
var devDependencies = packages.devDependencies;

// run npm install package@latest for each package
for (var package in dependencies) {
	var command = 'npm install ' + package + '@latest';
	console.log(command);
	execSync(command);
}

// run npm install package@latest for each devDependency
for (var package in devDependencies) {
	var command = 'npm install ' + package + '@latest --save-dev';
	console.log(command);
	execSync(command);
};