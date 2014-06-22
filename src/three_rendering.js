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

	geometry.setSprite( 'offsets', node.ref, node.x, node.y, 0 );
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
		parent.children++;
	} else {
		links.push(new gLink(parent, child, distance, isFile));
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
		side: THREE.DoubleSide
		, transparent: true

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

	// for (i=0;i<links.length;i++) {
	// 	link = links[i];

	// 	if (link.hidden) continue;
	// 	ctx.moveTo(link.from.x, link.from.y);
	// 	ctx.lineTo(link.to.x, link.to.y);
	// 	ctx.stroke();
	// }

	for (i=0;i<nodes.length;i++) {
		node = nodes[i];
		geometry.setSprite( 'offsets', node.ref, node.x, node.y, 0 );
	}

	for (i=0;i<fileNodes.length;i++) {
		node = fileNodes[i];
		geometry.setSprite( 'offsets', node.ref, node.x, node.y, 0 );
	}

	geometry.attributes.color.needsUpdate = true;
	geometry.attributes.offset.needsUpdate = true;

	renderer.render( scene, camera );

}