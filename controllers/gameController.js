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

module.exports.monitorAllPoints = function(conn) {
	return r.table('points').changes().run(conn)
		.then(function(cursor) {
			changesCursor = cursor;
			cursor.each(function(err, row) {
				if (err) {
					throw err;
				}
				else {
					// send every game to every client
					var gameJson = JSON.stringify(row.new_val, null, 2);
					for (var i=0; i<clients.length; i++) {
						if (true) {
							clients[i].connection.sendUTF(gameJson);
						}
					}
				}
			});
		})
		.catch(function(err) {
			console.log('Error monitoring all games: ' + err);
		});
};

module.exports.onWebSocketConnection = function(app, request) {
    console.log(new Date() + ' WebSocket connection accepted.');
    var connection = request.accept(null, request.origin);
	var client = new Client(connection, app);
    clients.push(client);
	// call onMessageReceivedFromClient when a new message is received from the client
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log(new Date() + ' WebSocket server received message: ' + message.utf8Data);
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
    if (message.type == "monitorProject") {
		console.log(new Date() + ' Request received to monitor project ' + message.project + '.');
		client.monitorPointsByProject(message.project, app);
	}
	if (message.type == "addPoint") {
		console.log(new Date() + ' Request received to add point ' + message.project + '.');
		var point = {x: message.x, y:message.y, z:message.z};
		client.addPointToProject(message.project, point, app);
	}
};