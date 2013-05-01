function requestLog(url, callback) {
	getJSON(url, function(results) {
		console.time('decode');
		var timeline = JSON.parse(results);
		timeline = json_unpack(timeline);

		var files, file, i,il, j,jl;
		for (i=0, il=timeline.length;i<il;i++) {
			files = timeline[i].files;
			if (files) for (j=0,jl=files.length;j<jl;j++) {
				file = files[j].split('|')
				files[j] = {
					file: file[0],
					op: file[1],
					from: file[2],
					to: file[3]
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