/*
	TODO
	- Touch Events
	- Scroll Events
	- Animation
	- Styling
	- Mouse events should work across the screen
*/

function Slidebar(track, grip) {
	// TODO to extend SlidingWindow
	this.max = 2000;
	this.min = 0;
	this.value = 0;

	this.height = 14;

	this.initUI();

	this.AUTOSIZE_GRIP = true;
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

		track.style.height = this.height + 'px';
		track.style.width = this.trackLength + 'px';


		var grip = Math.max(this.gripLength, this.trackLength / (this.max - this.min + 1))
		var units = (this.value - this.min);
		var unit_bounds = (this.trackLength - grip) / (this.max - this.min);
		var left = units * unit_bounds;

		thumb.style.marginLeft = left + 'px';
		thumb.style.height = this.height +  'px';
		thumb.style.width = this.gripLength + 'px';

	},

	mouseX: function(x) {
		var grip = Math.max(this.gripLength, this.trackLength / (this.max - this.min + 1))
		var unit_bounds = (this.trackLength - grip) / (this.max - this.min);
		var offset = x - 0.5 * this.gripLength + 0.5 * unit_bounds;
		var value = offset / unit_bounds + this.min | 0;
		value = Math.max(Math.min(value, this.max), this.min);
		this.setValue(value);
		// console.log('mousex', x, 'value', value);
		return value;
	},

	mouseDown: function(e) {
		// console.log('z', e.clientX - parseInt(this.track.offsetLeft, 10), e.offsetX);
		document.addEventListener('mousemove', this.onMouseMove);
		document.addEventListener('mouseup', this.onMouseUp);

		var x = e.clientX - this.track.offsetLeft;
		var value = this.mouseX(x);
		this.onScroll.fire(value);

		e.preventDefault();
		// e.stopPropagation();

	},

	mouseMove: function(e) {
		var x = e.clientX - this.track.offsetLeft;
		var value = this.mouseX(x);
		this.onScroll.fire(value);
	},

	mouseUp: function(e) {
		var x = e.clientX - this.track.offsetLeft;
		var value = this.mouseX(x);
		this.onScroll.fire(value);

		document.removeEventListener('mousemove', this.onMouseMove);
		document.removeEventListener('mouseup', this.onMouseUp);

	},

	initUI: function() {
		var track = document.createElement('div');
		var thumb = document.createElement('div');

		track.appendChild(thumb);

		this.onMouseDown = this.mouseDown.bind(this);
		this.onMouseMove = this.mouseMove.bind(this);
		this.onMouseUp = this.mouseUp.bind(this);

		track.addEventListener('mousedown', this.onMouseDown);

		this.track = track;
		this.thumb = thumb;
		this.dom = track;

		// TODO refactor styles
		track.style.position = 'absolute';
		// track.style.top = '200px';

		track.style.zIndex = 100;
		track.style.left = '0';
		track.style.right = '0';
		track.style.margin = 'auto';
		track.style.bottom = '30px';
		
		track.style.backgroundColor = '#333';
		thumb.style.cursor = 'pointer';
		thumb.style.backgroundColor = '#f00';
		track.style.borderRadius = '14px';
		thumb.style.borderRadius = '14px';

		// track.style.border = '1px solid black';
		// thumb.style.border = '1px solid black';

	},

	destory: function() {
		// destory listeners and events
	}
};


