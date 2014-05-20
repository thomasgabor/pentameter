var hadesConnected = false;
var hadesSynchronized = false;
var hadesTicked = false;

var hadesMode = null;
var hadesState = null;
var hadesAdvancedState = null;
var hadesEdition = "text";
var hadesRuncount = 0;
var hadesPeriod = 0;

var world = {};
var state = {};

var editions = {};


editions.text = {};
editions.text.init = function() {return null;};
editions.text.updateWorld = function(newworld) {
	world = newworld;
	return null;
};
editions.text.updateState = function(newstate) {
	state = newstate;
	var htmlstring = "";
	$.each(newstate, function(name, body) {
		htmlstring += ("<dt>" + name + "</dt><dd><dl>");
		$.each(body, function(property, value) {
			htmlstring += ("<dt>" + property + "</dt><dd>" + JSON.stringify(value) + "</dd>");
		});
		htmlstring += ("</dl></dd>");
	});
	$("#bodies").html(htmlstring);
}


editions.sisyphos_graph = {};
editions.sisyphos_graph.configuration = {};
editions.sisyphos_graph.configuration.nodeColor = "#888888";
editions.sisyphos_graph.configuration.visitedColor = "#222222";
editions.sisyphos_graph.configuration.activeColor = "#ff8800";
editions.sisyphos_graph.configuration.edgeColor = "#888888";
editions.sisyphos_graph.auxiliaries = {};
editions.sisyphos_graph.auxiliaries.select = function(s, e) {
	e.data.node.originalColor = e.data.node.color;
	e.data.node.color = editions.sisyphos_graph.configuration.activeColor;
	$("#current-node").removeClass("used=false");
	$("#current-node").addClass("used=true");
	$(".current-node-id\\!").text(e.data.node.id);
	$(".current-node-label\\!").text(e.data.node.label);
	$(".current-node-x\\!").text(e.data.node.x);
	$(".current-node-y\\!").text(e.data.node.y);
	var htmlstring = "";
	if ( world.nodes[e.data.node.x] && world.nodes[e.data.node.x][e.data.node.y] ) {
		var node = world.nodes[e.data.node.x][e.data.node.y];
		$.each(node.objects, function(o, obj) {
			htmlstring += "<li>"+ obj.id + "</li>";
		});
	};
	$(".current-node-objects\\!").html(htmlstring);
	htmlstring = "";
	$.each(state, function(name, body) {
		if ( body.position && body.position.x == e.data.node.x && body.position.y == e.data.node.y ) {
			htmlstring += "<li>" + name + "</li>";
		};
	});
	$(".current-node-bodies\\!").html(htmlstring);
};
editions.sisyphos_graph.auxiliaries.unselect = function(s) {
	s.graph.nodes().forEach(function(n) {
	  n.color = n.originalColor;
	});
	$("#current-node").removeClass("used=true");
	$("#current-node").addClass("used=false");
	$(".current-node-id\\!").text("");
	$(".current-node-label\\!").text("");
	$(".current-node-x\\!").text("");
	$(".current-node-y\\!").text("");
	$(".current-node-objects\\!").html("");
	$(".current-node-bodies\\!").html("");
	s.refresh();
};
var s; //TODO: make this more object-oriented!!
editions.sisyphos_graph.init = function() {
};
editions.sisyphos_graph.updateWorld = function(newworld) {
	world = newworld;
	$("#world").addClass("open");
	//$("#test").text(JSON.stringify(newworld));
	s = new sigma({
		renderer: {
			container: document.getElementById('container'),
			type: 'canvas'
		},
		settings: {
			minNodeSize: 6,
			labelSizeRatio: 6,
			labelThreshold: 2,
			defaultLabelSize: 16,
			edgeColor: "default",
			defaultEdgeColor: editions.sisyphos_graph.configuration.edgeColor
		}
	});
	var current = null;
	s.bind("clickNode", function(e) {
		editions.sisyphos_graph.auxiliaries.unselect(s);
		if ( current == e.data.node ) {
			current = null;
		} else {
			current = e.data.node;
			editions.sisyphos_graph.auxiliaries.select(s, e);
		};
		s.refresh();
	});
	$.each(newworld.nodes, function(x, rest) {
		$.each(rest, function(y, node) {
			var graphNode = {
				id: "(" + node.x + "," + node.y + ")",
				label: "(" + node.x + "," + node.y + ")",
				x: node.x,
				y: node.y,
				size: 1,
				color: editions.sisyphos_graph.configuration.nodeColor,
			    originalColor: editions.sisyphos_graph.configuration.nodeColor
			};
			s.graph.addNode(graphNode);
		});
	});	
	var i = 0;
    $.each(newworld.edges, function(fromx, rest) {
		$.each(rest, function(fromy, rest) {
			$.each(rest, function(tox, rest) {
				$.each(rest, function(toy, edge) {
					i++;
					s.graph.addEdge({
						id: "e" + i,
						source: "(" + edge.from.x + "," + edge.from.y + ")",
						target: "(" + edge.to.x + "," + edge.to.y + ")",
						size: 4
					});
				});
			});
		});
    });
    s.refresh();
};
editions.sisyphos_graph.updateState = function(newstate) {
	editions.text.updateState(newstate);
	s.graph.nodes().forEach(function(n) {
          n.color = editions.sisyphos_graph.configuration.nodeColor;
		  n.originalColor = editions.sisyphos_graph.configuration.nodeColor;
    });
	$.each(state, function(name, body) {
		if ( body.position && body.position.x != null && body.position.y != null ) {
			var graphNode = s.graph.nodes("("+body.position.x+","+body.position.y+")");
			if ( graphNode ) {
				graphNode.color = editions.sisyphos_graph.configuration.visitedColor;
				graphNode.originalColor = editions.sisyphos_graph.configuration.visitedColor;
			};
		};
	});
	s.refresh();
};

