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
		callback(timeline);
	});
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