/*
 * @author zz85 https://github.com/zz85
 */

THREE.ParticleGeometry = function ( sprites, d ) {

	THREE.BufferGeometry.call( this );

	var triangles = sprites * 2;

	var positions = new Float32Array( triangles * 3 * 3 );
	var offsets = new Float32Array( triangles * 3 * 3 );
	var rotations = new Float32Array( triangles * 3 * 3 );
	var normals = new Float32Array( triangles * 3 * 3 );
	var colors = new Float32Array( triangles * 3 * 3 );
	var uvs = new Float32Array( triangles * 3 * 2 );

	this.positions = positions;
	this.offsets = offsets;
	this.rotations = rotations;
	this.normals = normals;
	this.colors = colors;
	this.uvs = uvs;

	var pA = new THREE.Vector3();
	var pB = new THREE.Vector3();
	var pC = new THREE.Vector3();

	var cb = new THREE.Vector3();
	var ab = new THREE.Vector3();

	d = d || 6;	// individual triangle size

	for ( var i = 0, j = 0; i < sprites; i++, j += 18) {

		// simple square planes
		this.setVertex( 'positions', j + 0, -d, -d, 0 );
		this.setVertex( 'positions', j + 3, -d,  d, 0 );
		this.setVertex( 'positions', j + 6,  d,  d, 0 );
		this.setVertex( 'positions', j + 9,  d,  d, 0 );
		this.setVertex( 'positions', j + 12, d, -d, 0 );
		this.setVertex( 'positions', j + 15, -d, -d, 0 );

		// uv mapping
		this.setVertexUv( 'uvs', i * 12 + 0,  0,  0);
		this.setVertexUv( 'uvs', i * 12 + 2,  0,  1);
		this.setVertexUv( 'uvs', i * 12 + 4,  1,  1);
		this.setVertexUv( 'uvs', i * 12 + 6,  1,  1);
		this.setVertexUv( 'uvs', i * 12 + 8,  1,  0);
		this.setVertexUv( 'uvs', i * 12 + 10, 0,  0);

		// flat face normals
		this.getVertex( 'positions', j + 0, pA );
		this.getVertex( 'positions', j + 3, pB );
		this.getVertex( 'positions', j + 6, pC );

		cb.subVectors( pC, pB );
		ab.subVectors( pA, pB );
		cb.cross( ab ).normalize();

		this.setSprite( 'normals', i, cb.x, cb.y, cb.z );

	}


	this.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
	this.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
	this.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
	this.addAttribute( 'offset', new THREE.BufferAttribute( offsets, 3 ) );
	this.addAttribute( 'rotation', new THREE.BufferAttribute( rotations, 3 ) );
	this.addAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );

	this.computeBoundingSphere();
};

THREE.ParticleGeometry.prototype = Object.create( THREE.BufferGeometry.prototype );


THREE.ParticleGeometry.prototype.setFace = function ( buffer, face, x, y, z ) {

	// TODO extend this so any attributes can use this 
	
	var index = face * 9;

	buffer = this[ buffer ];

	buffer[ index + 0 ] = x;
	buffer[ index + 3 ] = x;
	buffer[ index + 6 ] = x;

	buffer[ index + 1 ] = y;
	buffer[ index + 4 ] = y;
	buffer[ index + 7 ] = y;

	buffer[ index + 2 ] = z;
	buffer[ index + 5 ] = z;
	buffer[ index + 8 ] = z;

}

THREE.ParticleGeometry.prototype.setVertex = function ( buffer, index, x, y, z ) {

	buffer = this[ buffer ];
	buffer[ index + 0 ] = x;
	buffer[ index + 1 ] = y;
	buffer[ index + 2 ] = z;

}


THREE.ParticleGeometry.prototype.getVertex = function ( buffer, index, vector ) {

	buffer = this[ buffer ];
	vector.set(
		buffer[ index + 0 ],
		buffer[ index + 1 ],
		buffer[ index + 2 ]
	);

}

THREE.ParticleGeometry.prototype.setVertexUv = function ( buffer, index, x, y ) {

	buffer = this[ buffer ];
	buffer[ index + 0 ] = x;
	buffer[ index + 1 ] = y;

}

