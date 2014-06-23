

/* Graph functions */
function newNode(name, isFile, x, y) {
	var node = new gNode(name, isFile, x, y);
	if (isFile) {
		fileNodes.push(node);
	} else {
		nodes.push(node);
	}

	return node;
}

function newEdge(parent, child, isFile) {
	var distance = isFile ? 0.5 : 10;
	if (isFile) {
		clusters.push(new gLink(parent, child, distance, isFile));
	} else {
		links.push(new gLink(parent, child, distance, isFile));
	}
}

function removeNode(node, graphNode) {
	var indexOf, i;
	if (node.isFile()) {
		indexOf = fileNodes.indexOf(graphNode);
		if (indexOf<0) {
			console.warn('Cannot find index in fileNodes');
		}
		fileNodes.splice(indexOf, 1);

		for (i=clusters.length; i-- > 0;) {
			if (clusters[i].to == graphNode) {
				clusters.splice(i, 1);
			}
		}

	} else {
		indexOf = nodes.indexOf(graphNode);
		if (indexOf<0) {
			console.warn('Cannot find index in nodes');
		}
		nodes.splice(indexOf, 1);

		for (i=links.length; i-- > 0;) {
			if (links[i].to == graphNode) {
				links.splice(i, 1);
			}
		}
	}
}


function paint() {
	ctx.save();
	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	//ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.translate(canvas.width/2, canvas.height/2);

	ctx.scale(3, 3);

	var node, link;

	ctx.strokeStyle = '#ccc';
	ctx.lineWidth = 2;
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
		if (ctx.isPointInPath(mouseX, mouseY)) {
			console.log(node.name);

			// TODO node.name.lastIndexOf('/') make label
		}
		if (mouseDown && ctx.isPointInPath(mouseX, mouseY)) {
			removeNode(fs.index[node.name], node);
		}
		ctx.fill();
	}

	for (i=0;i<fileNodes.length;i++) {
		node = fileNodes[i];
		ctx.fillStyle = node.color;
		ctx.beginPath();
		ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
		if (ctx.isPointInPath(mouseX, mouseY)) {
			console.log(node.name);
		}
		if (mouseDown && ctx.isPointInPath(mouseX, mouseY)) {
			removeNode(fs.index[node.name], node);
		}
		ctx.fill();
	}

	ctx.restore();
}

var mouseX = 0, mouseY = 0, mouseDown = false;

function onMouseMove(e) {
	mouseX = e.offsetX;
	mouseY = e.offsetY;
}

function onMouseDown(e) {
	console.log('down');
	mouseDown = true;
}

function onMouseUp(e) {
	mouseDown = false;
}

function initDrawings() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	canvas.addEventListener('mousemove', onMouseMove);
	canvas.addEventListener('mousedown', onMouseDown);
	canvas.addEventListener('mouseup', onMouseUp);

	ctx = canvas.getContext('2d');

	// animate();
	setInterval(animate, 30);
}

function animate() {
	simulate();

	// if (Math.random() > 0.8)
		paint();
}