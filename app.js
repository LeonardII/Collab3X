const async = require('async')
const express = require('express')
const app = express()
const path = require('path');
const { start } = require('repl');
var databaseController = require('./controllers/dataBaseController');
var projectController = require('./controllers/projectController');
var WebSocketServer = require('websocket').server;

var http = require('http').Server(app);
var webSocketServer;

var config = require(__dirname+"/config.js");
const r = require('rethinkdb')

app.use(express.static(__dirname + '/public'))
app.use('/build/', express.static(path.join(__dirname, 'node_modules/three/build')));
app.use('/jsm/', express.static(path.join(__dirname, 'node_modules/three/examples/jsm')));
app.use('/files/', express.static(path.join(__dirname, 'files')));

function startExpress(connection) {
  app._rdbConn = connection;
  app.listen(config.express.port, () =>
    console.log('Visit http://127.0.0.1:3000')
  );
  console.log('Listening on port ' + config.express.port);
}

//startExpress(connection);
(function(app) {
	
	// connect to RethinkDB
	// create games database and game table if necessary
    r.connect(config.rethinkdb, function(err, conn) {
        if (err) {
            console.log('Could not open a connection to initialize the database: ' + err.message);
        }
        else {
            console.log('Connected.');
            app.set('rethinkdb.conn', conn);
            databaseController.createDatabase(conn, config.rethinkdb.db)
                .then(function() {
                    return databaseController.createTable(conn, 'points');
                })
				/*.then(function() {   turn this in to monitor all projects
					return gameController.monitorAllPoints(conn);
				})
                .catch(function(err) {
                    console.log('Error connecting to RethinkDB: ' + err);
                });*/
        }
    });
	
	// attach web socket server
	webSocketServer = new WebSocketServer({httpServer: http, autoAcceptConnections: false});
	webSocketServer.on('request', function(request) {
		// route connection to webSocketController
		projectController.onWebSocketConnection(app, request);
	});
})(app);

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// start server on the specified port and binding host
http.listen(config.express.port, '0.0.0.0', function() {
  console.log("Server started.")
});
