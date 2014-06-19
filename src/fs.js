/* Provides scene graph of file system */
function FS() {
	this.root = new iNode('./');
	this.index = {}; // quick directory cache
}

FS.prototype.touch = function(path) {
	var parts = path.split('/');
	var file = parts.pop();

	var node = this.root;
	var created;
	var index = this.index;
	parts.forEach(function(part) {
		part = part + '/';

		if (!node.exists(part)) {
			// Create new node
			created = new iNode(part, node);
			index[created.fullPath()] = created;
		}

		node = node.traverse(part);
	});

	if (!node.exists(file)) {
		created = new iNode(file, node);
		index[created.fullPath()] = created;
	}
};

FS.prototype.rm = function(path) {
	var node = this.find(path);
	
	while (node.parent) {
		var fp = node.fullPath();
		node.remove();
		delete this.index[fp];

		node = node.parent;
		if (!node.empty()) break;
	}
};

FS.prototype.find = function(path) {
	var node = this.index['./' + path];
	if (!node) {
		conole.warn('Cant find path', path);
	}

	return node;
};

FS.prototype.mv = function(path) {
	// TOOD implement rename

	var node = this.find(path);
	var originPath = node.fullPath();
};

/*
 * Do.js - Simple Event Listener/Dispatcher System
 */
function Do(parent) {
	var listeners = [];
	this.do = function(callback) {
		listeners.push(callback);
	};
	this.undo = function(callback) {
		listeners.splice(listeners.indexOf(callback), 1);
	};
	this.notify = function() {
		for (var v = 0; v<listeners.length; v++) {
			listeners[v].apply(parent, arguments);
		}
	};
}

/*
 iNode is either a file or directory,
 interacts with itself, parents or children
*/

function iNode(name, parent) {
	this.name = name;
	this.parent = parent;

	this.directory = this.name.substr(-1) == '/';
	this.children = {};

	this.onAdd = new Do(this);
	this.onRemove = new Do(this);

	if (parent) {
		parent.children[name] = this;
		this.parent.onAdd.notify(this);
	}

}

iNode.prototype.rm = function() {
	if (this.parent) return false;
	if (this.isDirectory()) {
		if (this.isEmpty()) {
			console.warn('Directory not empty');
			return false;
		}
	}
	// Detach from parent
	delete this.parent.children[this.name];
	return true;
}

iNode.prototype.exists = function(name) {
	return name in this.children;
};

iNode.prototype.traverse = function(name) {
	return this.children[name];
};

iNode.prototype.isFile = function() {
	return !this.isDirectory();
};

iNode.prototype.isDirectory = function() {
	return this.directory;
};

iNode.prototype.isEmpty = function() {
	return Object.keys(this.children).length == 0;
};

iNode.prototype.fullPath = function() {
	if (!this.parent) {
		return this.name;
	}

	return this.parent.fullPath() + this.name;
};

iNode.prototype.ls = function() {
	var children = this.children;
	Object.keys(children).forEach(function(c) {
		console.log(children[c].name);
	});
};


/*
// Old Api
var root = new TreeNode('/');
root.addPath(file);
root.create()
root.getOrcreate()
// bla...

// New Api
var fs = new FS();

fs.touch(filename1);
fs.touch(filename2);
fs.touch(filename3);
fs.rm(filename1);
fs.rm(filename2);

fs.root.list(); // returns [ directory + files ]
iNode.isFile();
iNode.isDirectory();
iNode.

// on create
// path.split('/')
*/