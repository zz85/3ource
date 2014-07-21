var exec = require('child_process').exec;
var fs = require('fs');
var md5 = require('../src/lib/md5baseJS.js').md5;
var utils = require('../src/source.js');
var slog = utils.slog, json_pack = utils.json_pack;

var http = require('http'),
	fs = require('fs');

// Options
var cwd = './'; // target git repository directory
cwd = '../three.js/';
var OUTPUT_JSON = 'data/test.json';
var FILENAMES_JSON = 'data/filenames.json';
var AVATAR_DESTINATION = 'data/avatars/';
var DOWNLOAD_GRAVATAR = !true;
var PRETTY_JSON = true;
var PACK_JSON = true;
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




var json_keys = [];
var pretty_format2 = [];;
for (var k in json_format) {
	json_keys.push(k);
	pretty_format2.push(json_format[k]);
}

var pretty_format2 = pretty_format2.join(DELIMITER);

var GIT_LOG_RAW = 'git log --raw -m --pretty=format:"user:%n' + pretty_format2 + '" --encoding=UTF-8';
var GIT_TREE_LS = 'git ls-tree -r --name-only ';
var GIT_SHORTLOG = 'git shortlog --summary --email --numbered  < /dev/tty';
// whatchanged -m --first-parent %aE


var commits = [];
var commit_hashes = {};

var mapped_filenames = {};
var indexed_filenames = [];
var filenames = 0;

get_git_raw();
// getUser();

// console.log(md5('abc'));

function getUser() {
	exec(GIT_SHORTLOG, {cwd: cwd, maxBuffer: 1024 * 1024 * 10},
		function (error, stdout, stderr) {
		if (error !== null) {
			console.log('exec error: ' + error);
			return;
		}
		console.log('Getting contributors via git shortstat');
		var users = stdout.split('\n');
		var emailRegex = /[<](.*)[>]/;
		var emails = [];
		var hashes = [];
		var email;
		for (var i=0;i<users.length;i++) {
			user = users[i];
			tokens = emailRegex.exec(user);
			if (!tokens) continue;
			email = tokens[1];
			emails.push(email);
			// hashes.push(md5(email))
			if (DOWNLOAD_GRAVATAR) gravatar(email, 256);
			// 200 - 3.6MB 512 - 10.6MB

		}
		console.log(emails.length);
		// console.log('hashes', hashes);
		// console.log('emails', emails);
	});
}

function gravatar(email, size) {
	size = size || 80;
	var hash = md5(email);

	var options = {
		host: 'www.gravatar.com',
		port: 80,
		path: '/avatar/' + hash + '.jpg?s=' + size
	};

	var request = http.get(options, function(res){
		var imagedata = '';
		res.setEncoding('binary');

		res.on('data', function(chunk){
			imagedata += chunk;
		});

		res.on('end', function(){
			fs.writeFile(AVATAR_DESTINATION + hash + '.jpg', imagedata, 'binary', function(err){
				if (err) throw err;
				console.log('Gravatar saved. ' + hash);
			});
		});

	});
	// return 'http://www.gravatar.com/
}

function get_git_raw() {
	var rawlogs = exec(GIT_LOG_RAW, {cwd: cwd, maxBuffer: 1024 * 1024 * 200},
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
				e = regex.exec(log);
				// if (e)
				// 	o.files.push({file: e[6], op: e[5], from: e[3], to: e[4]});
				if (e.length) {
					o.files.push([e[6], e[5], e[3], e[4]].join(DELIMITER2));
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

function loop(i) {
	var commit;
	if (i<commits.length) {
		commit = commits[i];
		commit.parents = commit.parents !== '' ? commit.parents.split(' '): [];
		commit.date = parseInt(commit.date);
		getTree(commit.hash, commit, i);
	} else {
		done();
	}
}

function generateChangeset(changes, currentTree, parentTree, modified) {
	var i;

	for (i=0;i<modified.length;i++) {
		changes.push(mapped_filenames[modified[i]] + DELIMITER2 + 'M');
	}

	if (parentTree === undefined) parentTree = [];

	// slog(0.001, 'trees', currentTree, parentTree)

	var added = [], f, deleted = [];
	for (i=0;i<currentTree.length;i++) {
		f = currentTree[i];
		if (parentTree.indexOf(f) == -1) {
			changes.push(f + DELIMITER2 + 'A');
		}
	}

	for (i=0;i<parentTree.length;i++) {
		f = parentTree[i];
		if (currentTree.indexOf(f) == -1) {
			changes.push(f + DELIMITER2 + 'D');
		}
	}
}

function done() {

	console.timeEnd('tree');

	for (i=0;i<commits.length;i++) {
		commit = commits[i];
		parentTree = commit_hashes[commit.parents[0]];
		if (parentTree) parentTree = parentTree.tree;
		generateChangeset(commit.change, commit.tree, parentTree, commit.modified);
	}

	console.log('done!!');

	if (PACK_JSON) commits = json_pack(commits, json_format);

	var json = JSON.stringify(commits, null,
		PRETTY_JSON ? '\t' : '');

	var json_filenames = JSON.stringify(indexed_filenames, null,
		PRETTY_JSON ? '\t' : '');

	fs.writeFileSync(OUTPUT_JSON, json, 'utf8');
	fs.writeFileSync(FILENAMES_JSON, json_filenames, 'utf8');

}