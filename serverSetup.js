
r.dbCreate("CollabDB");
r.db("CollabDB").tableCreate('points');
r.db("CollabDB").table('points').insert([{project: "Stadt", x: 10, y:20, z:30}]);
r.db("CollabDB").table('points').insert([{project: "Stadt", x: 20, y:30, z:30}]);
r.db("CollabDB").table('points').insert([{project: "Haus", x: 20, y:30, z:30}]);
r.db("CollabDB").table('points').insert([{project: "Stadt", x: 90, y:20, z:40}]);
r.db("CollabDB").table('points').insert([{project: "Stadt", x: 80, y:10, z:20}]);
r.db("CollabDB").table('points').insert([{project: "Haus", x: 70, y:10, z:20}]);
