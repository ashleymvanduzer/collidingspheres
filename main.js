let physicsWorld, scene, camera, renderer, rigidBodies = [], tmpTrans;
let colGroupPlane = 1, colGroupRedBall = 2, colGroupGreenBall = 3;
let ballObject = null, moveDirection = { left: 0, right: 0, forward: 0, back: 0 };
let kObject = null, kMoveDirection = { left: 0, right: 0, forward: 0, back: 0 }, tmpPos = new THREE.Vector3(), tmpQuat = new THREE.Quaternion();
let ammoTmpPos = null, ammoTmpQuat = null;
let sphereArr = [];
let mouseCoords = new THREE.Vector2(), raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
const STATE = { DISABLE_DEACTIVATION : 4 }
const FLAGS = { CF_KINEMATIC_OBJECT : 2 }


Ammo().then( start )

function start() {

	tmpTrans = new Ammo.btTransform();
	ammoTmpPos = new Ammo.btVector3();
	ammoTmpQuat = new Ammo.btQuaternion();

	setupPhysicsWorld();

	setupGraphics();
	createBlock();
	createSphereGrid();
	// createBall();

	// createKinematicBox();

	setupEventHandlers();
	renderFrame();

}

function setupPhysicsWorld() {
    let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
        dispatcher              = new Ammo.btCollisionDispatcher(collisionConfiguration),
        overlappingPairCache    = new Ammo.btDbvtBroadphase(),
        solver                  = new Ammo.btSequentialImpulseConstraintSolver();

    physicsWorld           = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, 0, 0));
}

function setupGraphics() {
	clock = new THREE.Clock();

	scene = new THREE.Scene();
	scene.background = new THREE.Color ( 0x000000 );

	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 5000);
	camera.position.set( 200, 100, 200 );
	camera.lookAt(new THREE.Vector3(0, 0, 0));

	let hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.1)
	hemiLight.color.setHSL( 0.6, 0.6, 0.6 );
	hemiLight.groundColor.setHSL( 0.1, 1, 0.4 );
	hemiLight.position.set( 0, 0, 0 );
	scene.add( hemiLight );

	let dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
	dirLight.color.setHSL( 0.1, 1, 0.95 )
	dirLight.position.set( -1, 1.75, 1 );
	dirLight.position.multiplyScalar( 200 );
	scene.add( dirLight );

	dirLight.castShadow = true;

	dirLight.shadow.mapSize.width = 2048;
	dirLight.shadow.mapSize.height = 2048;

	let d = 50;

	dirLight.shadow.camera.left = -d;
	dirLight.shadow.camera.right = d;
	dirLight.shadow.camera.top = d;
	dirLight.shadow.camera.bottom = -d;

	dirLight.shadow.camera.far = 13500;

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setClearColor( 0xbfd1e5 );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	window.addEventListener('resize', () => {
		renderer.setSize( window.innerWidth, window.innerHeight );
		camera.aspect = window.innerWidth/window.innerHeight;
		camera.updateProjectionMatrix();
	})

	// renderer.initTexture = true;
	// renderer.outputEncoding = true;

	var controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.addEventListener('change', function() {
		renderer.render( scene, camera )
	});

	renderer.shadowMap.enabled = true;
}

function renderFrame() {
	let deltaTime = clock.getDelta();

	// moveBall();

	// moveKinematic();

	updatePhysics( deltaTime );

	renderer.render( scene, camera );

	requestAnimationFrame( renderFrame );
}

function setupEventHandlers() {
	// window.addEventListener( 'keydown', handleKeyDown, false );
	// window.addEventListener( 'keyup', handleKeyUp, false );
	// window.addEventListener( 'mousedown', onMouseDown, false )
	window.addEventListener( 'mousemove', onMouseMove, false )

}

function handleKeyDown(event) {
	let keyCode = event.keyCode;

	switch(keyCode) {
		case 87:
			moveDirection.forward = 1
			break;

		case 83:
			moveDirection.back = 1
			break;

		case 65:
			moveDirection.left = 1
			break;

		case 68:
			moveDirection.right = 1
			break;

		case 38:
			kMoveDirection.forward = 1
			break;

		case 40:
			kMoveDirection.back = 1
			break;

		case 37:
			kMoveDirection.left = 1
			break;

		case 39:
		kMoveDirection.right = 1
			break;

	}
}