function checkInbox() {
	//pentameter.talk("get", $("#hades").val(), "net.life", [{a:42}]);
	pentameter.talk("get", "dummy", "pentameter.pending", [{bother:$("#hades").val()}]);
	if ( hadesState != "dead" ) {
		setTimeout(checkInbox, 1000);
	};
}

function buildDynamicCSS(property, values) {
	rules = "";
	var first = true;
	$.each(values, function(v, value) {
		if ( !first ) {
			rules += ",\n";
		};
		rules += "body:not(." + property + "\\=" + value + ") ." + property + "\\=" + value;
		first = false;
	});
	rules += "\n{\n  display: none;\n}\n\n";
	/*first = true;
	$.each(values, function(v, value) {
		if ( !first ) {
			rules += ",\n";
		};
		rules += "body." + property + "\\=" + value + " ." +  property + "\\=" + value;
		first = false;
	});
	rules += "{ display: block; }\n\n";*/
	return rules;
}

function hadesUpdate() {
	if ( hadesState != "running" ) {
		hadesTicked = false;
	};
	$(".hades-mode\\!").text(hadesMode);
	$(".hades-state\\!").text(hadesState + " " + JSON.stringify(hadesAdvancedState));
	$(".hades-edition\\!").text(hadesEdition);
	$(".hades-runcount\\!").text(hadesRuncount);
	$(".hades-period\\!").text(hadesPeriod);
	if ( hadesAdvancedState ) {
		$.each(hadesAdvancedState, function(name, value) {
			if ( name ) {
				$(".hades-state-" + name + "\\!").text(value);
			};
		});
	};
	$("body").removeClass("hades-mode=server hades-mode=ephemeral");
	$("body").addClass("hades-mode=" + hadesMode);
	$("body").removeClass("hades-state=booting hades-state=constructing hades-state=running hades-state=concluding hades-state=dead");
	$("body").addClass("hades-state=" + hadesState);
	$("body").removeClass(function(index, oldclassesstring) {
		var removing = '',
		oldclasses = oldclassesstring.split(' ');
		for(var i = 0; i < oldclasses.length; i++ ) {
			 if( /^hades-edition=/.test(oldclasses[i]) ) {
				 removing += oldclasses[i] + ' ';
			 }
		}
		return removing;
	});
	$("body").addClass("hades-edition=" + hadesEdition);
	$("body").removeClass("hades-ticked=true hades-ticked=false");
	$("body").addClass("hades-ticked=" + (hadesTicked ? "true" : "false"));
	$("body").removeClass("hades-connected=true hades-connected=false");
	$("body").addClass("hades-connected=" + (hadesConnected ? "true" : "false"));
	$("body").removeClass("hades-synchronized=true hades-synchronized=false");
	$("body").addClass("hades-synchronized=" + (hadesSynchronized ? "true" : "false"));
	$("body").removeClass("hades-ticked=true hades-ticked=false");
	$("body").addClass("hades-ticked=" + (hadesTicked ? "true" : "false"));
}

