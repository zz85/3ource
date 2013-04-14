function requestLog(url, callback) {

	var request = new XMLHttpRequest();
	var u;
	request.open( 'GET', url, true );
	request.onload = function(e) {
		console.time('decode');
		var timeline = JSON.parse(request.response);
		timeline = json_unpack(timeline);
		console.timeEnd('decode');
		callback(timeline);
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