function handleKeyUp(event) {
	let keyCode = event.keyCode;

	switch(keyCode) {
		case 87:
			moveDirection.forward = 0
			break;

		case 83:
			moveDirection.back = 0
			break;

		case 65:
			moveDirection.left = 0
			break;

		case 68:
			moveDirection.right = 0
			break;

		case 38:
			kMoveDirection.forward = 0
			break;

		case 40:
			kMoveDirection.back = 0
			break;

		case 37:
			kMoveDirection.left = 0
			break;

		case 39:
			kMoveDirection.right = 0
			break;
	}
}

function onMouseDown ( event ) {
	mouseCoords.set(
		( event.clientX / window.innerWidth ) * 2 - 1,
		- ( event.clientY / window.innerHeight ) * 2 + 1
	);

	raycaster.setFromCamera( mouseCoords, camera );

	tmpPos.copy( raycaster.ray.direction );
	tmpPos.add( raycaster.ray.origin );

	let pos = {x: tmpPos.x, y: tmpPos.y, z: tmpPos.z};
	let radius = 1;
	let quat = {x: 0, y: 0, z: 0, w: 1};
	let mass = 1;

	let ball = new THREE.Mesh(new THREE.SphereBufferGeometry(radius, 32, 32),
		new THREE.MeshPhongMaterial({ color: 0xffee43 }))

	ball.position.set(pos.x, pos.y, pos.z);

	ball.castShadow = true;
	ball.receiveShadow = true;

	scene.add(ball);

	let transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
	transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
	let motionState = new Ammo.btDefaultMotionState( transform );

	let colShape = new Ammo.btSphereShape( radius );
	colShape.setMargin( 0.05 );

	let localInertia = new Ammo.btVector3(0,0,0);
	colShape.calculateLocalInertia( mass, localInertia );

	let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
	let body = new Ammo.btRigidBody( rbInfo );

	physicsWorld.addRigidBody( body );

	tmpPos.copy( raycaster.ray.direction );
	tmpPos.multiplyScalar( 100 );

	body.setRestitution(.2)

	body.setLinearVelocity( new Ammo.btVector3( tmpPos.x, tmpPos.y, tmpPos.z ) );


	ball.userData.physicsBody = body;
	rigidBodies.push(ball);
}

function onMouseMove(event) {
	event.preventDefault();
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

	raycaster.setFromCamera(mouse, camera);

	var intersects = raycaster.intersectObjects(scene.children, true);
	
	for (var i = 0; i < intersects.length; i++) {
		for(var j = 0; j < rigidBodies.length; j++) {		
			let inertia = new Ammo.btVector3( 0, 0, 0 )
			let transform = new Ammo.btTransform()
			// console.log(rigidBodies[j].userData.physicsBody)
			rigidBodies[j].userData.physicsBody.setActivationState(4);
			// sphereArr[j].userData.physicsBody.setMassProps(1, 2);

			rigidBodies[j].userData.physicsBody.applyCentralForce(1)
			rigidBodies[j].userData.physicsBody.setGravity(new Ammo.btVector3(0, -10, 0));
		// if(intersects[i].point.x == rigidBodies[j].position.x) {}
		// console.log(rigidBodies[j].position)
		// if(mouse.x == sphereArr[j].position.x && mouse.y == sphereArr[j].position.y) {
		
		// 	// sphereArr[j].userData.physicsBody.setMassProps(1, 2);
		
		// }
		
		
		// physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
		//btTransform may work for the movement if it is possible to change between kinematic and dynamic
		

		}
	}
// 	// 	this.tl = gsap.timeline();
// 	// 	// this.tl.to(intersects[i].object.scale, 1, {x: 0.5, ease: Expo.easeOut});
// 	// 	this.tl.to(intersects[i].object.position, {x: intersects[i].object.position.x, y: intersects[i].object.position.y, z:intersects[i].object.position.z, duration: 5, ease: "bounce.out", y: Math.floor(Math.round(intersects[i].object.position.y - 200))})
// 	// }


}



