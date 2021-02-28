const async = require('async')
const express = require('express')
const app = express()
const path = require('path')

var config = require(__dirname+"/config.js");
const r = require('rethinkdb')

app.use(express.static(__dirname + '/public'))
app.use('/build/', express.static(path.join(__dirname, 'node_modules/three/build')));
app.use('/jsm/', express.static(path.join(__dirname, 'node_modules/three/examples/jsm')));

app.route('/points').get(get);

app.route('/book')
  .get(function(req, res) {
    res.send('Get a random book');
  })
  .post(function(req, res) {
    res.send('Add a book');
  })
  .put(function(req, res) {
    res.send('Update the book');
  });


//If we reach this middleware the route could not be handled and must be unknown.
app.use(handle404);
//Generic error handling middleware.
app.use(handleError);

function get(req, res, next) {
  console.log("moinmeister");
  r.table('points').run(req.app._rdbConn, function(err, cursor) {
    if(err) {
      return next(err);
    }

    //Retrieve all the todos in an array.
    cursor.toArray(function(err, result) {
      if(err) {
        return next(err);
      }

      res.json(result);
    });
  });
}

function startExpress(connection) {
  app._rdbConn = connection;
  app.listen(config.express.port, () =>
    console.log('Visit http://127.0.0.1:3000')
  );
  console.log('Listening on port ' + config.express.port);
}

/*
 * Generic error handling middleware.
 * Send back a 500 page and log the error to the console.
 */
function handleError(err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({err: err.message});
}
/*
 * Page-not-found middleware.
 */
function handle404(req, res, next) {
  res.status(404).end('not found');
}

/*
 * Connect to rethinkdb, create the needed tables/indexes and then start express.
 * Create tables/indexes then start express
 */
async.waterfall([
  function connect(callback) {
    r.connect(config.rethinkdb, callback);
  },
  function createDatabase(connection, callback) {
    //Create the database if needed.
    r.dbList().contains(config.rethinkdb.db).do(function(containsDb) {
      return r.branch(
        containsDb,
        {created: 0},
        r.dbCreate(config.rethinkdb.db)
      );
    }).run(connection, function(err) {
      callback(err, connection);
    });
  },
  function createTable(connection, callback) {
    //Create the table if needed.
    r.tableList().contains('todos').do(function(containsTable) {
      return r.branch(
        containsTable,
        {created: 0},
        r.tableCreate('todos')
      );
    }).run(connection, function(err) {
      callback(err, connection);
    });
  },
  function createIndex(connection, callback) {
    //Create the index if needed.
    r.table('todos').indexList().contains('createdAt').do(function(hasIndex) {
      return r.branch(
        hasIndex,
        {created: 0},
        r.table('todos').indexCreate('createdAt')
      );
    }).run(connection, function(err) {
      callback(err, connection);
    });
  },
  function waitForIndex(connection, callback) {
    //Wait for the index to be ready.
    r.table('todos').indexWait('createdAt').run(connection, function(err, result) {
      callback(err, connection);
    });
  }
], function(err, connection) {
  if(err) {
    console.error(err);
    process.exit(1);
    return;
  }

  startExpress(connection);
});