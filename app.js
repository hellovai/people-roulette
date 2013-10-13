var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , rand = require("generate-key")
  , uuid = require('node-uuid')
  , webrtc = require('socket.io').listen(8001);

app.use(express.static(__dirname + '/public'));
server.listen(8080);
// routing
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

// Set up for main communication channels
// usernames which are currently connected to the chat
var users = [];
// rooms which are currently available in chat
io.sockets.on('connection', function (socket) {
  socket.on('join', function () {
    if(Object.keys(users).length == 0) {
      users.push(socket);
      socket.emit('notify', 'Waiting on a partner');
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

  socket.on('leave', function() {
    if(socket.room) {
      room = socket.room;
      socket.leave(room);
      partner = io.sockets.clients(room)[0];
      if(partner) {
        partner.leave(room);
        partner.emit('rejoin');
      }
    }
  });

  socket.on('disconnect', function() {
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
      socket.broadcast.to(socket.room).emit('updatechat', false, data);
      // io.sockets.in(socket.room).emit('updatechat', socket.id, data);
    }
    socket.emit('updatechat', true, data);
  });

});

//set up for webrtc-av
function describeRoom(name) {
    var clients = webrtc.sockets.clients(name);
    var result = {
        clients: {}
    };
    clients.forEach(function (client) {
        result.clients[client.id] = client.resources;
    });
    return result;
}

function safeCb(cb) {
    if (typeof cb === 'function') {
        return cb;
    } else {
        return function () {};
    }
}

webrtc.sockets.on('connection', function (client) {
    client.resources = {
        screen: false,
        video: true,
        audio: false
    };

    // pass a message to another id
    client.on('message', function (details) {
        var otherClient = webrtc.sockets.sockets[details.to];
        if (!otherClient) return;
        details.from = client.id;
        otherClient.emit('message', details);
    });

    client.on('shareScreen', function () {
        client.resources.screen = true;
    });

    client.on('unshareScreen', function (type) {
        client.resources.screen = false;
        if (client.room) removeFeed('screen');
    });

    client.on('join', join);

    function removeFeed(type) {
        webrtc.sockets.in(client.room).emit('remove', {
            id: client.id,
            type: type
        });
    }

    function join(name, cb) {
        // sanity check
        if (typeof name !== 'string') return;
        // leave any existing rooms
        if (client.room) removeFeed();
        safeCb(cb)(null, describeRoom(name))
        client.join(name);
        client.room = name;
    }

    // we don't want to pass "leave" directly because the
    // event type string of "socket end" gets passed too.
    client.on('disconnect', function () {
        removeFeed();
    });
    client.on('leave', removeFeed);

    client.on('create', function (name, cb) {
        if (arguments.length == 2) {
            cb = (typeof cb == 'function') ? cb : function () {};
            name = name || uuid();
        } else {
            cb = name;
            name = uuid();
        }
        // check if exists
        if (webrtc.sockets.clients(name).length) {
            safeCb(cb)('taken');
        } else {
            join(name);
            safeCb(cb)(null, name);
        }
    });
});

