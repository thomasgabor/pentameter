(function() {
	var socket, behave, options;

	var listening = false;
	var currenttries = 0;
	function wait(thendo) {
		if (listening) {
			if ( currenttries > options.timeout ) {
				currenttries = 0;
				options.ontimeout();
			} else {
				currenttries = currenttries + 1;
				window.setTimeout(wait, options.timeslice, thendo);
			};
		} else {
			currenttries = 0;
			thendo();
		};
	};

	var lastresponse;
	pentameter = {};
	pentameter.init = function(_socket, _time, _spheres, _codename, _options) {
		socket = _socket;
		behave = _time;
		options           = typeof options           === 'object'    ? options           : {};
		options.timeslice = typeof options.timeslice === 'number'    ? options.timeslice : 100;
		options.timeout   = typeof options.timeout   === 'number'    ? options.timeout   : 20;
		options.ontimeout = typeof options.ontimeout === 'function'  ? options.ontimeout : function() {
			alert("Pentameter connection timed out! Check your setup!")
		};
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
	pentameter.fetch = function(parameter) {
		parameter = parameter || [{}];
		pentameter.talk("get", "dummy", "pentameter.pending", parameter);
	};
	
}).call(this)