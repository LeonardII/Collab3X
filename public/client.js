
import * as THREE from '/build/three.module.js';
import {OrbitControls} from '/jsm/controls/OrbitControls.js';
import {OBJLoader} from 'https://threejsfundamentals.org/threejs/resources/threejs/r125/examples/jsm/loaders/OBJLoader.js';
//import Stats from '/jsm/libs/stats.module.js';

let userName, camera, controls, scene, renderer, rayCaster, cursor, markers, userCursors, intersectionObjects;
const mouse = new THREE.Vector2();
let mouseMoved = false;

const markerGeometry = new THREE.SphereGeometry( 7, 20, 20);
const loader = new OBJLoader();

//________________Websocket stuff______________________
var webSocket;
var projectId;

function connectToWebSocketServer() {
    if ("WebSocket" in window) {
        webSocket = new WebSocket('ws://' + window.location.href.split('/')[2]);
        webSocket.onopen = function() {
            monitorProject("Haus");
        };
        webSocket.onmessage = function (evt)  { 
            var message = JSON.parse(evt.data);
            switch(message.t){
                case "marker":
                        let color = new THREE.Color('#'+message.data.user);
                        addMarkerGeometry(message.data.x,message.data.y,message.data.z, color);
                        break;
                case "pos":
                        movePlayer(message.data.user, message.data.x,message.data.y,message.data.z);
                        break;
                case "setUserName":
                        userName = message.data.name;
                        cursor.material.color = new THREE.Color('#'+userName);
                        console.log("set username to " + userName + message+message.data.name);
                        break;
                case "changeUserName":
                        console.log(message);
                        break;
                case "clear":
                        //if message.project == project
                        clearMarkers();
                        break;
                case "addProject":
                        if (message.data.name == null){
                                console.log("Project deleted");
                                break;
                        }
                        addProject(message.data.name);
                        break;
                case "loadProject":
                        loadProject(message.data.project);
                        break;
            }
            
        };
        webSocket.onclose = function() { 
            console.log('Websocket closed.');
        };
    }
    else {
        alert("WebSocket not supported browser.");
    }
}

function loadProject(projectName){
        while(scene.children.length > 0){ 
                scene.remove(scene.children[0]); 
        }
        initScene();
        loadObj(projectName);
}

function monitorProject(id) {
    //load 3d
    //load points
    projectId = id;
    var message = JSON.stringify({action:"monitorProject",project:projectId});
    console.log('Sending message to monitor project ' + projectId + ': ' + message);
    webSocket.send(message);
}

function addPointToDataBase(x, y, z, id) {
    var message = JSON.stringify({action:"addPoint",x:x, y:y, z:z, project:id});
    console.log('Sending message to add point to Project ' + message);
    webSocket.send(message);
}

function uploadFile(file) {
        console.log('Sending message to add Project ' + file);
        webSocket.send(file);
}

connectToWebSocketServer();


//_________________3D stuff________________
init();
//render(); // remove when using next line for animation loop (requestAnimationFrame)
animate();

function init() {

        rayCaster = new THREE.Raycaster();

        scene = new THREE.Scene();
        initScene();

        renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( renderer.domElement );

        camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 10000 );
        camera.position.set( 400, 200, 0 );

        // controls

        controls = new OrbitControls( camera, renderer.domElement );
        
        document.addEventListener( 'pointermove', onDocumentMouseMove );
        document.addEventListener( 'pointerdown', onDocumentMouseDown );
        document.addEventListener( 'pointerup', onDocumentMouseUp );

        document.getElementById('clearButton').onclick = clearAllPointsForProject;

        /*let dropArea = document.getElementById('drop-area');
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false)
        })
        function preventDefaults (e) {
        e.preventDefault()
        e.stopPropagation()
        }

        dropArea.addEventListener( 'drop', onFileDrop);
        dropArea.addEventListener( 'dragenter', function() {
                console.log("drag enter");
        }, false);*/


        //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)

        controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        controls.dampingFactor = 0.05;

        controls.screenSpacePanning = false;

        controls.minDistance = 100;
        controls.maxDistance = 5000;

        controls.maxPolarAngle = Math.PI / 2;

        const cursorGeometry = new THREE.SphereGeometry( 5, 20, 20);
        cursor = new THREE.Mesh( cursorGeometry, new THREE.MeshStandardMaterial({color: 0x111111}) );
        

        //

        window.addEventListener( 'resize', onWindowResize );


        //const gui = new GUI();
        //gui.add( controls, 'screenSpacePanning' );
}

function initScene(){
        intersectionObjects = [];
        markers = [];
        userCursors = [];
        
        scene.background = new THREE.Color( 0xcccccc );
        scene.fog = new THREE.FogExp2( 0xcccccc, 0.0002 );

        scene.add( cursor );
        // lights
        const dirLight1 = new THREE.DirectionalLight( 0xffffff );
        dirLight1.position.set( 900, 1000, 700 );
        scene.add( dirLight1 );

        const dirLight2 = new THREE.DirectionalLight( 0x002288 );
        dirLight2.position.set( - 800, 1000, - 1000 );
        scene.add( dirLight2 );

        const light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 0.3 );
        scene.add( light );
}

