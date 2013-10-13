var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , rand = require("generate-key"),
  webRTC = require('webrtc.io').listen(8001);

app.use(express.static(__dirname + '/public'));
server.listen(8080);
// routing
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

// usernames which are currently connected to the chat
var users = [];

// rooms which are currently available in chat
io.sockets.on('connection', function (socket) {

  socket.on('join', function () {
    if(Object.keys(users).length == 0) {
      users.push(socket);
      socket.emit('updatechat', 'SERVER', 'Waiting on a friend ' + socket.id);
    } else {
      console.log('Finding partnet for: ' + socket.id);
      partner = users.pop();
      if ( partner.id != socket.id) {
        room = rand.generateKey(10);
        console.log("ROOM: " + room);
        socket.room = room;
        partner.room = room;
        socket.join(room);
        partner.join(room);
        partner.emit('match', room);
        socket.emit('match', room);
      } else {
        partner.emit('rejoin');
        socket.emit('rejoin');
      }
    }
  });

  socket.on('disconnect', function() {
    console.log(Object.keys(users));
    if(socket.room) {
      room = socket.room;
      socket.leave(room);
      partner = io.sockets.clients(room)[0];
      if(partner) {
        partner.leave(room);
        partner.emit('rejoin');
      }
    } else {
      var i = users.indexOf(socket);
      if(i != -1) {
        users.splice(i, 1);
      }
    }
  });

  socket.on('sendchat', function (data) {
    if(socket.room) {
      socket.broadcast.to(socket.room).emit('updatechat', 'stranger', data);
      socket.emit('updatechat', 'you', data);
      // io.sockets.in(socket.room).emit('updatechat', socket.id, data);
    } else {
      socket.emit('updatechat', socket.id, data);
    }
  });

});