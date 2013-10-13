var socket = io.connect('http://ec2-54-200-40-68.us-west-2.compute.amazonaws.com:8080');

// on connection to server, ask for user's name with an anonymous callback
socket.on('connect', function(){
	socket.emit('join');
});

socket.on('match', function (room) {
	$('#conversation').html("");
	$('#conversation').append('Found a friend! <br />');
});
function roomJoiner(room) {
	if(roomFlag) {
		webrtc.joinRoom(room);
	} else {
		setTimeout(function() { roomJoiner(room); }, 1000);
	}
}
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
