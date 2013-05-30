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
		// this.position.dx = Math.random() - .5;
		// this.position.dy = Math.random() - .5;
		// this.position2.copy(this.position);

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
		// n = this;
		// n.position.dx -= n.position.x * 0.001;
		// n.position.dy -= n.position.y * 0.001;
		var d;

		layout(files, 1/8000, 10);

		this.box.makeEmpty();

		for (i=files.length;i--;) {

			this.box.expandByPoint(files[i].position);

		}

		var radius = Math.max(this.box.max.distanceTo(this.box.min), 10);

		layout(folders, 1/200, radius);

		for (i=folders.length;i--;) {

			this.box.expandByPoint(folders[i].position);

		}

		this.radius = Math.max(this.box.max.distanceTo(this.box.min), 10);

	}
};

function layout(files, force, distance) {
	for (i=files.length; i--; ) {
		n = files[i];

		n.position.x -= n.position.x * 0.5;
		n.position.y -= n.position.y * 0.5;


		// Gravity towards center
		// n.position.dx -= n.position.x * 0.001;
		// n.position.dy -= n.position.y * 0.001;

		tmp.set(n.position.x, n.position.y, 0);
		d = tmp.length();
		tmp.multiplyScalar(force / d * 10);
		if (d<distance) tmp.multiplyScalar(-1);

		// if (d>distance) {
			n.position.dx -= tmp.x;
			n.position.dy -= tmp.y;
		// }


		for (j=0;j<i;j++) {
			n2 = files[j];
			if (i==j) continue;
			// Forces away from each other

			distance = Math.max(n.radius, n2.radius, 10);
			// (Math.random() < 0.001) && console.log(distance);

			tmp.subVectors(n2.position, n.position);
			d = tmp.length();
			tmp.normalize().multiplyScalar(d/distance);

			if (d < distance) {
				tmp.multiplyScalar(-1 );
				// n2.position.add(tmp);
				// n.position.sub(tmp);
			}

			n2.position.dx += tmp.x;
			n2.position.dy += tmp.y;
			n.position.dx -= tmp.x;
			n.position.dy -= tmp.y;

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