function createBlock() {

	let pos = {x: 0, y: 0, z: 0};
	let scale = {x: 200, y: 2, z: 200};
	let quat = {x: 0, y: 0, z: 0, w: 1};
	let mass = 0;

	let blockPlane = new THREE.Mesh(new THREE.BoxBufferGeometry(),
		new THREE.MeshPhongMaterial({ color: 0x000000 }));

	blockPlane.position.set(pos.x, pos.y, pos.z);
	blockPlane.scale.set(scale.x, scale.y, scale.z);

	blockPlane.castShadow = true;
	blockPlane.receiveShadow = true;

	scene.add(blockPlane);

	let transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
	transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
	let motionState = new Ammo.btDefaultMotionState( transform );

	let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
	colShape.setMargin( 0.05 );

    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    colShape.calculateLocalInertia( mass, localInertia );

    let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
    let body = new Ammo.btRigidBody( rbInfo );

    body.setFriction(4);
    body.setRollingFriction(4);
    body.setRestitution(0.8)


    physicsWorld.addRigidBody( body );
}

function createBall() {

	let pos = {x: 0, y: 4, z: 0};
	let radius = 2;
	let quat = {x: 0, y: 0, z: 0, w: 1};
	let mass = 1;
	
	let ball = ballObject = new THREE.Mesh(new THREE.SphereBufferGeometry(radius), new THREE.MeshLambertMaterial({ color: 0xff0505}));
	ball.position.set(pos.x, pos.y, pos.z);

	ball.castShadow = true;
	ball.receiveShadow = true;

	scene.add(ball);

	let transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
	transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
	let motionState = new Ammo.btDefaultMotionState( transform );

	let colShape = new Ammo.btSphereShape( radius );
	colShape.setMargin( 0.05 );

	let localInertia = new Ammo.btVector3( 0, 0, 0 );
	colShape.calculateLocalInertia( mass, localInertia );

	let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
	let body = new Ammo.btRigidBody( rbInfo );

	body.setFriction(4);
	body.setRollingFriction(10);

	// body.setActivationState( STATE.DISABLE_DEACTIVATION );

	physicsWorld.addRigidBody( body );

	ball.userData.physicsBody = body;
	rigidBodies.push(ball);
}

function createSphereGrid() {
		let radius = 4;

		let quat = {x: 0, y: 0, z: 0, w: 1};
		let mass = 1;
		for (var h = 0; h < 5;) {
		let spherePosY = 124 + (10 * h)
		for(var i = 0; i < 5;) {
			let spherePosZ = (10 * i);
			for(var j = 0; j < 5; j++) {
				var randomColor = "#000000".replace(/0/g,function(){return (~~(Math.random()*16)).toString(16);});
				var material = new THREE.MeshLambertMaterial( {color: randomColor} )
				var sphere = new THREE.Mesh( new THREE.SphereGeometry(radius, 32, 32) , material );
				sphere.position.x = (j) * 10;
				sphere.position.y = spherePosY;
				sphere.position.z = spherePosZ;
				// sphere.position.z = 4 - i * 10;
				// sphere.castShadow = true;
				// sphere.receiveShadow = true;
				sphereArr.push(sphere);
				scene.add(sphere);

				let transform = new Ammo.btTransform();
				transform.setIdentity();
				transform.setOrigin( new Ammo.btVector3( sphere.position.x, sphere.position.y, sphere.position.z ) );
				transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
				let motionState = new Ammo.btDefaultMotionState( transform );

				let colShape = new Ammo.btSphereShape( radius );
				colShape.setMargin( 0.05 );

				let localInertia = new Ammo.btVector3( 0, 0, 0 );
				colShape.calculateLocalInertia( mass, localInertia );

				let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
				let body = new Ammo.btRigidBody( rbInfo );


				body.setActivationState( STATE.DISABLE_DEACTIVATION );
				// body.setCollisionFlags( FLAGS.CF_KINEMATIC_OBJECT );

				physicsWorld.addRigidBody( body );
				body.setRestitution(0.5)

				sphere.userData.physicsBody = body;
				rigidBodies.push(sphere);
			}
			i++;
		}
		h++;
	}
}


