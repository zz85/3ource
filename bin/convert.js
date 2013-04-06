var exec = require('child_process').exec;
var fs = require('fs');

// based on http://stackoverflow.com/a/13928240

var cmd = 'git log --pretty=format:\'{%n^@^hash^@^:^@^%h^@^,%n^@^author^@^:^@^%an^@^,%n^@^date^@^:^@^%ad^@^,%n^@^email^@^:^@^%aE^@^,%n^@^message^@^:^@^%s^@^,%n^@^commitDate^@^:^@^%ai^@^,%n^@^age^@^:^@^%cr^@^},\' > result.json';
var cwd = '../../three.js/'
var target = '../data/test.json'


var child = exec(cmd, {cwd: cwd},
	function (error, stdout, stderr) {
		if (error !== null) {
			console.log('exec error: ' + error);
			return;
		}
		format();
});

function format() {

	var result = fs.readFileSync(cwd + 'result.json', 'utf8');
	fs.unlinkSync(cwd + 'result.json');
	var out = result.replace(/"/gm, '\\"').replace(/\^@\^/gm, '"').replace(/w+/g, ' ');
	if (out[out.length - 1] == ',') {
		out = out.substring (0, out.length - 1);
	}

	// quick hack!
	var log = eval('[' + out + ']');

	var json = JSON.stringify(log, null, '\t');

	fs.writeFileSync(target, json, 'utf8');

}