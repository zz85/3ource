var exec = require('child_process').exec;
var fs = require('fs');

// based on http://stackoverflow.com/a/13928240

var format = '{"hash":"%h","parents":"%p","author":"%an","date":"%at","message":"%s","commitDate":"%ct"}'.replace(/\"/g, '^@^');
var cmd = 'git log --pretty=format:\'' + format + ',\' > result.json';
var cwd = '../three.js/'; // target git repository directory
var target = 'data/test.json';

var fileschanged = 'git log --name-status --pretty="__HASH__%h"'
// --name-status --name-only

var pretty_json = !true;
var hash = {};

// AMD - Add, Modified, Delete
getfiles();

function getfiles() {

	var child = exec(fileschanged + ' > __files.txt', {cwd: cwd},
	function (error, stdout, stderr) {
		if (error !== null) {
			console.log('exec error: ' + error);
			return;
		}

		var files = fs.readFileSync(cwd + '__files.txt', 'utf8');
		fs.unlinkSync(cwd + '__files.txt');

		files = files.split('__HASH__')
		files.shift()

		var f, names;


		for (var i=0;i<files.length;i++) {
			names = files[i].split('\n\n');
			if (names.length>1) {
				f = names[1].split('\n')
				f.pop();
			} else {
				f = [];
			}
			hash[names[0]] = f;
		}

		// console.log(hash);

		var child = exec(cmd, {cwd: cwd},
			function (error, stdout, stderr) {
				if (error !== null) {
					console.log('exec error: ' + error);
					return;
				}
				convert();
		});

	});

}


function convert() {

	var result = fs.readFileSync(cwd + 'result.json', 'utf8');
	fs.unlinkSync(cwd + 'result.json');
	var out = result.replace(/"/gm, '\\"').replace(/\^@\^/gm, '"');
	if (out[out.length - 1] == ',') {
		out = out.substring (0, out.length - 1);
	}

	// quick hack!
	var log = eval('[' + out + ']');
	// var log = JSON.parse('[' + out + ']');
	var commit;

	console.log(hash);

	for (var i=0;i<log.length;i++) {
		commit = log[i];
		commit.files = hash[commit.hash];
		commit.parents = commit.parents.split(' ');
		commit.date = parseInt(commit.date);
	}

	var json = JSON.stringify(log, null,
		pretty_json ? '\t' : '');

	fs.writeFileSync(target, json, 'utf8');


}