function createKinematicBox() {

	let pos = {x: 40, y: 6, z: 5};
	let scale = {x: 10, y: 10, z: 10};
	let quat = {x: 0, y: 0, z: 0, w: 1};
	let mass = 1;

	kObject = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({color: 0x30ab78}));

	kObject.position.set(pos.x, pos.y, pos.z);
	kObject.scale.set(scale.x, scale.y, scale.z);

	kObject.castShadow = true;
	kObject.receiveShadow = true;

	scene.add(kObject);

	let transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
	transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
	let motionState = new Ammo.btDefaultMotionState( transform );

	let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
	colShape.setMargin( 0.05 );

	let localInertia = new Ammo.btVector3( 0, 0, 0 );
	colShape.calculateLocalInertia( mass, localInertia );

	let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
	let body = new Ammo.btRigidBody( rbInfo );

	body.setFriction(4);
	body.setRollingFriction(10);

	body.setActivationState( STATE.DISABLE_DEACTIVATION );
	body.setCollisionFlags( FLAGS.CF_KINEMATIC_OBJECT );

	physicsWorld.addRigidBody( body );
	kObject.userData.physicsBody = body;
}

function moveBall() {
	let scalingFactor = 20;

	let moveX = moveDirection.right - moveDirection.left;
	let moveZ = moveDirection.back - moveDirection.forward;
	let moveY = 0;

	if( moveX == 0 && moveY == 0 && moveZ == 0 ) return;

	let resultantImpulse = new Ammo.btVector3( moveX, moveY, moveZ );
	resultantImpulse.op_mul(scalingFactor);

	let physicsBody = ballObject.userData.physicsBody;
	physicsBody.setLinearVelocity( resultantImpulse );
}

function moveKinematic() {
	let scalingFactor = 0.3;

	let moveX = kMoveDirection.right - kMoveDirection.left;
	let moveZ = kMoveDirection.back - kMoveDirection.forward;
	let moveY = 0;

	let translateFactor = tmpPos.set(moveX, moveY, moveZ);

	translateFactor.multiplyScalar(scalingFactor);

	kObject.translateX(translateFactor.x);
	kObject.translateY(translateFactor.y);
	kObject.translateZ(translateFactor.z);

	kObject.getWorldPosition(tmpPos);
	kObject.getWorldQuaternion(tmpQuat);

	let physicsBody = kObject.userData.physicsBody;

	let ms = physicsBody.getMotionState();
	if ( ms ) {

		ammoTmpPos.setValue(tmpPos.x, tmpPos.y, tmpPos.z);
		ammoTmpQuat.setValue( tmpQuat.x, tmpQuat.y, tmpQuat.z, tmpQuat.w );

		tmpTrans.setIdentity();
		tmpTrans.setOrigin( ammoTmpPos );
		tmpTrans.setRotation( ammoTmpQuat );

		ms.setWorldTransform(tmpTrans);
	}
}



function createMaskBall() {
	let pos = {x: 1, y: 30, z: 0};
	let radius = 2;
	let quat = {x: 0, y: 0, z: 0, w: 1};
	let mass = 1;

	let ball = new THREE.Mesh(new THREE.SphereBufferGeometry(radius),
		new THREE.MeshPhongMaterial({ color: 0x00ff08 }))

	ball.position.set(pos.x, pos.y, pos.z);

	ball.castShadow = true;
	ball.receiveShadow = true;

	scene.add(ball);

	let transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
	transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
	let motionState = new Ammo.btDefaultMotionState( transform );

	let colShape = new Ammo.btSphereShape( radius );
	colShape.setMargin( 0.05 );

	let localInertia = new Ammo.btVector3( 0, 0, 0 );
	colShape.calculateLocalInertia( mass, localInertia );

	let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
	let body = new Ammo.btRigidBody( rbInfo );

	physicsWorld.addRigidBody( body, colGroupGreenBall, colGroupPlane | colGroupRedBall );

	ball.userData.physicsBody = body;
	rigidBodies.push(ball);


}

