"use strict";
// TODO grep linkable commit messages, urls, authors, commits numbers
// TODO virtual rendering for resizing viewport
// TODO refactor this into GitLogViewer class
// TODO filter / search / column features for GitLogViewer

/* OPTIONS */
var TRACK_WIDTH = 10;
var DOT_SIZE = 3;
var ROW_HEIGHT = 20;

var targetRows = 50; // Number of dom elements
var bufferRows = 0;

var LINK_PORTION = 0.28;
var x_fact = 0.15, y_fact = 0.5; // factors for bezier curve graph lines

/* Graph Line Style */
var GRAPH_MODE = 3;

var GRAPH_RECT_ENDS = 0,
	GRAPH_SLANT_ENDS = 1,
	GRAPH_CURVED_ENDS = 2,
	GRAPH_FLAT_ENDS = 3;
	// TODO: a mode which merges unnessary lanes

/*
DOT Styles
0: - Black core, White outline
1: - Colored core, Empty outline
2: - Black core, Colored outline, 
3: - Colored core, White outline
4: - Black core, White outline
 */
var DOT_COLOR_SCHEME = 1;

// Pwn CSS
var sheet = document.styleSheets[document.styleSheets.length - 1];
function addRule(selector, styles) {
	if (sheet.insertRule) sheet.insertRule(selector + " {" + styles + "}", sheet.cssRules.length);
	else if (sheet.addRule) sheet.addRule(selector, styles);
}

/* CUSTOMIZATIONS */
// Text colors (http://stackoverflow.com/questions/1057564/pretty-git-branch-graphs)
var Bright = 0, Bold = 1;
var Scheme = {
	Black: '#202020/#555555'.split('/'),
	Red: '#5d1a14/#da4939'.split('/'),
	Green: '#424e24/#a5c261,'.split('/'),
	Yellow: '#6f5028/#ffc66d'.split('/'),
	Blue: '#263e4e/#6d9cbe'.split('/'),
	Magenta: '#3e1f50/#a256c7'.split('/'),
	Cyan: '#234e3f/#62c1a1'.split('/'),
	White: '#979797/#ffffff'.split('/')
};

addRule('.log', 'height: ' + ROW_HEIGHT + 'px; width: 800px;');
addRule('.hash', 'color: ' + Scheme.Blue[Bold] + ';');
addRule('.time', 'float: right;color: ' + Scheme.Green[Bold] + ';');
addRule('.author', 'color: ' + Scheme.Cyan[Bold] + '; width: 100px; display:inline-block; overflow: hidden;');
addRule('.message', 'color: ' + Scheme.White[Bold] + '; width: 400px; display:inline-block; overflow: hidden;');

// Colors from jquery commits-graph
var colors =[
	"#e11d21",
	//"#eb6420",
	"#fbca04",
	"#009800",
	"#006b75",
	"#207de5",
	"#0052cc",
	"#5319e7",
	"#f7c6c7",
	"#fad8c7",
	"#fef2c0",
	"#bfe5bf",
	"#c7def8",
	"#bfdadc",
	"#bfd4f2",
	"#d4c5f9",
	"#cccccc",
	"#84b6eb",
	"#e6e6e6",
	"#ffffff",
	"#cc317c"
];

// Solarized
var colors = [
	'#BC9357',
	'#6D9CBD',
	'#509E50',
	'#CC7733',
	'#CFCFFF',
	'#A5C160',
	'#FFC66D',
	'#DA4938'
];

// Monokai = http://www.colourlovers.com/palette/1718713/Monokai
colors = [
	'#F92672',
	'#66D9EF',
	'#A6E22E',
	'#FD971F'
];

// Vibrant Ink http://eclipsecolorthemes.org/?view=theme&id=3
colors = [
	'#FFFFFF',
	'#8C3FC8',
	'#9CF828',
	'#F7C527',
	'#EC691E',
	'#477488',
	'#FF0000',
	'#D9B0AC'
];

// Monokai 2 - F92672
colors = [
	'#E6DB74',
	'#A6E22E',
	'#F92672',
	'#FFFFFF',
	'#AE81FF',
	'#79ABFF',
	'#BFA4A4'
];

