
r.dbCreate("CollabDB");
r.db("CollabDB").tableCreate('points');
r.db("CollabDB").table('points').insert([{project: "Stadt", x: 10, y:20, z:30}]);
r.db("CollabDB").table('points').insert([{project: "Stadt", x: 20, y:30, z:30}]);
r.db("CollabDB").table('points').insert([{project: "Haus", x: 20, y:30, z:30}]);

