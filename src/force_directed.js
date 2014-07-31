var nodes = []; // list of all graph nodes
var links = []; // list of all constrained edges
var clusters = []; // list for parent-children links
var fileNodes = [];

var DAMPING = 0.96;
var SPEED_LIMIT = 10;

function CirclePacking() {
	var TARGET = 1550;
	var SIZE = 5;
	var PADDING = 2;
	var STAGGER = 1; // 0 - 3

	var space = SIZE * 2 + PADDING;
	var PI2 = Math.PI * 2;

	var i, j = 0;
	var count = 0, counting, target;

	var points = [];

	this.getPoint = function(target, which) {
		counting = 1;
		if (which == 0) return {x: 0, y: 0};

		var offset = 0;

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
				l = Math.max(l - (total - target), 3, l / 3);
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
					return {x: x, y: y};

				}


				counting++;
				if (counting > target) break;
			}
		}
	};
}



function distanceForChildren(c) {
	if (c == 0) return 10;
	var p = packing.getPoint(c, c - 1);
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
	// distance += distanceForChildren(Math.max(node1.children, 1)) + distanceForChildren(Math.max(node2.children, 1))  * 1.5;

	var lengthSquared = cx * cx + cy * cy;
	if (lengthSquared === 0) return;

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
		node.dy += cy / cl * 0.1;
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

function simulate() {

	repel(nodes);
	gravity(nodes, 0, 0);

	var link, i;
	for (i=links.length; i-- > 0;) {
		link = links[i];
		link.resolve();
	}

	for (i=nodes.length; i-- > 0;) {
		nodes[i].children = 0;
		nodes[i].total = 0;
	}

	for (i=clusters.length; i-- > 0;) {
		link = clusters[i];
		link.from.total++;
	}

	for (i=clusters.length; i-- > 0;) {
		link = clusters[i];
		var c = link.from.children++;
		var p = packing.getPoint(link.from.total, c);

		gravityNode(link.to, link.from.x + p.x, link.from.y + p.y);
	}

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

