

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

	ctx.scale(1.5, 1.5);
	// ctx.font = '8pt Arial';
	ctx.textBaseline = 'ideographic';
	ctx.globalCompositeOperation = 'lighter';

	var node, link;
	var selected = null, label;

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
		ctx.globalAlpha = 0.2;
		ctx.beginPath();
		// TODO 5, 15, children size, or grandchildren size
		var size = distanceForChildren(node.children) * 2;
		ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
		ctx.fill();
		ctx.globalAlpha = 1;

		if (ctx.isPointInPath(mouseX, mouseY)) {
			ctx.fillStyle = 'white';

			selected = node;

			label = node.name.split('/');
			label = label[label.length - 2] || 'three.js';

			// if (mouseDown) removeNode(fs.index[node.name], node);

		}

		label = node.name.split('/');
		label = label[label.length - 2] || 'three.js';
		labelNode(node, label, false);
		
	}

	for (i=0;i<fileNodes.length;i++) {
		node = fileNodes[i];
		ctx.fillStyle = node.color;
		ctx.beginPath();
		ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
		ctx.fill();
		if (ctx.isPointInPath(mouseX, mouseY)) {
			
			label = node.name.substring(node.name.lastIndexOf('/') + 1);
			selected = node;

			// if (mouseDown) removeNode(fs.index[node.name], node);
		}
		
	}


	if (selected) {
		labelNode(selected, label, true);
	}

	ctx.restore();
}


function labelNode(node, label, bubble) {
	var r = 10;
	var width = ctx.measureText(label).width * 1;
	var height = 10;

	ctx.fillStyle = '#fff';

	if (bubble) {
		ctx.beginPath();
		ctx.moveTo(node.x, node.y - height);
		ctx.lineTo(node.x + width, node.y - height);
		ctx.quadraticCurveTo(node.x + width + r, node.y - height, node.x + width + r, node.y);
		ctx.quadraticCurveTo(node.x + width + r, node.y + height, node.x + width, node.y + height);
		ctx.lineTo(node.x, node.y + height);
		ctx.quadraticCurveTo(node.x - r, node.y + height, node.x - r, node.y);
		ctx.quadraticCurveTo(node.x - r, node.y - height, node.x, node.y - height);

		ctx.closePath();
		ctx.fill();

		ctx.fillStyle = 'black';
	}

				
	ctx.beginPath();
	ctx.fillText(label, node.x + 5, node.y + 5);

	ctx.fillStyle = node.color;
	ctx.beginPath();
	ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
	ctx.fill();
}

var mouseX = 0, mouseY = 0, mouseDown = false;

function onMouseMove(e) {
	mouseX = e.offsetX;
	mouseY = e.offsetY;
}

function onMouseDown(e) {
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