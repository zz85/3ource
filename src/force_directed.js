var nodes = []; // list of all graph nodes
var links = []; // list of all constrained edges
var clusters = []; // list for parent-children links
var fileNodes = [];

function onNodeAdd(node) {
	var graphNode = newNode(node.name, node.isFile(), this.graphNode.x, this.graphNode.y);
	node.graphNode = graphNode;
	newEdge(this.graphNode, node.graphNode, node.isFile());	

	node.onAdd.do(onNodeAdd);
}

function onNodeRemove(node) {
	// TODO handle node removal
	// graph.removeNode(node.graphNode);
}

function gNode(name, f, x, y) {
	if (!x) x = 0;
	if (!y) y = 0;
	this.file = f;
	x += (Math.random() - 0.5) * 4;
	y += (Math.random() - 0.5) * 4;
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

function gLink(node1, node2, distance, hidden) {
	// constrains
	this.distance = distance ? distance : 50 ;
	this.from = node1;
	this.to = node2;
	this.hidden = hidden;
}

gLink.prototype.resolve = function() {
	var node1 = this.from;
	var node2 = this.to;

	var cx = node2.x - node1.x;
	var cy = node2.y - node1.y;

	var distance = this.distance;
	distance += Math.max(distanceForChildren(node1.children) * 2, distanceForChildren(node2.children) * 2);
	// distance += distanceForChildren(Math.max(node1.children, 1)) + distanceForChildren(Math.max(node2.children, 1));

	var lengthSquared = cx * cx + cy * cy;
	if (lengthSquared==0) return;

	var cl = Math.sqrt(lengthSquared);
	var k, mx, my;
	k = (distance - cl) / distance;
 	var mul = 0.015;
	mx = k * cx * distance / cl * mul;
	my = k * cy * distance / cl * mul;

	node1.dx -= mx;
	node1.dy -= my;
	node2.dx += mx;
	node2.dy += my;

	// node1.dx -= mx * 1 / (node1.children + 1);
	// node1.dy -= my * 1 / (node1.children + 1);
	// node2.dx += mx * 1 / (node2.children + 1);
	// node2.dy += my * 1 / (node2.children + 1);

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

		node.dx += cx / cl * 0.1;
		node.dy += cy / cl * 0.1 * (node.children * 0.1 + 1);
		// node.dx += cx / cl * 0.1 * (node.children * 0.1 + 1);
		// node.dy += cy / cl * 0.1 * (node.children * 0.1 + 1);
	}
}

function gravityNode(node, x, y) {
	var cx, cy, cl;

	cx = x - node.x;
	cy = y - node.y;
	cl = Math.sqrt(cx * cx + cy * cy);
	if (cl === 0) return;

	node.x += cx * 0.3;
	node.y += cy * 0.3;


	// node.dx += cx / cl * 0.1;
	// node.dy += cy / cl * 0.1;
}

function repel(node1, node2) {
	var cx, cy, cl2, cl;

	for (i=nodes.length; i--;) {
		node1 = nodes[i];

		for (j=i; j--;) {
			node2 = nodes[j];

			mul = 1; //node1.file && node2.file ?  0.5: 1.2 - 0.5;
			// mul += (node1.children + node2.children) * 0.1;

			//var m1 = m2 = 1 + (node1.children + node2.children) * 0.6;
			var m1 = node2.children * 0.8 + 1;
			var m2 = node1.children * 0.8 + 1;
			// m1 = mul * 1;
			// m2 = mul * 1;

			// if (!node1.file || !node1.file) continue;
			// mul = 1.2;
			// var m1 = node1.

			cx = node2.x - node1.x;
			cy = node2.y - node1.y;
			cl2 = cx * cx + cy * cy;

			if (!cl) {
				cx = Math.random() - 0.5;
				cy = Math.random() - 0.5;
				cl = 1;
			}

			if (cl2 < 100000) {
				// cl = Math.sqrt(cl2);
				cl = cl2;
				mx = cx / cl * mul;
				my = cy / cl * mul;

				if (!node1.file) {
					node1.dx -= mx * m1;
					node1.dy -= my * m1;
				}

				if (!node2.file) {
					node2.dx += mx * m2;
					node2.dy += my * m2;
				}
			}
		}
	}

}

function distanceForChildren(c) {
	return Math.pow((17 + c) * 1.618, 0.8);
}

function simulate() {

	repel(nodes);
	gravity(nodes, 0, 0);

	var link, i;
	for (i=links.length; i-- > 0;) {
		link = links[i];
		link.resolve();
	}

	for (i=nodes.length; i-- > 0;) {
		nodes[i].count = 0;
	}

	for (i=clusters.length; i-- > 0;) {
		link = clusters[i];
		var c = link.from.count++;
		var d = distanceForChildren(c);
		c = (16 + c) * 1.618 / 2;

		gravityNode(link.to, link.from.x + Math.cos(c) * d, link.from.y + Math.sin(c) * d);

	}

	var DAMPING = 0.96;
	var SPEED_LIMIT = 5;

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

function initSimulations() {
	var fs = new FS();
	fs.root.graphNode = newNode('.');

	fs.root.onAdd.do(onNodeAdd);
	fs.root.onRemove.do(onNodeRemove);

	var z = 0;
	files.forEach(function(file) {
		z++;
		// if (z > 500) return;
		// fs.touch(file);

		setTimeout(function() {
			fs.touch(file);
			console.log(z);
		}, 10 * z);
	});
}

function init() {
	initDrawings();
	initSimulations();
}

init();