function orpheus(type, author, space, parameter) {
	$(".lastmessage-type\\!").text(type);
	$(".lastmessage-author\\!").text(author);
	$(".lastmessage-space\\!").text(space);
	$(".lastmessage-parameter\\!").text(JSON.stringify(parameter));
	if ( space == "pentameter.name" || space == "pentameter.me" ) {
		$.each(parameter, function(i, item) {
			$(".dike-hexametername\\!").text(item.name);
		});
	};
	if ( space == "server.mode" ) {
		$.each(parameter, function(i, item) {
			if ( item.mode ) {
				hadesMode = item.mode;
				hadesUpdate();
			};
		});
	};
	if ( space == "server.state" || space == "hades.subscription.server.state" ) {
		$.each(parameter, function(i, item) {
			var state = item.state ? item.state.type : item.type;
			if ( state ) {
				if ( hadesState != "running" && state == "running" && hadesSynchronized ) {
					pentameter.talk("put", $("#hades").val(), "server.tocks", [{}]);
				};
				hadesState = state;
				hadesAdvancedState = item.state ? item.state : item;
				hadesUpdate();
			};
		});
	};
	if ( space == "server.runcount" ) {
		$.each(parameter, function(i, item) {
			if ( item.runcount ) {
				hadesRuncount = item.runcount;
			};
		});
	};
	if ( space == "hades.ticks" ) {
		if ( hadesState == "running" ) {
			hadesTicked = true;
			hadesUpdate();
		};
	};
	if ( space == "server.untocked" ) {
		$.each(parameter, function(i, item) {
			$(".hades-untocked\\!").text(JSON.stringify(item));
			$(".hades-untocked-timestamp\\!").text(hadesRuncount + ":" + hadesPeriod);
		});
	};
	if ( space == "state" ) {
		$.each(parameter, function(i, item) {
			if ( editions[hadesEdition].updateState ) {
				editions[hadesEdition].updateState(item);
			};
		});
	};
	if ( space == "hades.subscription.state" ) {
		$.each(parameter, function(i, item) {
			if ( editions[hadesEdition].updateState ) {
				editions[hadesEdition].updateState(item.state);
				hadesPeriod = item.period;
				hadesUpdate();
			};
		});
	};
	if ( space == "remote" ) {
		$.each(parameter, function(i, item) {
			if ( item.origin ) {
				if ( item.origin.call == "edition" ) {
					if ( editions[item.result] ) {
						hadesEdition = item.result;
						if ( editions[item.result].init ) {
							editions[item.result].init();
						};
					} else {
						alert("HADES world state edition \"" + item.result + "\" not supported by ORPHEUS.");
						hadesEdition = "text";
					};
				};
				if ( item.origin.call == "stuff" ) {
					if ( editions[hadesEdition].updateWorld ) {
						editions[hadesEdition].updateWorld(item.result);
					};
				};
			};
		});
	};
	hadesUpdate();
	return null;
};

