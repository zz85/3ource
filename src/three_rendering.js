if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;
var camera, scene, renderer, particles,
spriteGeometry, material, i, h, color, sprite, size;

var mouseX = 0, mouseY = 0;


var PARTICLES = 5000; // Particle Pool
var LINES = 500; // Lines Pool


var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

offset = new THREE.Vector3();
color = new THREE.Color();

var extension_colors = {};

/* Graph functions */
function newNode(name, isFile, x, y) {
	var node = new gNode(name, isFile, x, y);
	if (isFile) {
		fileNodes.push(node);
		var ext = node.name.split('.').pop();
		if (!extension_colors[ext]) extension_colors[ext] = Math.random();
		node.ext = ext;
		node.sat = Math.random() * 0.5 + 0.5;
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

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 2, 2000 );
	camera.position.z = 800;

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

	lineGeometry = new THREE.Geometry();

	lineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 3, opacity: 1 } ); // , vertexColors: THREE.VertexColors
	line = new THREE.Line( lineGeometry, lineMaterial, THREE.LinePieces);
	scene.add( line );

	for (i = 0; i < LINES; i++) {
		line.geometry.vertices.push(
			new THREE.Vector3(0, 0, 0), // -5000 fails
			new THREE.Vector3(0, 0, 0)
		);
	}

	line.geometry.verticesNeedUpdate = true;

	particleMesh = new THREE.Mesh( spriteGeometry, material );

	scene.add( particleMesh );

	//

	renderer = new THREE.WebGLRenderer( { clearAlpha: 1 } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( renderer.domElement );

	//

	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild( stats.domElement );

	//

	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	document.addEventListener( 'touchstart', onDocumentTouchStart, false );
	document.addEventListener( 'touchmove', onDocumentTouchMove, false );

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
	

	for (i=0;i<LINES;i++) {

		var vertices = line.geometry.vertices;

		if (i < links.length) {
			link = links[i];
			vertices[i * 2 + 0].x = link.from.x;
			vertices[i * 2 + 0].y = link.from.y;
			vertices[i * 2 + 1].x = link.to.x;
			vertices[i * 2 + 1].y = link.to.y;
		} else {
			vertices[i * 2 + 0].x = 0;
			vertices[i * 2 + 0].y = 0;
			vertices[i * 2 + 1].x = 0;
			vertices[i * 2 + 1].y = 0;
		}

	}

	// for (i=0;i<nodes.length;i++) {
	// 	node = nodes[i];
	// 	spriteGeometry.setSprite( 'offsets', node.ref, node.x, node.y, 0 );
		// color.setHSL(0.45 + Math.random(), 0.7, 0.8);
	
	// }

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

	line.geometry.verticesNeedUpdate = true;

	spriteGeometry.attributes.color.needsUpdate = true;
	spriteGeometry.attributes.offset.needsUpdate = true;

	renderer.render( scene, camera );

}
