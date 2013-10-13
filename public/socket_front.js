var socket = io.connect('http://ec2-54-200-40-68.us-west-2.compute.amazonaws.com:8080');


function roomJoiner(room, delay) {
	console.log("Attempt " + delay + " to join: " + room);
	if(roomFlag) {
		webrtc.joinRoom(room);
	} else {
		if (delay > Math.pow(2, 10) ) {
			console.log("Failed to join");
			return;
		}
		console.log("Not yet ready to join");
		setTimeout(function() { roomJoiner(room, delay * 2); }, delay * 10);
	}
}

function writeMessage (message, classes) {
	$("#conversation").append( "<font class=\"message " + classes + " \">" + message + "</font><br />");
	$("#conversation").scrollTop($("#conversation")[0].scrollHeight);
}

// on connection to server, ask for user's name with an anonymous callback
socket.on('connect', function(){
	socket.emit('join');
});

socket.on('match', function (room) {
	$("#leavejoin").attr('value','leave');
	$('#conversation').html("");
	writeMessage("Found a friend!", "alert");
	roomJoiner(room, 1);
});
// listener, whenever the server emits 'updatechat', this updates the chat body
socket.on('updatechat', function (flag, data) {
	var sender = "other";
	if(flag) sender = "self";
	writeMessage(data, sender);
});

socket.on('notify', function (data) {
	writeMessage(data, "alert");
});

socket.on('rejoin', function () {
	webrtc.leaveRoom(webrtc.roomName);
	writeMessage("Partner has left!", "alert");
	socket.emit('join');
	$("#leavejoin").attr('value', 'joining');
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
		if(message.length > 0 ) {
			socket.emit('sendchat', message);
		}
		$("#data").focus();
	});

	//when the client clicks leave
	$('#leavejoin').click( function() {

		$('#conversation').append('<em>Left the room!</em><br />');
		if($(this).attr("value") == "leave") {
			socket.emit('leave');
			webrtc.leaveRoom(webrtc.room);
			$(this).attr('value', 'join');
		} else if ($(this).attr("value") == "join"){
			socket.emit('join');
			$(this).attr('value', 'joining');
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