// https://github.com/tpope/vim-vividchalk/blob/master/colors/vividchalk.vim
var colors = [
	"#339999", //"DarkCyan
	"#CCFF33", //"Yellow
	"#66FF00", //"LightGreen
	"#FFCC00", //"Yellow
	"#FF6600", //"Brown
	"#AAFFFF", //"LightCyan
	"#AACCFF", //"LightCyan
	"#AAAA77", //"Grey
	"#AAAAAA", //"Grey
	"#33AA00", //"DarkGreen
	"#44B4CC", //"DarkCyan
	"#DDE93D", //"Yellow
];
// Classic Style
// var colors = ['black', '#ee8', 'red', 'green', 'blue'];


// utils
function replacer(w) {
	return function() { return w };
}

function compare(a, b) {
	return b.date - a.date;
}

var viewer;


function GitLogViewer(timeline) {

	// console.log(timeline);
	window.t = timeline;

	this.currentRow = 0; // Current Row to Render from

	var i, il, commit;
	var hashes = {};

	// Date order vs Ancestor order
	// timeline.sort(compare); // TODO Buggy, dont use


	// Graphing strategies
	// 1. pending parents first (gitk, jetbrains, git log --graph)
	// 2. Current node first, pending parents, remaining parents (sourcetree, gitx)
	// 3. Current parent, remaining parents, pending parents. (soucetree)
	// 4. Perhaps one which has a fill space algorithm

	// TODO Mouse over interactivity

	var e;
	
	var p;

	function CommitPath(hash, row) {
		this.targetHash = hash; // hash for matching parent
		this.row = row; // commit sequence id
		this.length = 0;
	}

	var nodeTracks; // Track which lane the node is at for every row
	var tracks;

	this.regenerate = function() {
		// Calculating tracks for git log graphs

		console.time('graphing');

		var nodeTrack; // Lane the node is on
		nodeTracks = []; // Track which lane the node is at for every row
		var pendingPaths = [];

		tracks = []; // Array of Arrays
		var trackCounter = 0; // Unique Tracks

		// Start with childrens / latest.
		/* Compute Graph Tracks */
		for (i=0, il=timeline.length; i<il; i++) {
			commit = timeline[i];

			var currentPaths = [];
			for (j=0; j<commit.parents.length; j++) {
				// parents == where you came from
				currentPaths.push(new CommitPath(commit.parents[j], i))
			}

			nodeTrack = null;
			var merges = 0;

			// Pending Tracks
			for (j=0;j<pendingPaths.length;j++) {
				p = pendingPaths[j];

				var currentTrack = tracks[p.id];

				var currentLane;
				var endTrack = null;
				var first;
				var tmp;

				currentLane = p.lane;

				if (p.targetHash==commit.hash) {
					// this commit track path ends here
					first = nodeTrack === null;

					if (first) nodeTrack = j;
					endTrack = nodeTrack;

					if (first && currentPaths.length) {

						tmp = currentPaths.shift()
						tmp.lane = j;
						tmp.id = pendingPaths[j].id;
						pendingPaths[j] = tmp;


					} else {
						if (p.prevLane!=p.lane) {
							currentLane = p.prevLane;
						}

						pendingPaths.splice(j, 1);
						merges++;
						j--;
					}

				} else {
					p.lane -= merges;
					endTrack = p.lane;
					p.length++;
				}

				if (!currentTrack.length) {
					// Starting point of track
					currentTrack.push({lane: p.prevLane, row: p.row});
				}

				var ANGULAR_TRACK_ENDS = GRAPH_MODE != GRAPH_CURVED_ENDS;

				if (ANGULAR_TRACK_ENDS && currentLane != p.prevLane) {
					// For creating angular cut off
					if (currentLane != endTrack) {
						// reduce ugliness
						currentTrack.push({lane: endTrack, row: p.row});
					} else {
						if (GRAPH_MODE != GRAPH_SLANT_ENDS)
							currentTrack.push({lane: currentLane, row: p.row});
					}
				}

				currentTrack.push({lane: endTrack, row: i}); // child's row
				p.row = i;

			}

			if (nodeTrack===null) {
				nodeTrack = 0;
			}

			// Merge current parents into a pending array
			for (j=0;j<currentPaths.length;j++) {
				p = currentPaths[j];

				p.id = trackCounter++;
				p.lane = pendingPaths.length;
				tracks[p.id] = [];

				pendingPaths.push(p);
			}

			// All
			for (j=0;j<pendingPaths.length;j++) {
				p = pendingPaths[j];

				// Draw connecting lines
				if (p.length === 0) {
					p.prevLane = nodeTrack;
				} else {
					p.prevLane = p.lane;
				}

			}

			nodeTracks.push(nodeTrack);
		}

		console.timeEnd('graphing');

	};

	this.regenerate();



	console.time('draw');

	var maxTracks = 0
	for (i=nodeTracks.length;i--;) {
		maxTracks = Math.max(maxTracks, nodeTracks[i]);
	}

	maxTracks = Math.min(10, maxTracks);

	console.log(maxTracks);

	var container = document.getElementById('container');
	var timeline_panel = document.getElementById('timeline_panel');
	var panel_spacer = document.getElementById('panel_spacer');
	var sliding_window = document.getElementById('sliding_window');

	container.style.left = (maxTracks + 2) * TRACK_WIDTH + 'px';

	panel_spacer.style.height = ROW_HEIGHT * timeline.length;

	var sa, rows;

	function initDimensions() {
		// calculations for viewport or new row count changes.
		sa = timeline_panel.scrollHeight - timeline_panel.clientHeight;
		rows = sa / timeline_panel.scrollHeight * timeline.length; // actual scrollable rows
	}

	initDimensions();

	window.addEventListener('resize', function() {
		console.log('resizing');
		initDimensions();
	})

	timeline_panel.addEventListener('scroll', function(e) {
		var p = timeline_panel.scrollTop / sa; // percentage scrolled
		var sliding = timeline_panel.scrollTop % ROW_HEIGHT;

		sliding_window.style.top = timeline_panel.scrollTop - sliding; //  - bufferRows * ROW_HEIGHT

		viewer.currentRow = p * rows | 0;

		// console.log(timeline.length, rows, currentRow, sa, sliding_window.style.top);

		viewer.draw();
	});

	/***** Setup DOMs ************/

	// TODO test if this works on retina displays
	var ratio = 1;
	if (window.devicePixelRatio) {
		ratio = window.devicePixelRatio;
	}

	var canvas = document.createElement('canvas');
	canvas.id = 'graph';
	canvas.width = (maxTracks + 1) * TRACK_WIDTH;
	canvas.height = (targetRows + bufferRows * 2) * 25;
	sliding_window.insertBefore(canvas, container);

	var ctx = canvas.getContext('2d');
	ctx.lineWidth = 1.5;

	var divs = [], d;
	var links = [];

	function onClick(e, id) {
		var commit = timeline[id];
		// console.log(id, commit);
		console.log(JSON.stringify(commit.tree));
	}

	for (var j=0;j<(targetRows + bufferRows * 2);j++) {
		d = document.createElement('div');
		d.className = 'log';
		d.onclick = (function(j) {
			return function(e) {
				onClick(e, links[j]);
			}
		})(j)
		
		container.appendChild(d);
		divs.push(d);
	}

	var minRow, maxRow;
	var lastRenderered = 0;

	this.draw = draw;

	this.draw();
	console.timeEnd('draw');

	function getTrackX(t) {
		return ( maxTracks - t) * TRACK_WIDTH | 0.5 + 0.5;
	}

	function getRowY(t) {
		return t * ROW_HEIGHT + ROW_HEIGHT / 3; //+ offsetY
	}


	function draw() {

		var now = Date.now();
		if (now - lastRenderered < 16) {
			// console.log('skip');
			setTimeout(draw, 16);
			return;
		}

		minRow = Math.max(this.currentRow - bufferRows, 0);
		maxRow = Math.min(this.currentRow + targetRows + bufferRows, timeline.length);

		drawGraph();
		updateRows();

		lastRenderered = now;

		// setTimeout(function() {
		// 	timeline_panel.scrollTop += 50;
		// 	draw();
		// }, 20);

	}

	function drawGraph() {
		// Draw commit tracks
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.save();
		ctx.scale(ratio, ratio);
		
		ctx.translate(0, getRowY(0)-getRowY(minRow));

		var track, entry;

		var i, il, j, jl;

		// for (i=0,il=tracks.length; i<il; i++) {
		for (i=tracks.length; i--;) {
			track = tracks[i];

			ctx.strokeStyle = colors[i % colors.length];

			for (j=0, jl=track.length;j<jl;j++) {
				entry = track[j];
				if (entry.row >= minRow) break;
			}

			ctx.beginPath();
			
			ctx.moveTo(getTrackX(entry.lane), getRowY(entry.row));
			
			var prev;
			for (j=j+1, jl=track.length;j<jl;j++) {
				entry = track[j];
				prev = track[j-1];

				var from_x = getTrackX(prev.lane);
				var from_y = getRowY(prev.row);
				var to_x = getTrackX(entry.lane);
				var to_y = getRowY(entry.row);

				switch (GRAPH_MODE) {
					case GRAPH_RECT_ENDS:
						ctx.lineTo(getTrackX(entry.lane), getRowY(entry.row));
						break;
					case GRAPH_SLANT_ENDS:
						if (j == jl - 1) {
							ctx.lineTo(getTrackX(prev.lane), getRowY(entry.row-LINK_PORTION));
						} else {
							ctx.lineTo(getTrackX(entry.lane), getRowY(prev.row+LINK_PORTION));
						}

						ctx.lineTo(getTrackX(entry.lane), getRowY(entry.row));
						break;
					case GRAPH_CURVED_ENDS:
						if (entry.lane != prev.lane) {
							ctx.bezierCurveTo(
								from_x - TRACK_WIDTH * x_fact, from_y + ROW_HEIGHT * y_fact,
								to_x + TRACK_WIDTH * x_fact, to_y - ROW_HEIGHT * y_fact,
								to_x, to_y
							);
						} else {
							ctx.lineTo(getTrackX(entry.lane), getRowY(entry.row));
						}

						break;
					case GRAPH_FLAT_ENDS:
						if (j == jl - 1) {
							ctx.lineTo(getTrackX(prev.lane), getRowY(entry.row-LINK_PORTION));
						} else {
							// ctx.lineTo(getTrackX(entry.lane), getRowY(prev.row+LINK_PORTION));
						}

						ctx.lineTo(getTrackX(entry.lane), getRowY(entry.row));

						break;
				}
				
				if (entry.row >= maxRow) break;
			}

			ctx.stroke();

			switch (DOT_COLOR_SCHEME) {
				case 0: // White outline, Black fill
					ctx.fillStyle = Scheme.Black[Bright];
					ctx.strokeStyle = Scheme.White[Bold];
					break;
				case 1: // Colored fill, empty outline
					ctx.fillStyle = colors[i % colors.length];
					ctx.strokeStyle = 'transparent';
					break;
				case 2: // Colored outline, empty fill
					ctx.fillStyle = Scheme.Black[Bright];
					ctx.strokeStyle = colors[i % colors.length];
					break;
				case 3: // Colored fill, white outline
					ctx.fillStyle = colors[i % colors.length];
					ctx.strokeStyle = Scheme.White[Bold];
					break;
				case 4:
					ctx.fillStyle = Scheme.Black[Bold];
					ctx.strokeStyle = Scheme.White[Bold];
					break;
			}

			ctx.lineWidth = 1.5;

			// Draw nodes
			for (j=0, jl=track.length;j<jl;j++) {
				entry = track[j];
				if (nodeTracks[entry.row] != entry.lane
					|| entry.row < minRow ) continue;
				ctx.beginPath();
				ctx.arc(getTrackX(entry.lane), getRowY(entry.row), DOT_SIZE, 0, Math.PI * 2);
				ctx.fill();
				ctx.stroke();

				// if (entry.row > maxRow) break;
			}

			/*
			// debug track points.
			ctx.fillStyle = colors[i % colors.length];
			for (j=0, jl=track.length;j<jl;j++) {
				entry = track[j];

				ctx.beginPath();
				ctx.arc(getTrackX(entry.lane), getRowY(entry.row), 2, 0, Math.PI * 2);
				ctx.fill();

				if (entry.row >= maxRow) break;
			}
			*/
		}

		ctx.restore();
	}

	function updateRows() {

		// Display commit messages
		for (i=minRow, j=0;i<maxRow;i++,j++) {
			commit = timeline[i];
			links[j] = i;
			d = divs[j];
			d.innerHTML = '<span class="id">%id</span>. <span class="hash">%hash</span> <span class="message">%message</span>  <span class="author">%author</span> <span class="time">%time</span>'
				.replace(/%id/, replacer(timeline.length-i))
				.replace(/%message/, replacer(commit.message))
				.replace(/%time/, replacer(new Date(commit.date * 1000).toDateString()))
				.replace(/%hash/, replacer(commit.hash))
				.replace(/%author/, replacer(commit.author));
		}

	}

}