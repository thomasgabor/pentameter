(function() {
	var defaultspheres = ["networking"];
	var defaultcode = "json";

	var socket, behave, code, options;
	var spheres = {};
	spheres.id = function (continuation, direction) {
		return function (type, author, space, parameter) {
			return behave(type, author, space, parameter);
		};
	};
	spheres.networking = function (continuation, direction) {
		if ( direction == "in" ) {
			return function (type, author, space, parameter) {
				if (space == "pentameter.pending") {
					var response = [];
					//$("#test").text($("#test").text() + JSON.stringify(parameter));
					$.each(parameter, function(i, item) {
						$.each(item.messages, function(a, answer) {
							response[a] = behave(answer.type, answer.author, answer.space, answer.parameter);
						});
					});
					return [{messages: response}];
				};
				if (space == "pentameter.returning") {
					return null;
				};
				return continuation(type, author, space, parameter);
			};
		} else {
			return null;
		};
	};
	var codes = {};
	codes.json = {
		encode: JSON.stringify,
		decode: JSON.parse
	};

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
		_spheres = typeof _spheres == "undefined" ? defaultspheres : _spheres;
		if ( typeof _spheres == "object" ) {
			for( var i = 0; i < _spheres.length; i++ ) {
				var sphere = null;
				if ( typeof _spheres[i] == "string" ) {
					sphere = spheres[_spheres[i]];
				};
				if ( typeof _spheres[i] == "function" ) {
					sphere = _spheres[i];
				};
				var instance = sphere(behave, "in");
				behave = instance ? instance : behave;
			};
		};
		code = codes[defaultcode];
		if ( typeof _codename == "string" && codes[_codename] ) {
			code = codes[_defaultcode];
		};
		if ( typeof _codename == "object" && typeof _codename.encode == "function" && typeof _codename.decode == "function" ) {
			code = _codename;
		};
		options           = typeof options           === 'object'    ? options           : {};
		options.timeslice = typeof options.timeslice === 'number'    ? options.timeslice : 100;
		options.timeout   = typeof options.timeout   === 'number'    ? options.timeout   : 20;
		options.ontimeout = typeof options.ontimeout === 'function'  ? options.ontimeout : function() {
			alert("Pentameter connection timed out! Check your setup!")
		};
		socket.recvall(function(response) {
			var message = code.decode(response);
			if ((!message.type) || (!message.author) || (!message.space)) {
				console.log("received malformed message")
			} else {
				listening = false;
				lastresponse = behave(message.type, message.author, message.space, message.parameter);
				if ( typeof lastresponse == "object" && lastresponse != null ) {
					//$("#test").text($("#test").text() + JSON.stringify(lastresponse) + " ");
					pentameter.talk("put", "dummy", "pentameter.returning", lastresponse);
				};
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
		return socket.send(code.encode(message));
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