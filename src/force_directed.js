var fs = new FS();
var nodes = [];
var links = [];

var u = 0;
function onNodeAdd(node) {
	// if (node.isFile()) return;
	//console.log(++u);
	var graphNode = newNode(node.name, node.isFile(), this.graphNode.x, this.graphNode.y); // node.name
	node.graphNode = graphNode;
	node.onAdd.do(onNodeAdd);

	newEdge(this.graphNode, node.graphNode, node.isFile() ? 0.5 : 50, node.isFile());

}

function onNodeRemove(node) {
	// TODO handle node removal
	// graph.removeNode(node.graphNode);
}

var dnode = 0;
fs.root.graphNode = newNode('.');

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
	var lengthSquared = cx * cx + cy * cy;
	if (lengthSquared==0) return;

	var cl = Math.sqrt(lengthSquared);
	var k, mx, my;
	k = (distance - cl) / distance;
  var mul = 0.015;
	mx = k * cx * distance / cl * mul;
	my = k * cy * distance / cl * mul;

	// mx = 10 / d2 * 2 ;
	// my = 10 / d2 * 2 ;
	node1.dx -= mx;
	node1.dy -= my;
	node2.dx += mx;
	node2.dy += my;

};

function gravity(nodes, x, y) {
	var i, j, node;
	var cx, cy, cl;
	for (i=nodes.length; i--;) {
		node = nodes[i];

		cx = node.x;
		cy = node.y;
		cl = Math.sqrt(cx * cx + cy * cy);
		if (cl == 0) continue;

		node.dx -= cx / cl * 0.01;
		node.dy -= cy / cl * 0.01;
	}
}

function repel(node1, node2) {
	var cx, cy, cl2, cl;

	for (i=nodes.length; i--;) {
		node1 = nodes[i];

		for (j=i; j--;) {
			node2 = nodes[j];

      mul = node1.file && node2.file ?  0.5: 1.2 - 0.5;
			// if (!node1.file || !node1.file) continue;
			// mul = 1.2;

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

				node1.dx -= mx;
				node1.dy -= my;
				node2.dx += mx;
				node2.dy += my;
			}
		}
	}

}

/* Graph functions */
function newNode(name, group, x, y) {
	var node = new gNode(name, group, x, y);
	nodes.push(node);
	return node;
}

function newEdge(node1, node2, distance, hidden) {
	links.push(new gLink(node1, node2, distance, hidden));
}

fs.root.onAdd.do(onNodeAdd);
fs.root.onRemove.do(onNodeRemove);

var z = 0;
files.forEach(function(file) {
	z++;
	// if (z > 200) return;
	// fs.touch(file);

	setTimeout(function() {
		fs.touch(file);
		console.log(z);
	}, 10 * z);
});

canvas.width = innerWidth;
canvas.height = window.innerHeight;

ctx = canvas.getContext('2d');

function siate() {

	repel(nodes);
	//gravity(nodes, 0, 0);

	var link;
	for (i=links.length; i--;) {
		link = links[i];
		link.resolve();
	}

  var DAMPING = 0.96;

	// move
	for (i=nodes.length; i--;) {
		node = nodes[i];

		// Damping, speed limits.
		node.x += node.dx;
		node.y += node.dy;

		node.dx *= DAMPING;
		node.dy *= DAMPING;

		// d.dx = d.dx > 0 ? Math.min(10, d.dx) : Math.max(-10, d.dx);
		// d.dy = d.dy > 0 ? Math.min(10, d.dy) : Math.max(-10, d.dy);
	}

}

function paint() {
	ctx.save();
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
	//ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.translate(canvas.width/2, canvas.height/2);

	var node, link;

  ctx.strokeStyle = '#fff';
	for (i=0;i<links.length;i++) {
		link = links[i];

		if (link.hidden) continue;
		ctx.moveTo(link.from.x, link.from.y);
		ctx.lineTo(link.to.x, link.to.y);
		ctx.stroke();
	}

	for (i=0;i<nodes.length;i++) {
		node = nodes[i];
		ctx.fillStyle = node.color;
		ctx.beginPath();
		ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
		ctx.fill();
	}

	ctx.restore();
}


function animate() {
	siate();

	if (Math.random() > 0.8)
	paint();
}


// animate();
setInterval(animate, 50);
