var socket = io.connect('http://192.168.0.7:8080');

// on connection to server, ask for user's name with an anonymous callback
socket.on('connect', function(){
	socket.emit('join');
});

socket.on('match', function (room) {
	$('#conversation').html("");
	$('#conversation').append('Found a friend! <br />');
	if(roomFlag) {
		webrtc.joinRoom(room);
	} else {
		$('#conversation').append('Your video is not ready! <br />');
	}
});

// listener, whenever the server emits 'updatechat', this updates the chat body
socket.on('updatechat', function (username, data) {
	$('#conversation').append('<b>'+username + ':</b> ' + data + '<br>');
});

socket.on('rejoin', function () {
	$('#conversation').append('<b>SERVER</b> your friend hates you<br>');
	socket.emit('join');
});

socket.on('webchat', function(data) {
	webrtc.join(data);
});

// on load of page
$(function(){
	// when the client clicks SEND
	$('#datasend').click( function() {
		var message = $('#data').val();
		$('#data').val('');
		// tell server to execute 'sendchat' and send along one parameter
		socket.emit('sendchat', message);
	});

	// when the client hits ENTER on their keyboard
	$('#data').keypress(function(e) {
		if(e.which == 13) {
			$(this).blur();
			$('#datasend').focus().click();
		}
	});
});