var exec = require('child_process').exec;
var fs = require('fs');

// Options
var cwd = '../three.js/'; // target git repository directory
var target = 'data/test.json';
var pretty_json = true;
var pack_json = true;
// End Options

var json_format = {
	"hash":"%h",
	"parents":"%p",
	"author":"%an",
	"date":"%at",
	"message":"%s",
	"commitDate":"%ct",
	"files": ""
};

var pretty_format = JSON.stringify(json_format).replace(/\"/g, '^@^');
var cmd = 'git log --pretty=format:\'' + pretty_format + ',\' > result.json';

var fileschanged = 'git log --name-status --pretty="__HASH__%h"'
// --name-status --name-only


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
				f = names[1]
					.split('\n')
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

function json_pack(a) {
	// From [{a, b, c}, {a, b, c}] => {a:[], b:[], c:[]}
	var packed = {}, k;
	for (k in json_format) {
		packed[k] = [];
	}
	var i,il, e;
	for (i=0, il=a.length; i<il; i++) {
		e = a[i];
		for (k in json_format) {
			packed[k].push(e[k]);
		}
	}
	return packed;
}

function json_unpack(packed) {
	// From {a:[], b:[], c:[]} => [{a, b, c}, {a, b, c}]
	var unpacked = [], k, il;
	for (k in packed) {
		il = packed[k].length;
		break;
	}

	var i, o;
	for (i=0;i<il;i++) {
		o = {};
		for (k in packed) {
			o[k] = packed[k][i];
		}
		unpacked.push(o);
	}
	return unpacked;

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

	// console.log(hash);

	for (var i=0;i<log.length;i++) {
		commit = log[i];
		commit.files = hash[commit.hash];
		commit.parents = commit.parents != '' ? commit.parents.split(' '): [];
		commit.date = parseInt(commit.date);
	}

	if (pack_json) log = json_pack(log);

	var json = JSON.stringify(log, null,
		pretty_json ? '\t' : '');

	fs.writeFileSync(target, json, 'utf8');


}