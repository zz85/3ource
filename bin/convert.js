var exec = require('child_process').exec;
var fs = require('fs');

// Options
var cwd = './'; // target git repository directory
cwd = '../three.js/'
var OUTPUT_JSON = 'data/test.json';
var FILENAMES_JSON = 'data/filenames.json';
var pretty_json = true;
var pack_json = true;
// End Options

/*
 * TODO - combine both git commands into 1
 * GET Gravatar from emails
 */

var json_format = {
	"hash":"%h",
	"parents":"%p",
	"author":"%aN",
	"date":"%at",
	"message":"%s",
	// "commitDate":"%ct",
	// "files":"",
	"change":""
	// "tree": ""
};

var DELIMITER = '|^@^|';
var DELIMITER2 = '|';
var DOWNLOAD_GRAVATAR = false;



var json_keys = [];
var pretty_format2 = [];;
for (var k in json_format) {
	json_keys.push(k);
	pretty_format2.push(json_format[k]);
}

var pretty_format2 = pretty_format2.join(DELIMITER);

var RAW_FILES = 'git log --raw -m --pretty=format:"user:%n' + pretty_format2 + '" --encoding=UTF-8';
var GIT_TREE_LS = 'git ls-tree -r --name-only ';
var GIT_SHORTLOG = 'git shortlog --summary --email --numbered'
// whatchanged -m --first-parent %aE


var commits = [];
var commit_hashes = {};

var mapped_filenames = {};
var indexed_filenames = [];
var filenames = 0;

get_git_raw();

function get_git_raw() {
	var rawlogs = exec(RAW_FILES, {cwd: cwd, maxBuffer: 1024 * 1024 * 200},
	function (error, stdout, stderr) {
		if (error !== null) {
			console.log('exec error: ' + error);
			return;
		}

		var logs = stdout.split('\n');
		var o = {};
		var log, line2;
		commits = [];

		var regex = /(.*)[ ](.*)[ ](\w+)[.]+[ ](\w+)[.]+[ ](.)\t(.*)/;
		// sample format - ":000000 100644 0000000... e69de29... A\tREADME"

		for (i=0,il=logs.length;i<il;i++) {
			log = logs[i];

			if (log.substring(0, 5)=='user:') {
				line = logs[i+1].split(DELIMITER);

				var tmp = {};
				for (var j=0;j<line.length;j++) {
					tmp[json_keys[j]] = line[j];
				}

				hash = tmp.hash;

				if (hash!=o.hash) {
					o = tmp;
					o.files = [];
					o.change = [];
					o.tree = [];
					o.modified = [];
					commit_hashes[hash] = o;
					commits.push(o);
				}
				i++;

			} else if (log.trim() =='') {

			} else {
				e = regex.exec(log)
				// if (e)
				// 	o.files.push({file: e[6], op: e[5], from: e[3], to: e[4]});
				if (e.length) {
					o.files.push([e[6], e[5], e[3], e[4]].join(DELIMITER2))
					if (e[5]=='M') o.modified.push(e[6]);
				}

			}

		}

		console.log('Found ' + commits.length + ' commits');

		console.log('done');
		console.time('tree');
		loop(0);
		// console.log(stdout);
	});
}


function slog() {
	var args = Array.prototype.slice.call(arguments);
	var sample = args.shift();
	(Math.random() < sample) && console.log.apply(console, args);
}

function getTree(name, commit, i) {
	var ls_cmd =  GIT_TREE_LS + name;
	slog(0.01, ls_cmd, i, 'unique filenames' + filenames);
	var ls_tree = exec(ls_cmd, {cwd: cwd, maxBuffer: 1024 * 1024 * 200},
		function(error, stdout, stderr) {
			if (error !== null) {
				console.log('exec error: ' + error);
				return;
			}
			var files = stdout.split('\n');
			var filename;
			var tree = commit.tree;
			for (var j=0;j<files.length;j++) {
				filename = files[j];
				if (filename.trim() == '') continue;
				if (!(filename in mapped_filenames)) {
					indexed_filenames.push(filename);
					mapped_filenames[filename] = filenames++;
				}
				tree.push(mapped_filenames[filename]);

			}

			i++;
			loop(i);

		});
}

/*
a90c4e1:
   [ 'A\tsrc/Class.js',
     'A\tsrc/cameras/Camera.js',
*/

function json_pack(a, schema) {
	// From [{a, b, c}, {a, b, c}] => {a:[], b:[], c:[]}
	var packed = {}, k;
	for (k in schema) {
		packed[k] = [];
	}
	var i,il, e;
	for (i=0, il=a.length; i<il; i++) {
		e = a[i];
		for (k in schema) {
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

function loop(i) {
	var commit;
	if (i<commits.length) {
		commit = commits[i];
		commit.parents = commit.parents != '' ? commit.parents.split(' '): [];
		commit.date = parseInt(commit.date);
		getTree(commit.hash, commit, i);
	} else {
		done();
	}
}

function generateChangeset(commit, tree1, tree2) {
	var change = commit.change;
	var modified = commit.modified;

	for (var i=0;i<modified.length;i++) {
		change.push(mapped_filenames[modified[i]] + DELIMITER2 + 'M');
	}

	if (tree2==undefined) tree2 = [];

	// slog(0.001, 'trees', tree1, tree2)

	var added = [], f, deleted = [];
	for (var i=0;i<tree1.length;i++) {
		f = tree1[i];
		if (tree2.indexOf(f) == -1) {
			change.push(f + DELIMITER2 + 'A');
		}
	}

	for (var i=0;i<tree2.length;i++) {
		f = tree2[i];
		if (tree1.indexOf(f) == -1) {
			change.push(f + DELIMITER2 + 'D');
		}
	}

}

function done() {

	console.timeEnd('tree');

	for (i=0;i<commits.length;i++) {
		commit = commits[i];
		parentTree = commit_hashes[commit.parents[0]]
		if (parentTree) parentTree = parentTree.tree;
		generateChangeset(commit, commit.tree, parentTree);
	}

	console.log('done!!');

	if (pack_json) commits = json_pack(commits, json_format);

	var json = JSON.stringify(commits, null,
		pretty_json ? '\t' : '');

	fs.writeFileSync(OUTPUT_JSON, json, 'utf8');
	fs.writeFileSync(FILENAMES_JSON, JSON.stringify(indexed_filenames), 'utf8');

}