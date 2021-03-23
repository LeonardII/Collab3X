var Client = require('../models/client');
var r = require('rethinkdb');

var changesCursor = null;
var clients = [];

module.exports.getPoints = function(app) {
	var conn = app.get('rethinkdb.conn');
	return r.table('points').run(conn).then(function(cursor) {
		return cursor.toArray();
	});
};

// module.exports.monitorAllPoints = function(conn) {
// 	return r.table('points').changes().run(conn)
// 		.then(function(cursor) {
// 			changesCursor = cursor;
// 			cursor.each(function(err, row) {
// 				if (err) {
// 					throw err;
// 				}
// 				else {
// 					// send every point to every client
// 					var pointJson = JSON.stringify(row.new_val, null, 2);
// 					for (var i=0; i<clients.length; i++) {
// 						console.log(clients[i].project, pointJson.project);
// 						if (clients[i].project = pointJson.project) {
// 							clients[i].connection.sendUTF(pointJson);
// 						}
// 					}
// 				}
// 			});
// 		})
// 		.catch(function(err) {
// 			console.log('Error monitoring all points: ' + err);
// 		});
// };

module.exports.onWebSocketConnection = function(app, request) {
    console.log(new Date() + ' WebSocket connection accepted.');
	var connection = request.accept(null, request.origin);
	var userName = Math.random().toString(16).substring(2,8);
	var client = new Client(connection, userName, app);
	clients.push(client);
	client.setUserName(userName);
	
	//client.addProject("ModernesHaus", "files/ModernesHaus.obj", app);
	//client.addProject("Jeep", "files/Jeep.obj", app);
	//client.addProject("Banana", "files/Banana.obj", app);

	client.monitorProjects(app);
	// call onMessageReceivedFromClient when a new message is received from the client
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            //console.log(new Date() + ' WebSocket server received message: ' + message.utf8Data);
            onMessageReceivedFromClient(client, JSON.parse(message.utf8Data), app);
        }
    });
    connection.on('close', function(reasonCode, description) {
		// remove the client from the array on close
        clients.splice(clients.indexOf(client), 1);
        console.log(new Date() + ' WebSocket client ' + connection.remoteAddress + ' disconnected.');
	});
	
};

var onMessageReceivedFromClient = function(client, message, app) {
	switch(message.action){
    	case "monitorProject":
			console.log(new Date() + ' Request received to monitor project ' + message.project + '.');
			client.monitorPointsByProject(message.project, app);
			break;
		case "addPoint":
			console.log(new Date() + ' Request received to add point ' + message.project + '.');
			var point = {x: message.x, y:message.y, z:message.z};
			client.addPointToProject(message.project, point, app);
			break;
		case "userPosition":
			client.updatePosition(message.x, message.y, message.z, app);
			break;
		case "addProject":
			client.addProject(message.name, message.file, app);
			break;
		case "clearPoints":
			console.log("clearpoints in "+message.project);
			client.clearPoints(message.project, app);
			break;
	}
};