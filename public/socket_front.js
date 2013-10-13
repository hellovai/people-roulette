var socket = io.connect('http://ec2-54-200-40-68.us-west-2.compute.amazonaws.com:8080');

// on connection to server, ask for user's name with an anonymous callback
socket.on('connect', function(){
	socket.emit('join');
});

socket.on('match', function (room) {
	$("#leavejoin").html('leave');
	$('#conversation').html("");
	$('#conversation').append('<em>Found a friend!</em><br />');
	roomJoiner(room);
});
function roomJoiner(room) {
	console.log("Attempting to join: " + room);
	if(roomFlag) {
		webrtc.joinRoom(room);
	} else {
		console.log("Not yet ready to join");
		setTimeout(function() { roomJoiner(room); }, 1000);
	}
}
// listener, whenever the server emits 'updatechat', this updates the chat body
socket.on('updatechat', function (flag, data) {
	var sender = "Partner"
	if(flag) sender = "You"
	$('#conversation').append('<b>'+ sender + ':</b> ' + data + '<br>');
});

socket.on('notify', function (data) {
	$('#conversation').append('<em>' + data + '</em><br>');
});

socket.on('rejoin', function () {
	webrtc.leaveRoom(webrtc.roomName);
	$('#conversation').append('<em>Partner has left!</em><br />');
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

	//when the client clicks leave
	$('#leavejoin').click( function() {

		$('#conversation').append('<em>Left the room!</em><br />');
		if($(this).attr("value") == "leave") {
			socket.emit('leave');
			webrtc.leaveRoom(webrtc.room);
			$("#leavejoin").html('join');
		} else {
			socket.emit('join');
			$("#leavejoin").html('joining');
		}
	});

	// when the client hits ENTER on their keyboard
	$('#data').keypress(function(e) {
		if(e.which == 13) {
			$(this).blur();
			$('#datasend').focus().click();
		}
	});
});