THREE.ParticleGeometry.prototype.setSprite = function ( buffer, index, x, y, z ) {

	this.setFace( buffer, index * 2, x, y, z );
	this.setFace( buffer, index * 2 + 1, x, y, z );

}

THREE.ParticleGeometry.prototype.setFaceRotation = function ( face, x, y, z ) {
	
	this.setFace( 'rotations', face, x, y, z );

}

THREE.ParticleGeometry.prototype.setSpriteRotation = function ( face, x, y, z ) {
	
	this.setSprite( 'rotations', face, x, y, z );


}

THREE.ParticleGeometry.prototype.getFaceRotation = function ( face, rotation ) {
	
	var index = face * 9;
	rotation.set( this.rotations[ index + 0 ], this.rotations[ index + 1 ], this.rotations[ index + 2 ] )

}

THREE.ParticleGeometry.prototype.getSpriteOffset = function ( face, vector ) {
	
	var index = face * 9 * 2;
	vector.set( this.offsets[ index + 0 ], this.offsets[ index + 1 ], this.offsets[ index + 2 ] )

}

var
	grad = new THREE.Vector2(),
	n = new THREE.Vector2(),
	n1 = new THREE.Vector2(),
	n2 = new THREE.Vector2(),
	n3 = new THREE.Vector2(),
	n4 = new THREE.Vector2(),
	nv1 = new THREE.Vector2(),
	nv2 = new THREE.Vector2(),
	xaxis = new THREE.Vector2(1, 0);

THREE.ParticleGeometry.prototype.setLine = function(line, x1, y1, x2, y2, LINE_WIDTH) {
	var j = line * 18;

	grad.set(x2 - x1, y2 - y1).normalize();
	n.set(-grad.y, grad.x).multiplyScalar(0.5 * LINE_WIDTH);
	
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

THREE.ParticleGeometry.prototype.setBezierGrid = function(line, v0, v1, v2, LINE_WIDTH) {
	var j = line * 18;

	// https://www.siggraph.org/education/materials/HyperGraph/modeling/mod_tran/2drota.htm
	var l = nv1.copy(v2).sub(v0).length();
	nv1.divideScalar(l); // nv1 is now unit vector from v0 to v2

	var r = nv2.copy(v1).sub(v0).length();
	nv2.divideScalar(r);

	var a1 = nv1.dot(xaxis);
	var a2 = nv2.dot(xaxis);

	var a3 = a2 - a1; // amount of rotation to adjust

	x2 = r * Math.cos( a3 );
	y2 = r * Math.sin( a3 );
	
	var SPRITE_BREATH = Math.abs(y2) * 2 + LINE_WIDTH * 4; // amount of y needed in fragment shader
	l += LINE_WIDTH * 4; // amount of x in frag shader

	grad.copy(nv1);

	// normal to gradient
	n.set(-grad.y, grad.x).multiplyScalar(0.5 * SPRITE_BREATH);
	grad.multiplyScalar(2 * LINE_WIDTH);

	this.setSprite( 'normals', line, l, SPRITE_BREATH, LINE_WIDTH );
	// FIXME: hijacked colors attributes for passing control points for now
	this.setSprite( 'colors', line, x2 + 2 * LINE_WIDTH, SPRITE_BREATH / 2 - y2, 0 );

	n1.copy(v0).sub(grad).sub(n);
	n2.copy(v0).sub(grad).add(n);
	
	n3.copy(v2).add(grad).sub(n);
	n4.copy(v2).add(grad).add(n);

	this.setVertex( 'positions', j + 0, n1.x, n1.y, -4 );
	this.setVertex( 'positions', j + 3, n2.x, n2.y, -4 );
	this.setVertex( 'positions', j + 6, n4.x, n4.y, -4 );

	this.setVertex( 'positions', j + 9, n4.x, n4.y, -4 );
	this.setVertex( 'positions', j + 12, n3.x, n3.y, -4 );
	this.setVertex( 'positions', j + 15, n1.x, n1.y, -4 );
};