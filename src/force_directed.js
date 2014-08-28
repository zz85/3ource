'use strict';

var nodes = []; // list of all graph nodes (directory)
var links = []; // list of gLink constrained edges (FOLDERS to Parents)
var clusters = []; // list for parent-children links (FILES to Folders)
var fileNodes = []; // Just graph nodes for FILES.

var DAMPING = 0.96;
var SPEED_LIMIT = 5;

var cache = {};

var tmpLink = new gLink();

function CirclePacking() {
	var TARGET = 1550;
	var SIZE = 5;
	var PADDING = 2;
	var STAGGER = 0; // 0 - 3

	var space = SIZE * 2 + PADDING;
	var PI2 = Math.PI * 2;

	var i, j = 0;
	var count = 0, counting, target;

	var points = [];

	this.getPoint = function(target, which) {

		if (cache[target + '.' + which]) return cache[target + '.' + which];
		counting = 1;
		if (which == 0) return {x: 0, y: 0};

		var offset = Math.PI / 3;

		var rings = 1, total = 1;

		while (total < target) {
			total += rings * 6;
			rings++;
		} 

		// console.log('ring', rings, 'total', total);

		total = 1;
		for (var ring = 1; ring < rings; ring++) {
			var l = 6 * ring;
			total += l;

			if (target < total) {
				l = l - (total - target)
				// l = Math.max(l - (total - target), 3, l / 3);
			}

			switch (STAGGER) {
				case 0:
					break;
				case 1:
					if (ring > 1) {
						offset += 0.5 * PI2 / (ring - 1) / 6;
					}
					break;
				case 2:
					if (ring % 2 !== 0) {
						offset = PI2 * 0.5 / l;
					} else {
						offset = 0;
					}
					break;
				case 3:
					// pseudo random entry
					if (ring > 1) offset += PI2 / (ring - 1);
					break;
			}

			for (i=0;i<l;i++) {

				var angle = i * PI2 / l;
				angle += offset;

				// console.log('counting', counting, 'target', target);

				if (counting == which) {
					var x = Math.sin(angle) * space * ring;
					var y = Math.cos(angle) * space * ring;
					cache[target + '.' + which] = {x: x, y: y};

					return {x: x, y: y};

				}


				counting++;
				if (counting > target) break;
			}
		}
	};
}


var p = {};
function distanceForChildren(c) {
	if (c == 0) return 10;
	var p = packing.getPoint(c, c - 1, p);
	return (Math.sqrt(p.x * p.x + p.y * p.y)  + 5) * 0.7;
}

var packing = new CirclePacking();

function onNodeAdd(node) {
	var graphNode = newNode(node.fullPath(), node.isFile(), this.graphNode.x, this.graphNode.y);
	node.graphNode = graphNode;
	newEdge(this.graphNode, node.graphNode, node.isFile());

	node.onAdd.do(onNodeAdd);
	node.onRemove.do(onNodeRemove);
}

function onNodeRemove(node) {
	// Handle node removal
	node.onAdd.undo(onNodeAdd);
	node.onRemove.undo(onNodeRemove);
	removeNode(node, node.graphNode);
}

function gNode(name, f, x, y) {
	if (!x) x = 0;
	if (!y) y = 0;
	this.file = f;
	x += (Math.random() - 0.5) * 5;
	y += (Math.random() - 0.5) * 5;
	this.name = name;
	this.x = x;
	this.y = y;
	this.x2 = x;
	this.y2 = y;
	this.dx = 0;
	this.dy = 0;
	this.color = '#' + (~~(Math.random() * 0xfff)).toString(16);
	this.children = 0;
}

function gLink(node1, node2, distance) {
	// constrains
	this.distance = distance ? distance : 50 ;
	this.from = node1;
	this.to = node2;
}

function getDistance(t) {
	p = packing.getPoint(t, t-1, p);
	if (p) {
		var d = Math.sqrt(p.x * p.x + p.y + p.y);
		return d;
	}
	return 0;
}

gLink.prototype.resolve = function() {
	var node1 = this.from;
	var node2 = this.to;

	var cx = node2.x - node1.x;
	var cy = node2.y - node1.y;

	var distance = this.distance;

	distance = 1;
	distance += getDistance(node1.total);
	distance += getDistance(node2.total);
	distance *= 2;
	// console.log(link.distance)

	var lengthSquared = cx * cx + cy * cy;
	if (lengthSquared === 0) return;

	var cl = Math.sqrt(lengthSquared);
	var k, mx, my;
	k = (distance - cl) / distance;

	if (k > 0) return;

 	var mul = 0.01;
	//cl = 1000
	mx = k * cx * distance / cl * mul;
	my = k * cy * distance / cl * mul;

	
	node1.dx -= mx;
	node1.dy -= my;
	node2.dx += mx;
	node2.dy += my;
	/*
	node1.x -= mx;
	node1.y -= my;
	node2.x += mx;
	node2.y += my;
	*/
};

