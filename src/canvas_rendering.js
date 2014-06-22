
function paint() {
	ctx.save();
	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	//ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.translate(canvas.width/2, canvas.height/2);

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
		ctx.fill();
	}

	for (i=0;i<fileNodes.length;i++) {
		node = fileNodes[i];
		ctx.fillStyle = node.color;
		ctx.beginPath();
		ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
		ctx.fill();
	}

	ctx.restore();
}

function initDrawings() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	ctx = canvas.getContext('2d');

	// animate();
	setInterval(animate, 30);
}