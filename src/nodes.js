var allnodes = [];
// var material = new THREE.MeshBasicMaterial( {color: new THREE.Color( 0xff0000 )} );

// mixin of a TreeNode (file system representation) and a Three.js object
var TreeNodeMixin = {
	init2: function(name) {
		this.name = name;
		this.fsChildren = {};
		this.fsFiles = [];
		this.fsFolders = [];

		this.position2 = new THREE.Vector3();

		var geo = new THREE.Geometry();
		geo.vertices.push(new THREE.Vector3( 0, 0, 0 ));
		this.start = new THREE.Vector3( 2, 2, 0 );
		geo.vertices.push(this.start);

		this.line = new THREE.Line(geo, lineMaterial);
		this.add(this.line);

		this.box = new THREE.Box3();
		this.radius = 10;
		this.history = [];
	},

	initPos: function(x, y, z) {
		this.position2.set(x, y, z);
		this.position.set(x, y, z);
	},

	get: function(path) {
		return this.fsChildren[path];
	},

	getOrCreate: function(path) {
		var node = this.get(path);
		if (!node) {
			node = this.create(path);
		}
		return node;
	},

	create: function(path) {
		var node;
		if (path.charAt(path.length-1)=='/') {
			node = new TreeNode(path);
		} else {
			node = new FileNode(path, plane, materials[Math.random() * materials.length]);
		}

		this.add(node);
		this.fsChildren[path] = node;
		allnodes.push(node);

		if (node instanceof FileNode) {
			this.fsFiles.push(node);
		} else if (node instanceof TreeNode) {
			this.fsFolders.push(node);
		}

		return node;
	},

	rm: function(name) {
		var node = this.fsChildren[name];
		if (!node) console.log('warning, cant remove', name);
		delete this.fsChildren[name];

		this.remove(node);
		if (node instanceof FileNode) {
			this.fsFiles.splice(this.fsFiles.indexOf(node), 1);
		} else if (node instanceof TreeNode) {
			this.fsFolders.splice(this.fsFolders.indexOf(node), 1);
		}
		allnodes.splice(allnodes.indexOf(node), 1);
	},

	ls: function() {
		var names = [];
		for (var i in this.fsChildren) {
			names.push(this.fsChildren[i].name);
		}
		return names;
	},

	isDir: function() {
		return this.name.charAt(this.name.length-1) == '/';
	},

	isEmpty: function() {
		return this.ls().length == 0;
	},

	addPath: function(filename) {
		var paths, i, il, path, node;
		paths = filename.split('/');
		node = this; // start
		for (i=0, il=paths.length;i<il;i++) {
			path = paths[i];
			if (i<il-1) {
				node = node.getOrCreate(path + '/');
			} else {
				node = node.getOrCreate(path);
			}
		}
		return node;
	},

	getPath: function(filename) {
		var paths, i, il, path, node, tmp;
		paths = filename.split('/');
		node = this; // start
		for (i=0, il=paths.length;i<il;i++) {
			path = paths[i];
			tmp = node.get(path + '/');
			if (tmp) {
				node = tmp;
			} else {
				node = node.get(path);
			}
		}
		return node;
	},

	removePath: function(filename) {
		// traverse in and remove by layer.
		var paths, i, il, path, node;
		paths = filename.split('/');
		node = this;
		var nodes = [node];
		for (i=0, il=paths.length;i<il;i++) {
			path = paths[i];
			if (i<il-1) {
				node = node.get(path + '/'); // getOrCreate get
			} else {
				node = node.get(path);
			}
			if (!node) console.log('cant find node', path, paths);
			nodes.push(node);
		}
		var parent;
		for (i=nodes.length;i-- > 1;) {
			node = nodes[i];
			parent = nodes[i-1]
			parent.rm(node.name);
			if (!parent.isEmpty()) break;
		}

	},

	simulate: function() {
		var child, children = this.children;
		var files = this.fsFiles;
		var folders = this.fsFolders;
		var i, il, j;

		for (i=folders.length;i--;) {
			child = folders[i];
			child.simulate();
		}

		var n, n2;
		var d;


		integrate(files, true);
		constrains(files);

		var radius = Math.sqrt(files.length) * 10;

		integrate(folders, false);

		// for (i=nodes.length; i--; ) {
		// 	n1 = nodes[i];

		// 	sd2 = radius * radius;
		// 	current_d = (n1.position.x * n1.position.x +  n1.position.y * n1.position.y);
		// 	(sd2 - current_d ) /sd2 * sometjing
		// }

		// this.box.makeEmpty();

		// for (i=files.length;i--;) {

		// 	this.box.expandByPoint(files[i].position);

		// }

		// var radius = Math.max(this.box.max.distanceTo(this.box.min), 10);

		// constrains(folders, 1/200, radius);

		// for (i=folders.length;i--;) {

		// 	this.box.expandByPoint(folders[i].position);

		// }

		// this.radius = Math.max(this.box.max.distanceTo(this.box.min), 10);

	}
};

