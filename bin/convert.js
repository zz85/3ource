var exec = require('child_process').exec;
var fs = require('fs');
var spawn = require('child_process').spawn;

// based on http://stackoverflow.com/a/13928240

var format = '{%n"hash":"%h","parents":"%p",%n"author":"%an",%n"date":"%at",%n"message":"%s",%n"commitDate":"%ct"}'.replace(/\"/g, '^@^');
var cmd = 'git log --pretty=format:\'' + format + ',\' > result.json';
var cwd = ''; // target git repository directory
var target = 'data/test.json';

var fileschanged = 'git log --name-only --pretty="__HASH__%h"'
// --name-status --name-only

var hash = {};

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

		for (var i=0;i<files.length;i++) {
			var names = files[i].split('\n\n');
			var f = names[1].split('\n')
			f.pop();
			hash[names[0]] = f;
		}


		var child = exec(cmd, {cwd: cwd},
			function (error, stdout, stderr) {
				if (error !== null) {
					console.log('exec error: ' + error);
					return;
				}
				convert();
		});

	});

	// var changedfiles = [];
	// var args = fileschanged.split(' ');
	// closure = spawn(args[0], args.slice(1))

	// closure.stdout.on('data', function (data) {
	// 	changedfiles.push('' + data);
	// });

	// closure.stderr.on('data', function (data) {
	// 	console.error('' + data)
	// });

	// closure.on('exit', function (code) {
	// 	if (code) {
	// 		return;
	// 	}

	// 	changedfiles = changedfiles.join();
	// 	console.log(changedfiles);
	// });

}


function convert() {

	var result = fs.readFileSync(cwd + 'result.json', 'utf8');
	fs.unlinkSync(cwd + 'result.json');
	var out = result.replace(/"/gm, '\\"').replace(/\^@\^/gm, '"').replace(/w+/g, ' ');
	if (out[out.length - 1] == ',') {
		out = out.substring (0, out.length - 1);
	}

	// quick hack!
	var log = eval('[' + out + ']');
	var commit;

	console.log(hash);

	for (var i=0;i<log.length;i++) {
		commit = log[i];
		commit.files = hash[commit.hash]
	}

	var json = JSON.stringify(log, null, '\t');

	fs.writeFileSync(target, json, 'utf8');


}