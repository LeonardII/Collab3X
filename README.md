1. Start rethinkdb server and add a db 'CollabDB'
2. Add table 'points' to CollabDB
3. You can add a point to table like this: ```r.db("CollabDB").table('points').insert([{x: 10, y:20, z:30}])```
4. In Collab3X directory: 
5. ```npm install```
6. ```npm start```
