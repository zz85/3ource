if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;
var camera, scene, renderer, particles, geometry, material, i, h, color, sprite, size;
var mouseX = 0, mouseY = 0;


var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

offset = new THREE.Vector3();
color = new THREE.Color();


/* Graph functions */
function newNode(name, isFile, x, y) {
	var node = new gNode(name, isFile, x, y);
	if (isFile) {
		fileNodes.push(node);
	} else {
		nodes.push(node);
	}

	node.ref = geometry.count++;

	geometry.setSprite( 'offsets', node.ref, node.x, node.y, 0);
	if (isFile) {
		color.setHSL(0.45 + Math.random(), 0.7, 0.8);
		geometry.setSprite( 'colors', node.ref, color.r, color.g, color.b);
	}

	return node;
}

function newEdge(parent, child, isFile) {
	var distance = isFile ? 0.5 : 10;
	if (isFile) {
		clusters.push(new gLink(parent, child, distance, isFile));
	} else {
		var link = new gLink(parent, child, distance, isFile);
		links.push(link);

		link.ref = line.count++;

		line.geometry.vertices[link.ref * 2 + 0].x = parent.x;
		line.geometry.vertices[link.ref * 2 + 0].y = parent.y;
		line.geometry.vertices[link.ref * 2 + 0].z = 0;

		line.geometry.vertices[link.ref * 2 + 1].x = child.x;
		line.geometry.vertices[link.ref * 2 + 1].y = child.y;
		line.geometry.vertices[link.ref * 2 + 1].z = 0;

	}
}

// TODO
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
	camera.position.z = 500;

	scene = new THREE.Scene();
	// scene.fog = new THREE.FogExp2( 0x000000, 0.001 );

	// geometry = new THREE.Geometry();
	PARTICLES = 5000;
	geometry = new THREE.ParticleGeometry( PARTICLES, 6 );

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

	for ( i = 0; i < PARTICLES; i ++ ) {

		// Math.random() * 2000 - 1000
		geometry.setSprite( 'offsets', i, 100000, 100000, 0 );
		geometry.setSprite( 'rotations', i, 0, 0, 0);
		
		color.setHSL(0.9, 0.7, 0.8);
		geometry.setSprite( 'colors', i, color.r, color.g, color.b);

	}


	geometry.count = 0;


	lineGeometry = new THREE.Geometry();

	

	lineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 3, opacity: 1 } ); // , vertexColors: THREE.VertexColors
	line = new THREE.Line( lineGeometry, lineMaterial, THREE.LinePieces);
	scene.add( line );

	for (i = 0; i < 500; i++) {
		line.geometry.vertices.push(
			new THREE.Vector3(0, 0, 0), // -5000 fails
			new THREE.Vector3(0, 0, 0)
		);
	}
	line.count = 0;

	line.geometry.verticesNeedUpdate = true;

	particleMesh = new THREE.Mesh( geometry, material );

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

	for (i=0;i<links.length;i++) {
		link = links[i];

		var vertices = line.geometry.vertices;
		vertices[link.ref * 2 + 0].x = link.from.x;
		vertices[link.ref * 2 + 0].y = link.from.y;
		vertices[link.ref * 2 + 1].x = link.to.x;
		vertices[link.ref * 2 + 1].y = link.to.y;

	}

	for (i=0;i<nodes.length;i++) {
		node = nodes[i];
		geometry.setSprite( 'offsets', node.ref, node.x, node.y, 0 );
	}

	for (i=0;i<fileNodes.length;i++) {
		node = fileNodes[i];
		geometry.setSprite( 'offsets', node.ref, node.x, node.y, 0 );
	}

	line.geometry.verticesNeedUpdate = true;

	geometry.attributes.color.needsUpdate = true;
	geometry.attributes.offset.needsUpdate = true;

	renderer.render( scene, camera );

}
