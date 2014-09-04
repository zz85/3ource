if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;
var camera, scene, renderer, particles,
spriteGeometry, material, i, h, color, sprite, size;

var projector, raycaster;
var mouseX = 0, mouseY = 0;

var PARTICLES = 2000; // Particle Pool
var LINES = 500; // Lines Pool


var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

offset = new THREE.Vector3();
color = new THREE.Color();

var extension_colors = {};

/* Graph functions */
function newNode(name, isFile, x, y) {
	var node = new gNode(name, isFile, x, y);
	// TODO
	// Histogram count / sort
	// Equidistance colors
	// Common File Types.

	if (isFile) {
		fileNodes.push(node);

		var filename = name.split('/').pop();
		var split = filename.lastIndexOf('.');

		// If no extension or hidden file (eg. .gitignore)
		var ext = split > 0 ? filename.substring(split + 1).toLowerCase() : '';

		node.ext = ext;
		node.sat = Math.random() * 0.5 + 0.5;

		if (!extension_colors[ext]) {
			extension_colors[ext] = Math.random();
			color.setHSL(extension_colors[ext], 0.5, 0.5);
			var div = document.createElement('div');
			div.style.cssText = 'background-color: #' + color.getHexString() + ';';
			div.innerText = '.' + ext;
			color_legend.appendChild(div);

		}

	} else {
		nodes.push(node);
	}

	node.life = 0;

	return node;
}

