function Slidebar(track, grip) {
	// TODO to extend SlidingWindow
	this.max = 100;
	this.min = 0;
	this.value = 0;

	this.height = 30;

	this.initUI();

	this.setTrackLength(track || 600);
	this.setGripLength(grip || 50);

	this.onScroll = new Do(this);
}

Slidebar.prototype = {
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
		this.paint();
	},
	setMax: function(x) {
		this.max = x;
	},

	paint: function() {
		var track = this.track;
		var thumb = this.thumb;
		track.style.position = 'absolute';
		// track.style.top = '200px';
		track.style.left = '20px';
		track.style.bottom = '30px';

		track.style.height = this.height + 'px';
		track.style.width = this.trackLength + 'px';
		track.style.backgroundColor = '#333';

		var slidingSpace = this.trackLength - this.gripLength;
		var percentage = this.value / this.max;
		var left = slidingSpace * percentage;
		if (Math.random() < 0.1) console.log(slidingSpace, percentage, left);
		thumb.style.marginLeft = left + 'px';
		thumb.style.height = this.height +  'px';
		thumb.style.width = this.gripLength + 'px';
		thumb.style.backgroundColor = '#f00';
		thumb.style.cursor = 'pointer';
	},

	mouseX: function(x) {
		var value = (x - this.gripLength / 2) / this.trackLength * this.max | 0;
		value = Math.max(value, 0);
		this.setValue(value);
		return value;
	},

	onMouseDown: function(e) {
		var value = this.mouseX(e.offsetX);
		this.onScroll.fire(value);

		this.mousemove = this.onMouseMove.bind(this);
		this.mouseup = this.onMouseUp.bind(this);
		this.track.addEventListener('mousemove', this.mousemove);
		this.track.addEventListener('mouseup', this.mouseup);
	},

	onMouseMove: function(e) {
		var value = this.mouseX(e.offsetX);
		// this.onScroll.fire(value);
	},

	onMouseUp: function(e) {
		// console.log(e);
		// var value = this.mouseX(e.offsetX);
		// this.onScroll.fire(value);

		this.track.removeEventListener('mousemove', this.mousemove);
		this.track.removeEventListener('mouseup', this.mouseup);
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


