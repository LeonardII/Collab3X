var projectController = require('../controllers/projectController');
//var three = require('../public/client');
var r = require('rethinkdb');
var fs = require('fs');

// when a client is first created it will monitor all games
function Client(connection, app) {
    this.connection = connection;
}

Client.prototype.monitorPointsByProject = function(project, app) {
	this.project = project;
	var webSocketConnection = this.connection;
    var dbConnection = app.get('rethinkdb.conn');
	r.table('points').filter(r.row("project").eq("Stadt")).changes({includeInitial:true}).run(dbConnection,
		function(err, cursor) {
			// store cursor, so we can stop if necessary
			this.monitoringProjectIdCursor = cursor;
			cursor.each(function(err, row) {
				if (err) {
					throw err;
				}
				else {
					// send the new point value to the client
					var pointJson = JSON.stringify({t:"marker", data:row.new_val}, null, 2);
					webSocketConnection.sendUTF(pointJson);
					//console.log("db changed", pointJson)
				}
			});
		})
		.catch(function(err) {
			console.log('Error monitoring project ' + projectId + ': ' + err);
		});
		r.table('positions').get("David").changes({includeInitial:true}).run(dbConnection,
			function(err, cursor) {
				// store cursor, so we can stop if necessary
				this.monitoringProjectIdCursor = cursor;
				cursor.each(function(err, row) {
					if (err) {
						throw err;
					}
					else {
						// send the new point value to the client
						var pointJson = JSON.stringify({t:"pos", data:row.new_val}, null, 2);
						webSocketConnection.sendUTF(pointJson);
						//console.log("db changed", pointJson)
					}
				});
			})
			.catch(function(err) {
				console.log('Error monitoring project ' + projectId + ': ' + err);
			});
};

Client.prototype.addPointToProject = function(project, point, app) {
	/*if (this.project != project){
		console.log("ERror project does not match, when adding point", this.project, project);
		return;
	}*/
    var dbConnection = app.get('rethinkdb.conn');
    r.table('points').insert([{x:point.x, y:point.y, z:point.z, project:project}]).run(dbConnection);
};

Client.prototype.addProject = function(projectName, filePath, app) {
	var dbConnection = app.get('rethinkdb.conn');

	fs.readFile(filePath, function(err, contents) {
		r.table('projects').insert([{
			name: projectName,
			file: contents || ''
		}]).run(dbConnection);
	});
};

Client.prototype.updatePosition = function(user, x, y, z, app) {
	var dbConnection = app.get('rethinkdb.conn');
	r.table('positions').insert({
		user: user,
		x:x,
		y:y,
		z:z
	}, {conflict:"update"}).run(dbConnection);
};

Client.prototype.updateNumberOfUser = function(user, x, y, z, app) {
	var dbConnection = app.get('rethinkdb.conn');
	r.table('projects').get(Pfeil).update(){
		
	}, {conflict:"update"}).run(dbConnection);
};

// export the class
module.exports = Client;