var DAMPING = 0.02;
var K = 0.5;
var SL = 1 * K ;

// Constrains
// Integrate


// function gravity(nodes) {

// 	var dx, dy, k;

// 	for (i=nodes.length; i--; ) {
// 		n = nodes[i];


function integrate(nodes, gravity) {

	var dx, dy, k;

	for (i=nodes.length; i--; ) {
		n = nodes[i];

		dx = n.position.x - n.position2.x;
		dy = n.position.y - n.position2.y;

		if (gravity) {
			// Gravity
			k = -0.001 * K;
			dx += n.position.x;
			dy += n.position.y;
		}

		// Damping
		dx *= 1 - DAMPING * K;
		dy *= 1 - DAMPING * K;

		// Speed Limits

		n.position.x -= n.position.x * 0.5;
		n.position.y -= n.position.y * 0.5;


		if (Math.abs(dx) > SL) dx = dx / Math.abs(dx) * SL;
		if (Math.abs(dy) > SL) dy = dy / Math.abs(dy) * SL;

		n.position2.x = n.position.x;
		n.position2.y = n.position.y;

		n.position2.copy( n.position );

		n.position.x = n.position2.x + dx;
		n.position.y = n.position2.y + dy;
	}

}

function constraining(n1, n2, sd2, stiffness, any) {
	var dx, dy, k;
	var mx, my;

	dx = n.position.x - n2.position.x;
	dy = n.position.y - n2.position.y;
	d2 = dx * dx + dy * dy;

	if (d2 == 0) {
		d2 = 0.001;
	}

	if (any || (d2 < sd2)) {

		sd = (sd2 - d2) / d2 * stiffness;
		// (Math.random() < 0.01) && console.log(sd);

		// sd = (sd - d) / d * 0.5 * K;
		mx = sd * dx;
		my = sd * dy;

		// sd = sd - d;
		// mx = dx / d * sd * 0.45 * K;
		// my = dy / d * sd * 0.45 * K;

		n1.position.x += mx;
		n1.position.y += my;
		n2.position.x -= mx;
		n2.position.y -= my;


	}
}

function constrains(nodes, force, distance) {

	var dx, dy, k, n1, n2;
	var d2, sd, sd2;
	for (i=nodes.length; i--; ) {
		n1 = nodes[i];
		for (j=nodes.length;j-- > i;) {
			n2 = nodes[j];

			sd = n1.radius + n2.radius;
			sd *= 1.2;
			sd2 = sd * sd;
			constraining(n1, n2, sd2, 0.24 * K)

		}
	}
}

function mixin(o, type) {
	var newType = o.init;
	newType.prototype = Object.create( type.prototype );
	for (var i in o) {
		if (i!=='init')
			newType.prototype[i] = o[i];
	}
	return newType;
}

FileNodeMixin = {};
for (var i in TreeNodeMixin) {
	FileNodeMixin[i] = TreeNodeMixin[i];
}

TreeNodeMixin.init = function(name) {
	THREE.Object3D.call( this );
	this.init2(name);
}

FileNodeMixin.init = function(name, geometry, material) {
	THREE.Mesh.call( this, geometry, material );
	this.init2(name);
}

TreeNode = mixin(TreeNodeMixin, THREE.Object3D);
FileNode = mixin(FileNodeMixin, THREE.Mesh);