function gravity(nodes, x, y) {
	var i, j, node;
	var cx, cy, cl;
	for (i=nodes.length; i--;) {
		node = nodes[i];

		cx = x - node.x;
		cy = y - node.y;
		cl = Math.sqrt(cx * cx + cy * cy);
		if (cl === 0) continue;

		// linear velocity towards center
		node.dx += cx / cl * 0.05;
		node.dy += cy / cl * 0.05;
		// node.dx += cx / cl * 0.1 * (node.children * 0.1 + 1);
		// node.dy += cy / cl * 0.1 * (node.children * 0.1 + 1);
	}
}

function graivateTo(node, x, y) {
	var cx, cy, cl;

	cx = x - node.x;
	cy = y - node.y;
	cl = Math.sqrt(cx * cx + cy * cy);
	if (cl === 0) return;

	node.x += cx * 0.1;
	node.y += cy * 0.1;

	// node.dx += cx / cl * 0.1;
	// node.dy += cy / cl * 0.1;
}

function repel() {
	// repel clusters

	var node1, node2;
	var cx, cy, cl2, cl;
	var i, j;
	var mul, mx, my;

	for (i=nodes.length; i--;) {
		node1 = nodes[i];

		for (j=i; j--;) {
			node2 = nodes[j];

			cx = node2.x - node1.x;
			cy = node2.y - node1.y;
			cl2 = cx * cx + cy * cy;

			// skip if too far away			
			if (cl2 > 200 * 200) continue;

			var d = 2 + getDistance(node1)
			+ getDistance(node2);

			var d2 = d * d;
			var d3 = cl2 < d2 ? 0.1: cl2 - d2;
			
			if (true || cl2 < d2) {
				// if (cl < d) b = d * 100;
				/*
				tmpLink.distance = d;
				tmpLink.from = node1;
				tmpLink.to = node2;
				tmpLink.resolve(); 
				*/
				var k = 50 * 1 / d3;
				
				mx = cx * k;
				my = cy * k;

				node1.dx -= mx ;
				node1.dy -= my ;

				node2.dx += mx;
				node2.dy += my;
				
				/*
				var k = ((cl - d) / d * 0.1) * cl ;
				//  / b 


				mx = cx / cl * k;
				my = cy / cl * k;

				node1.dx -= mx ;
				node1.dy -= my ;

				node2.dx += mx;
				node2.dy += my;
				*/

			}



			// if (cl2 < 100000) {
			// 	// cl = Math.sqrt(cl2);
			// 	cl = cl2;
			// 	mx = cx / cl * mul;
			// 	my = cy / cl * mul;

			// 	node1.dx -= mx * m1;
			// 	node1.dy -= my * m1;

			// 	node2.dx += mx * m2;
			// 	node2.dy += my * m2;
				
			// }
		}
	}

}

function simulate() {
	var node;

	// Move all nodes towards the center
	gravity(nodes, 0, 0);

	var link, i;

	// Reset counters
	for (i=nodes.length; i-- > 0;) {
		nodes[i].children = 0;
		nodes[i].total = 0;
	}

	// Counting
	for (i=clusters.length; i-- > 0;) {
		link = clusters[i];
		link.from.total++;
	}

	// Cluster == folder of files.
	// var ax = 0, ay = 0;

	var p = {};
	for (i=clusters.length; i-- > 0;) {
		link = clusters[i];
		var c = link.from.children++;
		p = packing.getPoint(link.from.total, c, p);

		graivateTo(link.to, link.from.x + p.x, link.from.y + p.y);
	}

	// Move all folders within distance of each other
	for (i=links.length; i-- > 0;) {
		link = links[i];
		link.resolve();
	}


	// Move all nodes away from each other. Only folder nodes are updated.
	repel();

	// move
	for (i=nodes.length; i--;) {
		node = nodes[i];
		// if (node.file) continue;

		// Damping, speed limits.
		node.x += node.dx;
		node.y += node.dy;

		node.dx *= DAMPING;
		node.dy *= DAMPING;

		node.dx = node.dx > SPEED_LIMIT ? SPEED_LIMIT : node.dx < - SPEED_LIMIT ? - SPEED_LIMIT : node.dx;
		node.dy = node.dy > SPEED_LIMIT ? SPEED_LIMIT : node.dy < - SPEED_LIMIT ? - SPEED_LIMIT : node.dy;
	}

}

