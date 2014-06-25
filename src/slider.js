function Scrollbar(t, g) { // TODO extend SlidingWindow
	this.max = 100;
	this.min = 0;
	this.value = 0;

	this.initUI();

	t = 200;

	this.setTrackLength(t);
	this.setGripLength(g);

}

Scrollbar.prototype = {
	setTrackLength: function(x) {
		this.trackLength = x;
		this.paint();
	},
	setGripLength: function(x) {
		this.gripLength = x;
		this.paint();
	},
	setPosition: function(x) {
	},
	setValue: function(x) {
		this.value = x;
	},
	setMax: function(x) {
		this.max = x;
	},

	paint: function() {
		var track = this.track;
		var thumb = this.thumb;
		track.style.position = 'absolute';
		track.style.top = '200px';
		track.style.left = '20px';

		track.style.height = '40px';
		track.style.width = this.trackLength + 'px';
		track.style.backgroundColor = '#fff';

		thumb.style.height = '40px';
		thumb.style.width = this.gripLength + 'px';
		thumb.style.backgroundColor = '#f00';
	},

	onMouseDown: function(e) {
		console.log(e.offsetX, this.trackLength);
	},

	initUI: function() {
		var track = document.createElement('div');
		var thumb = document.createElement('div');
		track.appendChild(thumb);

		track.addEventListener('mousedown', this.onMouseDown.bind(this));

		this.track = track;
		this.thumb = thumb;
		this.dom = track;
	}
};