function newEdge(parent, child, isFile) {
	var distance = isFile ? 0.5 : 10;
	if (isFile) {
		clusters.push(new gLink(parent, child, distance, isFile));
	} else {
		var link = new gLink(parent, child, distance, isFile);
		links.push(link);
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


function initDrawings() {

	container = document.createElement( 'div' );
	document.body.appendChild( container );

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 10000 );
	camera.position.z = 200;

	scene = new THREE.Scene();
	// scene.fog = new THREE.FogExp2( 0x000000, 0.001 );

	// geometry = new THREE.Geometry();
	spriteGeometry = new THREE.ParticleGeometry( PARTICLES, 5 * 1.5);

	sprite = THREE.ImageUtils.loadTexture( "disc.png" );

	var spriteOptions = {
		uniforms: {
			time: { type: "f", value: 1.0 },
			depth: { type: "f", value: 0.0 },
			texture: { type: 't', value: sprite },
		},
		attributes: {
			offset: { type: 'v3', value: null },
			rotation: { type: 'v3', value: null },
		},
		vertexShader: document.getElementById( 'vertexShader' ).textContent,
		fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
		side: THREE.DoubleSide,
		transparent: true

	};

	material = new THREE.RawShaderMaterial( spriteOptions );

	spriteGeometry.hideSprite = function(i) {
		spriteGeometry.setSprite( 'offsets', i, 100000, 100000, 0 );
	};

	for ( i = 0; i < PARTICLES; i ++ ) {

		// Math.random() * 2000 - 1000
		spriteGeometry.hideSprite(i);
		spriteGeometry.setSprite( 'rotations', i, 0, 0, 0);
		
		color.setHSL(0.9, 0.7, 0.8);
		spriteGeometry.setSprite( 'colors', i, color.r, color.g, color.b);

	}


	lineGeometry = new THREE.ParticleGeometry( LINES, 5 * 1.5 );

	var lineOptions = {

		uniforms: {
			time: { type: "f", value: 1.0 },
			depth: { type: "f", value: 0.0 },
			texture: { type: 't', value: THREE.ImageUtils.loadTexture( "textures/sprites/ball.png" ) },
		},
		attributes: {
			offset: { type: 'v3', value: null },
			rotation: { type: 'v3', value: null },
		},
		vertexShader: document.getElementById( 'vertexShader' ).textContent,
		fragmentShader: document.getElementById( 'lineFragmentShader' ).textContent,
		side: THREE.DoubleSide,
		transparent: true

	};

	var lineMaterial = new THREE.RawShaderMaterial( lineOptions );

	var
		grad = new THREE.Vector2(),
		n = new THREE.Vector2(),
		n1 = new THREE.Vector2(),
		n2 = new THREE.Vector2(),
		n3 = new THREE.Vector2(),
		n4 = new THREE.Vector2(),
		LINE_WIDTH = 4;

	LINES = 1000;

	lineGeometry.setLine = function(line, x1, y1, x2, y2) {
		// TODO make line width a parameter
		var j = line * 18;

		grad.set(x2 - x1, y2 - y1).normalize();
		n.set(-grad.y, grad.x).multiplyScalar(0.125 * LINE_WIDTH);
		
		n1.set(x1, y1).add(n);
		n2.set(x1, y1).sub(n);

		n.set(-grad.y, grad.x).multiplyScalar(0.5 * LINE_WIDTH);
		
		n3.set(x2, y2).sub(n);
		n4.set(x2, y2).add(n);

		this.setVertex( 'positions', j + 0, n1.x, n1.y, -4 );
		this.setVertex( 'positions', j + 3, n2.x, n2.y, -4 );
		this.setVertex( 'positions', j + 6, n4.x, n4.y, -4);

		this.setVertex( 'positions', j + 9, n2.x, n2.y, -4 );
		this.setVertex( 'positions', j + 12, n3.x, n3.y, -4 );
		this.setVertex( 'positions', j + 15, n4.x, n4.y, -4 );
	};

	lineGeometry.setBezier = function(line, x1, y1, x2, y2, x3, y3) {
		var j = line * 18;
		this.setVertex( 'positions', j + 0, x1, y1, -4 );
		this.setVertex( 'positions', j + 3, x2, y2, -4 );
		this.setVertex( 'positions', j + 6, x3, y3, -4);

		this.setVertex( 'positions', j + 9, 0, 0, -4 );
		this.setVertex( 'positions', j + 12, 0,0, -4 );
		this.setVertex( 'positions', j + 15, 0,0, -4 );
	};

	for ( i = 0; i < LINES; i ++ ) {

		lineGeometry.setLine(i, 0.1, 0.1, 0.1, 0.1); // Hide line (or make -10 on z?)
		// lineGeometry.setSprite( 'offsets', i, Math.random() * 2000 - 1000, Math.random() * 2000 - 1000, Math.random() * 2000 - 1000);
		// lineGeometry.setSprite( 'rotations', i, 0, 0, 0.25);
		
		lineGeometry.setVertexUv( 'uvs', i * 12 + 0,  0,  0);
		lineGeometry.setVertexUv( 'uvs', i * 12 + 2,  0.5, 0);
		lineGeometry.setVertexUv( 'uvs', i * 12 + 4,  1,  1);
		lineGeometry.setVertexUv( 'uvs', i * 12 + 6,  0,  0);
		lineGeometry.setVertexUv( 'uvs', i * 12 + 8,  0.5,  0);
		lineGeometry.setVertexUv( 'uvs', i * 12 + 10, 1,  1);

		color.setHSL(Math.random(), 0.9, 0.9);
		lineGeometry.setSprite( 'colors', i, color.r, color.g, color.b);
	}



	lineMesh = new THREE.Mesh( lineGeometry, lineMaterial );
	scene.add(lineMesh);

	particleMesh = new THREE.Mesh( spriteGeometry, material );
	
	particleMesh.raycast = ( function () {

		var inverseMatrix = new THREE.Matrix4();
		var ray = new THREE.Ray();
		var vA = new THREE.Vector3();
		var vB = new THREE.Vector3();
		var vC = new THREE.Vector3();

		return function ( raycaster, intersects ) {

			var geometry = this.geometry;
			inverseMatrix.getInverse( this.matrixWorld );
			ray.copy( raycaster.ray ).applyMatrix4( inverseMatrix );

			var material = this.material;

			if ( material === undefined ) return;

			var attributes = geometry.attributes;

			var a, b, c;
			var precision = raycaster.precision;

			var positions = attributes.position.array;
			var offsets = attributes.offset.array;

			var limits = fileNodes.length * 2;

			for ( var i = 0, j = 0, k = 0, il = positions.length; i < il && k < limits; i += 3, j += 9, k++) {

				a = i;
				b = i + 1;
				c = i + 2;

				vA.set(
					positions[ j     ] + offsets[ j     ],
					positions[ j + 1 ] + offsets[ j + 1 ],
					positions[ j + 2 ] + offsets[ j + 2 ]
				);
				vB.set(
					positions[ j + 3 ] + offsets[ j + 3 ],
					positions[ j + 4 ] + offsets[ j + 4 ],
					positions[ j + 5 ] + offsets[ j + 5 ]
				);
				vC.set(
					positions[ j + 6 ] + offsets[ j + 6 ],
					positions[ j + 7 ] + offsets[ j + 7 ],
					positions[ j + 8 ] + offsets[ j + 8 ]
				);


				if ( material.side === THREE.BackSide ) {

					var intersectionPoint = ray.intersectTriangle( vC, vB, vA, true );

				} else {

					var intersectionPoint = ray.intersectTriangle( vA, vB, vC, material.side !== THREE.DoubleSide );

				}

				if ( intersectionPoint === null ) continue;

				intersectionPoint.applyMatrix4( this.matrixWorld );

				var distance = raycaster.ray.origin.distanceTo( intersectionPoint );

				if ( distance < precision || distance < raycaster.near || distance > raycaster.far ) continue;

				var whi = k / 2 | 0;
				intersects.push( {

					distance: distance,
					point: intersectionPoint,
					face: new THREE.Face3( a, b, c, THREE.Triangle.normal( vA, vB, vC ) ),
					faceIndex: k,
					object: this

				} );

				console.log(whi, fileNodes[whi].name);

			}

		};

	}() );

	scene.add( particleMesh );

	//

	projector = new THREE.Projector();
	raycaster = new THREE.Raycaster();


	//

	renderer = new THREE.WebGLRenderer( { clearAlpha: 1 } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.getContext().getExtension("OES_standard_derivatives");
	container.appendChild( renderer.domElement );


	// renderer.domElement.addEventListener( 'mousemove', onMouseMove, false );


	//

	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild( stats.domElement );

	//

renderer.domElement.addEventListener( 'mousedown', function() {
	moo = true;
}, false );
	renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
	renderer.domElement.addEventListener( 'touchstart', onDocumentTouchStart, false );
	renderer.domElement.addEventListener( 'touchmove', onDocumentTouchMove, false );

	//

	window.addEventListener( 'resize', onWindowResize, false );

	animate();

}

function onWindowResize() {

	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseMove( event ) {

	mouseX = event.clientX - windowHalfX;
	mouseY = event.clientY - windowHalfY;
	// console.log('move', mouseX, mouseY);

}

function onDocumentTouchStart( event ) {

	if ( event.touches.length == 1 ) {

		event.preventDefault();

		mouseX = event.touches[ 0 ].pageX - windowHalfX;
		mouseY = event.touches[ 0 ].pageY - windowHalfY;

	}
}

function onDocumentTouchMove( event ) {

	if ( event.touches.length == 1 ) {

		event.preventDefault();

		mouseX = event.touches[ 0 ].pageX - windowHalfX;
		mouseY = event.touches[ 0 ].pageY - windowHalfY;

	}

}

//

function animate() {

	requestAnimationFrame( animate );

	simulate();
	render();
	stats.update();

}

function render() {

	var time = Date.now() * 0.00005;

	// camera.position.x += ( mouseX - camera.position.x ) * 0.05;
	// camera.position.y += ( - mouseY - camera.position.y ) * 0.05;

	// camera.lookAt( scene.position );

	if (links.length > LINES) {
		console.warn('warning, please increase Lines pool size');
	}


	if (fileNodes.length > PARTICLES) {
		console.warn('warning, please increase Particles pool size');
	}
	
	// Draw links
	for (i=0;i<LINES;i++) {
		if (i < links.length) {
			link = links[i];
			// lineGeometry.setLine(i, link.from.x, link.from.y, link.to.x, link.to.y);

			// ctx.lineTo(link.to.x, link.to.y);
			// ctx.quadraticCurveTo(link.current.x, link.current.y, link.to.x, link.to.y);

			var rx = link.average.x - link.current.x;
			var ry = link.average.y - link.current.y;

			lineGeometry.setBezier(i, link.from.x, link.from.y, link.average.x + rx, link.average.y + ry, link.to.x, link.to.y);

		} else {
			// hide
			lineGeometry.setLine(i, 0.1, 0.1, 0.1, 0.1);
		}
	}

	// Flag graphic buffers for update
	lineGeometry.attributes.position.needsUpdate = true;
	// lineGeometry.attributes.color.needsUpdate = true;

	for (i=0;i<PARTICLES;i++) {
		if (i < fileNodes.length) {
			node = fileNodes[i];
			spriteGeometry.setSprite( 'offsets', i, node.x, node.y, 0 );

			node.life++;

			// color.setStyle(node.color);
			// var c = color.getHSL();
			// color.setHSL(c.h, c.s, Math.max(0.5, 1 - k * k));

			var k = node.life * 0.01;
			k = Math.max(0.5, 1 - k * k);
			color.setHSL(extension_colors[node.ext], node.sat * 0.2 + k * 0.6 + 0.2, k);
			
			spriteGeometry.setSprite( 'colors', i, color.r, color.g, color.b);
	
		} else {
			spriteGeometry.hideSprite( i );
		}
	}

	spriteGeometry.attributes.color.needsUpdate = true;
	spriteGeometry.attributes.offset.needsUpdate = true;

	// find intersections

	if (window.moo) {
	
		vector = new THREE.Vector3( mouseX / windowHalfX, -1 * mouseY / windowHalfY, 1 );
		// console.log(vector);
		projector.unprojectVector( vector, camera );

		raycaster.set( camera.position, vector.sub( camera.position ).normalize() );


		console.time('check');
		var intersects = raycaster.intersectObjects( scene.children );

		if ( intersects.length > 0 ) {
			console.log(intersects.length)
			console.log(intersects[0])
			
		} else {

			

		}
		console.timeEnd('check')

		moo = false;
	}



	renderer.render( scene, camera );

}