function createJointObjects(){
    
    let pos1 = {x: -1, y: 15, z: 0};
    let pos2 = {x: -1, y: 10, z: 0};

    let radius = 2;
    let scale = {x: 5, y: 2, z: 2};
    let quat = {x: 0, y: 0, z: 0, w: 1};
    let mass1 = 0;
    let mass2 = 1;

    let transform = new Ammo.btTransform();

    //Sphere Graphics
    let ball = new THREE.Mesh(new THREE.SphereBufferGeometry(radius), new THREE.MeshPhongMaterial({color: 0xb846db}));

    ball.position.set(pos1.x, pos1.y, pos1.z);

    ball.castShadow = true;
    ball.receiveShadow = true;

    scene.add(ball);


    //Sphere Physics
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos1.x, pos1.y, pos1.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    let motionState = new Ammo.btDefaultMotionState( transform );

    let sphereColShape = new Ammo.btSphereShape( radius );
    sphereColShape.setMargin( 0.05 );

    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    sphereColShape.calculateLocalInertia( mass1, localInertia );

    let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass1, motionState, sphereColShape, localInertia );
    let sphereBody = new Ammo.btRigidBody( rbInfo );

    physicsWorld.addRigidBody( sphereBody, colGroupGreenBall, colGroupRedBall );

    ball.userData.physicsBody = sphereBody;
    rigidBodies.push(ball);
    

    //Block Graphics
    let block = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({color: 0xf78a1d}));

    block.position.set(pos2.x, pos2.y, pos2.z);
    block.scale.set(scale.x, scale.y, scale.z);

    block.castShadow = true;
    block.receiveShadow = true;

    scene.add(block);


    //Block Physics
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos2.x, pos2.y, pos2.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    motionState = new Ammo.btDefaultMotionState( transform );

    let blockColShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
    blockColShape.setMargin( 0.05 );

    localInertia = new Ammo.btVector3( 0, 0, 0 );
    blockColShape.calculateLocalInertia( mass2, localInertia );

    rbInfo = new Ammo.btRigidBodyConstructionInfo( mass2, motionState, blockColShape, localInertia );
    let blockBody = new Ammo.btRigidBody( rbInfo );

    physicsWorld.addRigidBody( blockBody, colGroupGreenBall, colGroupRedBall );
    
    block.userData.physicsBody = blockBody;
    rigidBodies.push(block);



    //Create Joints
    let spherePivot = new Ammo.btVector3( 0, - radius, 0 );
    let blockPivot = new Ammo.btVector3( - scale.x * 0.5, 1, 1 );

    let p2p = new Ammo.btPoint2PointConstraint( sphereBody, blockBody, spherePivot, blockPivot);
    physicsWorld.addConstraint( p2p, false );

}

// function onMouseMove(event) {
// 	event.preventDefault();
// 	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
// 	mouse.y = - ( event.clientY / window.innerWidth ) * 2 + 1;

// 	raycaster.setFromCamera( mouse, camera );
// 	console.log(rigidBodies);
// 	var intersects = raycaster.intersectObjects(scene.children, true);
// 	for(var i = 0; i < intersects.length; i++) {
// 		console.log(intersects[i].object.userData.physicsBody)
// 	}
// }

function updatePhysics( deltaTime ) {
	physicsWorld.stepSimulation( deltaTime, 10 );

	for( let i = 0; i < rigidBodies.length; i++) {
		let objThree = rigidBodies[ i ];
		let objAmmo = objThree.userData.physicsBody;
		let ms = objAmmo.getMotionState();

		if ( ms ) {

			ms.getWorldTransform( tmpTrans );
			let p = tmpTrans.getOrigin();
			let q = tmpTrans.getRotation();
			objThree.position.set( p.x(), p.y(), p.z());
			objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
		}
	}
}

// window.addEventListener('mousemove', onMouseMove);
