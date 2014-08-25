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
if (!document.styleSheets.length) document.head.appendChild(document.createElement('style'));
var sheet = document.styleSheets[document.styleSheets.length - 1];
var rules = {};
function cssRule(selector, styles) {
	var index;
	if (selector in rules) {
		index = rules[selector];
		sheet.deleteRule(index);
	} else {
		index = rules[selector] = sheet.cssRules.length;
	}

	sheet.insertRule(selector + " {" + styles + "}", index);
	// Don't support for <IE9 sheet.addRule, sorry, ha!
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


function setWidth(width) {
	var messageWidth = 400;
	var recommended = 30 + 50 + messageWidth + 100 + 105;
	console.log(recommended);
	if (width > recommended) messageWidth = width - recommended + messageWidth;

	cssRule('.log', 'height: ' + ROW_HEIGHT + 'px; width: ' + width + ';');

	cssRule('.hash', 'color: ' + Scheme.Blue[Bold] + ';');
	cssRule('.time', 'color: ' + Scheme.Green[Bold] + ';');
	cssRule('.author', 'color: ' + Scheme.Cyan[Bold] + '; width: 100px; display:inline-block; overflow: hidden;');

	cssRule('.message', 'color: ' + Scheme.White[Bold] + '; width: ' + messageWidth + 'px; display:inline-block; overflow: hidden;');
	cssRule('.selected', 'font-weight: bold; background-color:' + '#000' + ';'); //  font-size: larger;
}

function scrollGraphTo(row) {
	var y = t.length - row;
	// TODO set some limits
	// TODO add some easing
	timeline_panel.scrollTop = ROW_HEIGHT * y;
}

var selected = -1;




setWidth(innerWidth - 200);

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

	// Date order vs Ancestor order
	// timeline.sort(compare); // TODO Buggy, dont use


	// Graphing strategies
	// 1. pending parents first (gitk, jetbrains, git log --graph)
	// 2. Current node first, pending parents, remaining parents (sourcetree, gitx)
	// 3. Current parent, remaining parents, pending parents. (soucetree)
	// 4. Perhaps one which has a fill space algorithm

	// TODO Mouse over interactivity
	
	var p;

	function CommitPath(hash, row) {
		this.targetHash = hash; // hash for matching parent
		this.row = row; // commit sequence id
		this.length = 0;
	}

	var nodeTracks; // Track which lane the node is at for every row
	var tracks;

	this.selectRow = function selectRow(row) {
		selected = row;
		scrollGraphTo(row);
		this.draw();
	}

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

						tmp = currentPaths.shift();
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

	['div', 'canvas'].forEach(function(name) {
		self[name.toUpperCase()] = el(name);
	});

	function el(name) {
		return function(id) {
			var e = document.createElement(name);
			for (var i = 1; i < arguments.length; i++) {
				e.appendChild(arguments[i]);
			}
			e.id = id;
			self[id] = e;
			return e;
		};
	}

	function style(dom, o) {
		for (var k in o) {
			dom.style[k] = o[k];
		}
	}

	// <div id="timeline_panel">
	// 	<div id="sliding_window">
	// 		<div id="container"></div>
	// 	</div>

	// 	<div id="panel_spacer"></div>
	// </div>


	// var container, timeline_panel, panel_spacer, sliding_window, graph;

	DIV('gitgraph',
		DIV('timeline_panel',
			DIV('sliding_window',
				CANVAS('graph'),
				DIV('container')
			),
			DIV('panel_spacer')
		)
	);

	style(graph, {
		position: 'absolute'
	});

	style(container, {
		position: 'absolute',
		left: '120px',
		whiteSpace: 'nowrap',
		fontSize: '12px'
	});

	style(timeline_panel, {
		border: '1px solid white',
		height: '100%',
		overflow: 'auto',
		position: 'relative'
	});

	style(panel_spacer, {
		// height: '14000px'
	});

	style(sliding_window, {
		position: 'absolute',
		top: 0
	});

	style(gitgraph, {
		zIndex: '10',
		bottom: '0',
		left: '0',
		width: '100%',
		fontFamily: 'monospace',
		background: '#202020',
		color: '#979797',
		opacity: 1,
		position: 'absolute',
		height: '80%',
		transition: 'all 1s'
	});

	document.body.appendChild(gitgraph);

	container.style.left = (maxTracks + 2) * TRACK_WIDTH + 'px';

	// virtual height
	panel_spacer.style.height = ROW_HEIGHT * timeline.length + 'px';
	console.log('panel_spacer height' + panel_spacer.style.height, timeline.length, ROW_HEIGHT, ROW_HEIGHT * timeline.length);

	var sa, rows;

	// timeline_panel.clientHeight / timeline_panel.scrollHeight
	// panel_spacer.clientHeight / panel_spacer.scrollHeight

	function initDimensions() {
		// calculations for viewport or new row count changes.
		sa = panel_spacer.scrollHeight - timeline_panel.clientHeight;
		rows = sa / timeline_panel.scrollHeight * timeline.length; // actual scrollable rows
	}

	initDimensions();

	window.addEventListener('resize', function() {
		console.log('resizing');
		initDimensions(); // TODO rename to set height
		setWidth(innerWidth - 200);
	});

	timeline_panel.addEventListener('scroll', function(e) {
		// console.log('scroll', timeline_panel.scrollTop);
		var p = timeline_panel.scrollTop / sa; // percentage scrolled
		var sliding = timeline_panel.scrollTop % ROW_HEIGHT;

		sliding_window.style.top = timeline_panel.scrollTop - sliding + 'px'; //  - bufferRows * ROW_HEIGHT

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

	graph.width = (maxTracks + 1) * TRACK_WIDTH;
	graph.height = (targetRows + bufferRows * 2) * 25;
	
	var ctx = graph.getContext('2d');
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
			};
		})(j);
		
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
		ctx.clearRect(0, 0, graph.width, graph.height);
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
			window.d = d;
			var number = timeline.length-i;
			if (number == selected) {
				if (!d.classList.contains('selected')) {
					d.classList.add('selected');

				}
			} else {
				if (d.classList.contains('selected')) {
					d.classList.remove('selected');
				}
			}
			d.innerHTML = '<span class="id">%id</span>. <span class="hash">%hash</span> <span class="message">%message</span>  <span class="author">%author</span> <span class="time">%time</span>'
				.replace(/%id/, replacer(number))
				.replace(/%message/, replacer(commit.message))
				.replace(/%time/, replacer(new Date(commit.date * 1000).toDateString()))
				.replace(/%hash/, replacer(commit.hash))
				.replace(/%author/, replacer(commit.author));
		}

	}

}