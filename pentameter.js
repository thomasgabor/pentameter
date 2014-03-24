(function() {
	var timeslice = 100;
	var listening = false;
	function wait(thendo) {
		if (listening) {
			window.setTimeout(wait, timeslice, thendo);
		} else {
			thendo();
		};
	};

	var socket, behave;
	var lastresponse;
	pentameter = {};
	pentameter.init = function(_socket, _time) {
		socket = _socket
		behave = _time
		socket.recvall(function(response) {
			var message = JSON.parse(response);
			if ((!message.type) || (!message.author) || (!message.space)) {
				console.log("received malformed message")
			} else {
				listening = false;
				lastresponse = behave(message.type, message.author, message.space, message.parameter)
			};
		});
	};
	pentameter.term = function() {};
	pentameter.me = function() { return socket; };
	pentameter.tell = function(type, recipient, space, parameter) {
		var message = {
			"type": type,
			"recipient": recipient,
			"space": space,
			"parameter": parameter
		};
		return socket.send(JSON.stringify(message));
	};
	pentameter.process = behave;
	
	pentameter.talk = function(type, recipient, space, parameter) {
		wait(function() {
			if (listening) { alert("Internal error in Pentameter wait function!"); };
			listening = true;
			pentameter.tell(type, recipient, space, parameter);
		});
	};
	
}).call(this)