$(document).ready(function() {
	var dynamicCSS = "";
	dynamicCSS += buildDynamicCSS("hades-state",         ["constructing", "running", "concluding", "dead"]);
	dynamicCSS += buildDynamicCSS("hades-mode",          ["ephemeral", "server"]);
	dynamicCSS += buildDynamicCSS("hades-edition",       Object.keys(editions));
	dynamicCSS += buildDynamicCSS("hades-connected",     ["true", "false"]);
	dynamicCSS += buildDynamicCSS("hades-synchronized",  ["true", "false"]);
	dynamicCSS += buildDynamicCSS("hades-ticked",        ["true", "false"]);
	$("<style type=\"text/css\">" + dynamicCSS + "</style>").appendTo("head");
	$(".frame, .topbar").click(function(e) {
		if ( !$(e.target).hasClass("frame") && !$(e.target).hasClass("chrome") && $(e.target).parents(".chrome").length == 0 ) {
            //e.preventDefault();
            return;
        };
	 	$(this).toggleClass("open");
		e.stopPropagation();
	});
	$("#hades").change(function() {
		$(".hades\\!").text($(this).val());
	}).change();
	$("#eury").change(function() {
		$(".eury\\!").text($(this).val());
	}).change();
	$("#dike").change(function() {
		$(".dike\\!").text($(this).val());
	}).change();
	$("#hades-connect").attr("disabled", "");
	$("#hades-connect").click(function() {
		$("#hades-connect").attr("disabled", "disabled");
		$("#hades").attr("disabled", "disabled");
		$("#eury").attr("disabled", "disabled");
		$("#dike").attr("disabled", "disabled");
		$("#newmessage-send, #newmessage-type, #newmessage-recipient, #newmessage-space, #newmessage-parameter").attr("disabled", "");
		$(".hades-name\\!").text($("#hades").val());
		$(".eury-name\\!").text($("#eury").val());
		$(".dike-name\\!").text($("#dike").val());
		$(".hades-name-val\\!").val($("#hades").val());
		$(".eury-name-val\\!").val($("#eury").val());
		$(".dike-name-val\\!").val($("#dike").val());
		
		var ctx = new nullmq.Context("ws://" + $("#eury").val()); //username "guest", password "guest" are ASSUMED by nullmq (!)
		var req = ctx.socket(nullmq.REQ);
		req.connect("tcp://"+ $("#dike").val());
		pentameter.init(req, orpheus);
		pentameter.talk("get", "dummy", "pentameter.name", [{}]);
		pentameter.talk("get", $("#hades").val(), "server.mode", [{}]);
		pentameter.talk("get", $("#hades").val(), "server.state", [{}]);
		pentameter.talk("get", $("#hades").val(), "server.runcount", [{}]);
		pentameter.talk("get", $("#hades").val(), "state", [{}]);
		pentameter.talk("put", $("#hades").val(), "subscriptions", [{to: "state", space: "hades.subscription.state"}]);
		pentameter.talk("put", $("#hades").val(), "subscriptions", [{to: "server.state", space: "hades.subscription.server.state"}]);
		
		if ( hadesSynchronized ) {
			pentameter.talk("put", $("#hades").val(), "server.ticks", [{}]);
		};
		hadesConnected = true;
		
		pentameter.talk("get", $("#hades").val(), "remote", [{call: "edition"}]); 
		pentameter.talk("get", $("#hades").val(), "remote", [{call: "stuff"}]); 
		
		hadesUpdate();
		checkInbox();
	});
	$("#hades-synchronize").change(function() {
		if ( $("#hades-synchronize").is(":checked") ) {
			hadesSynchronized = true;
			if ( hadesConnected ) {
				pentameter.talk("put", $("#hades").val(), "server.ticks", [{}]);
				if ( hadesState == "running" ) {
					hadesTicked = true;
					hadesUpdate();
				};
			};
			hadesUpdate();
		} else {
			hadesSynchronized = false;
			if ( hadesConnected ) {
				pentameter.talk("get", $("#hades").val(), "server.ticks", [{}]);
			};
			hadesTicked = false;
			hadesUpdate();
		};
	});
	$("#hades-construct").click(function() {
		pentameter.talk("put", $("#hades").val(), "construction", [{steps: 1}]);
		pentameter.talk("get", $("#hades").val(), "server.state", [{}]);
	});
	$("#hades-unterminate").click(function() {
		pentameter.talk("put", $("#hades").val(), "untermination", [{}]);
		pentameter.talk("get", $("#hades").val(), "server.runcount", [{}]);
		pentameter.talk("get", $("#hades").val(), "server.state", [{}]);
		if ( hadesSynchronized ) {
			pentameter.talk("put", $("#hades").val(), "server.tocks", [{}]);
		};
	});
	$("#hades-terminate").click(function() {
		pentameter.talk("put", $("#hades").val(), "termination", [{}]);
		hadesState = "dead";
		hadesAdvancedState = {};
		hadesConnected = false;
		hadesUpdate();
	});
	$("#hades-tock").click(function() {
		hadesTicked = false;
		hadesUpdate();
		pentameter.talk("put", $("#hades").val(), "server.tocks", [{duration: parseInt($("#hades-tock-duration").val())}]);
	});
	$("#hades-state-update").click(function() {
		pentameter.talk("get", $("#hades").val(), "server.state", [{}]);
	});
	$("#hades-runcount-update").click(function() {
		pentameter.talk("get", $("#hades").val(), "server.runcount", [{}]);
	});
	$("#orpheus-reload").click(function() {
		window.location.reload(true);
	});
	$("#newmessage-send").click(function() {
		$("#lastmessage").toggleClass("open");
		pentameter.talk(
			$("#newmessage-type").val(),
			$("#newmessage-recipient").val(),
			$("#newmessage-space").val(),
			JSON.parse($("#newmessage-parameter").val())
		);
	});
	$("#hades-untocked-fetch").click(function() {
		pentameter.talk("qry", $("#hades").val(), "server.untocked", [{}]);
	});
}); 