function getLog(fileUrl, logUrl, callback) {
	getJSON(fileUrl, function(e) {
		var filenames = JSON.parse(e);
		requestLog(logUrl, callback, filenames);
	});
}

function requestLog(url, callback, filenames) {
	getJSON(url, function(results) {
		console.time('decode');
		var timeline = JSON.parse(results);
		timeline = json_unpack(timeline);

		var files, file, i,il, j,jl;
		for (i=0, il=timeline.length;i<il;i++) {
			files = timeline[i].files;
			changes = timeline[i].change;

			for (j=0,jl=changes.length;j<jl;j++) {
				change = changes[j].split('|')
				changes[j] = {
					file: filenames[change[0]],
					op: change[1]
				};
			}

		}
		console.timeEnd('decode');
		processTrees(timeline);
		callback(timeline);
	});
}


var amd_priority = {A: 0, M: 1, D: 2}
function amdSort(a, b) {
	a = amd_priority[a.op]
	b = amd_priority[b.op];

    if(a>b) return -1;
    if(a<b) return 1;
    return 0;
}


function processTrees(timeline) {
	// TEST STUFF HERE
	// timeline = timeline.sort(compare);
	// timeline = timeline.reverse();
	console.time('processTrees');
	var i,il, commit, j, entry, filename;

	var commits_hash = {};
	window.c = commits_hash;

	var tree;
	var adding = false;
	var removing = false;


	for (i=0, il=timeline.length;i<il;i++) {
		commit = timeline[i];
		commit.tree = [];
		commits_hash[commit.hash] = commit;
	}

	// Build tree structure
	for (i=timeline.length;i--;) { // Run from earilest to latest
		commit = timeline[i];
		change = commit.change;

		if (commit.parents.length) {
			parent = commits_hash[commit.parents[0]].tree
		} else {
			parent = [];
		}

		tree = commit.tree = commit.tree.concat(parent);

		// slog(0.01, 'i', i, commit, parent, commit.parents[0]); //change

		// change = change.sort(amdSort);
		// change = change.reverse();

		for (j=change.length;j--;) {
			file = change[j];
			filename = file.file;

			switch (file.op) {
				case 'A':
					adding = true;
					removing = false;
					break;
				case 'M':
					// adding = true;
					// removing = true;
					adding = removing = false;
					break;
				case 'D':
					adding = false;
					removing = true;
					break;
			}

			// tree[current_hash] = filename;
			if (removing) {
				var found;
				found = tree.indexOf(filename)
				if (found < 0) {
					console.log('warning');
					// some sanity check
				} else {
					tree.splice(found, 1);
				}
			}

			if (adding) {
				tree.push(filename);
			}

		}
	}

	console.timeEnd('processTrees');


}

function checkTree(tree) {
	var x = 0;
	allnodes.forEach(function(node) {
		if (node instanceof FileNode) x++}
	);
	if (x!=tree.length) {
		console.log(tree.length, x);
		debugger;
	};
}

function treelog(tree) {
	var uniq = {}, u =0;
	tree = tree.sort(function(a,b){
	    if(a<b) return -1;
	    if(a>b) return 1;
	    return 0;
	});

	for (var i=0, il=tree.length; i<il;i++) {
		filename = tree[i];
		console.log(filename);
		if (!(filename in uniq)) {
			uniq[filename] = null;
			u++;
		}
	}
	console.log('Files: ' + il, u)
}



function getJSON(url, callback) {

	var request = new XMLHttpRequest();
	var u;
	request.open( 'GET', url, true );
	request.onload = function(e) {
		callback(request.response);
	}
	request.send(null);

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

function slog() {
	var args = Array.prototype.slice.call(arguments);
	var sample = args.shift();
	(Math.random() < sample) && console.log.apply(console, args);
}