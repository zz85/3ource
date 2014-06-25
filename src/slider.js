function Scrollbar(track, grip) { // TODO extend SlidingWindow
	this.max = 100;
	this.min = 0;
	this.value = 0;

	this.initUI();

	this.setTrackLength(track || 600);
	this.setGripLength(grip || 50);

	this.onScroll = new Do(this);
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
		track.style.backgroundColor = '#333';

		var slidingSpace = this.trackLength - this.gripLength;
		var percentage = this.value / this.max;
		var left = slidingSpace * percentage;
		if (Math.random() < 0.1) console.log(slidingSpace, percentage, left);
		thumb.style.marginLeft = left + 'px';
		thumb.style.height = '40px';
		thumb.style.width = this.gripLength + 'px';
		thumb.style.backgroundColor = '#f00';
	},

	onMouseDown: function(e) {
		var value = e.offsetX / this.trackLength * this.max | 0;
		this.setValue(value);
		this.onScroll.fire(value);
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