function loadObj(name) {
        loader.load(
                // resource URL
                'files/'+name+'.obj',
                // called when resource is loaded
                function ( object ) {
                        scene.add( object );
                        object.traverse( function ( child ) {
                                if ( child.type =="Mesh" ) {
                                        intersectionObjects.push(child);
                                }
                        } );
                },
                // called when loading is in progresses
                function ( xhr ) {
                        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
                },
                // called when loading has errors
                function ( error ) {
                        console.log( 'An error happened' );
                }
        );
}

function loadCity() {
        const geometry = new THREE.BoxGeometry( 1, 1, 1 );
        geometry.translate( 0, 0.5, 0 );
        const material = new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } );

        for ( let i = 0; i < 500; i ++ ) {

                const mesh = new THREE.Mesh( geometry, material );
                mesh.position.x = Math.random() * 1600 - 800;
                mesh.position.y = 0;
                mesh.position.z = Math.random() * 1600 - 800;
                mesh.scale.x = 20;
                mesh.scale.y = Math.random() * 80 + 10;
                mesh.scale.z = 20;
                mesh.updateMatrix();
                mesh.matrixAutoUpdate = false;
                scene.add( mesh );
                intersectionObjects.push(mesh);
        }
        const planeGeometry = new THREE.PlaneGeometry( 10000, 10000 );
        const plane = new THREE.Mesh( planeGeometry);
        plane.rotateX( - Math.PI / 2);
        scene.add(plane);
        intersectionObjects.push(plane);
}

function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

        requestAnimationFrame( animate );
        
        controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true

        render();
}

function onDocumentMouseDown( event ) {
        //event.preventDefault();
        if (document.elementFromPoint(event.clientX, event.clientY).nodeName == "CANVAS") {
                mouseMoved = false;
        }
}

function onDocumentMouseUp( event ) {
        //event.preventDefault();

        if (document.elementFromPoint(event.clientX, event.clientY).nodeName == "CANVAS" && !mouseMoved){
                let color = new THREE.Color('#'+userName);
                addMarkerGeometry(cursor.position.x, cursor.position.y, cursor.position.z, color);
                addPointToDataBase(cursor.position.x, cursor.position.y, cursor.position.z, projectId);
        }
}

function onDocumentMouseMove( event ) {
        //event.preventDefault();
        mouseMoved = true;
        if (document.elementFromPoint(event.clientX, event.clientY).nodeName == "CANVAS") {
                mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
                mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
        }
}

function onFileDrop( event ) {
        console.log("file drop");
        console.log(event.dataTransfer.files, " files received");
        let file = event.dataTransfer.files[0];
        uploadFile(file)
}

function clearAllPointsForProject() {
        var message = JSON.stringify({action:"clearPoints", project: projectId});
        webSocket.send(message);
        console.log(message);
}

function clearMarkers(){
        for(var i = 0; i < markers.length; i++) {
                scene.remove(markers[i]);
        }
        markers = [];
}

function addMarkerGeometry(x,y,z, color) {
        console.log("addMarker");
        let marker = new THREE.Mesh( markerGeometry, new THREE.MeshStandardMaterial({color: color}) );
        marker.position.set(x,y,z);
        markers.push(marker);
        scene.add( marker );
}

function movePlayer(user, x, y, z) {
        if(userName == user) {
                return;
        }
        if(userCursors[user] == null){
                console.log("add player", user);
                const cursorGeometry = new THREE.SphereGeometry( 5, 20, 20);
                let color = new THREE.Color('#'+user);
                let cursorMesh = new THREE.Mesh( cursorGeometry, new THREE.MeshStandardMaterial({color: color}) );
                scene.add( cursorMesh );
                userCursors[user] = cursorMesh;
        }else{
                let m = userCursors[user];
                m.position.x = x;
                m.position.y = y;
                m.position.z = z;
        }
}

function render() {

        rayCaster.setFromCamera( mouse, camera );

        const intersects = rayCaster.intersectObjects( intersectionObjects );
        if (intersects[0] != cursor){
                if ( intersects.length > 0 ) {
                        let p = intersects[ 0 ].point;
                        cursor.position.copy(p);
                        var message = JSON.stringify({action:"userPosition", user:userName, x:p.x, y:p.y, z:p.z});
                        webSocket.send(message);
                } else {

                }
        }

        renderer.render( scene, camera );
}

function addProject(projectName) {
        console.log("addProject"+projectName);
        let table = document.getElementById('projectTable');
        let row = table.insertRow();
        let project = row.insertCell(0);
        project.innerHTML = projectName;
        project.onclick = function(event){
                console.log("clicked", event.toElement.innerHTML);
                monitorProject(event.toElement.innerHTML);
        };
}