var projectController = require('../controllers/projectController');
//var three = require('../public/client');
var r = require('rethinkdb');
var fs = require('fs');

// when a client is first created it will monitor all games
function Client(connection, userName, app) {
	this.connection = connection;
	this.userName = userName;
}

Client.prototype.monitorProjects = function(app) {
	var webSocketConnection = this.connection;
	var dbConnection = app.get('rethinkdb.conn');
	r.table('projects').changes({includeInitial:true}).run(dbConnection,
		function(err, cursor) {
			this.projectsCursor = cursor;
			cursor.each(function(err, row) {
				if (err) {
					throw err;
				}
				else {
					var pointJson = JSON.stringify({t:"addProject", data:row.new_val}, null, 2);
					webSocketConnection.sendUTF(pointJson);
					//console.log("db changed", pointJson)
				}
			});
		})
		.catch(function(err) {
			console.log('Error monitoring project ' + projectId + ': ' + err);
		});
}

Client.prototype.monitorPointsByProject = function(project, app) {
	this.project = project;
	var webSocketConnection = this.connection;
	var dbConnection = app.get('rethinkdb.conn');
	
	if(this.pointsCursor)
		this.pointsCursor.close();
	if(this.posCursor)
		this.posCursor.close();

	r.table('projects').get(project)
	.run(dbConnection, function(err, result) {
        if (err) throw err;
		console.log(project, result);
		let buffer = Buffer.from(result.file);
		webSocketConnection.emit('projectFile',buffer);
	});
	

	r.table('points').filter(r.row("project").eq("Haus")).changes({includeInitial:true}).run(dbConnection,
		function(err, cursor) {
			// store cursor, so we can stop if necessary
			this.pointsCursor = cursor;
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
	r.table('positions').changes({includeInitial:true}).run(dbConnection,
		function(err, cursor) {
			// store cursor, so we can stop if necessary
			this.posCursor = cursor;
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
    r.table('points').insert([{x:point.x, y:point.y, z:point.z, project:project, user:this.userName}]).run(dbConnection);
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

Client.prototype.setUserName = function(userName) {
	var webSocketConnection = this.connection;
	var nameJson = JSON.stringify({t:"setUserName", data:{name: userName}}, null, 2);
	webSocketConnection.sendUTF(nameJson);
};

Client.prototype.clearPoints = function(project, app) {
	var dbConnection = app.get('rethinkdb.conn');
	r.table('points').filter({"project": project}).delete().run(dbConnection);

	var webSocketConnection = this.connection;
	var clearJson = JSON.stringify({t:"clear", data:{project: project}}, null, 2);
	webSocketConnection.sendUTF(clearJson);
};

Client.prototype.updatePosition = function(x, y, z, app) {
	var dbConnection = app.get('rethinkdb.conn');
	
	r.table('positions').insert({
		user: this.userName,
		x:x,
		y:y,
		z:z
	}, {conflict:"update"}).run(dbConnection);
};

Client.prototype.updateNumberOfUser = function(user, x, y, z, app) {
	var dbConnection = app.get('rethinkdb.conn');
	r.table('projects').get(Pfeil).update({
		
	}, {conflict:"update"}).run(dbConnection);
};

// export the class
module.exports = Client;