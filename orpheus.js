var hadesMode = null;
var hadesState = null;
var hadesAdvancedState = null;
var hadesEdition = "text";
var hadesRuncount = 0;

var editions = {};
editions.text = {};
editions.text.init = function() {return null;};
editions.text.updateWorld = function(newworld) {return null;};
editions.text.updateState = function(newstate) {
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
editions.sisyphos_graph.init = function() {return null;};
editions.sisyphos_graph.updateWorld = function(newworld) {
	$("#world").addClass("open");
	$("#test").text(JSON.stringify(newworld));
	var s = new sigma("container");
	$.each(newworld.nodes, function(x, rest) {
		$.each(rest, function(y, node) {
			s.graph.addNode({
				id: "(" + node.x + "," + node.y + ")",
				label: "(" + node.x + "," + node.y + ")",
				x: node.x,
				y: node.y,
				size: 1,
				color: "#ff0000"
			});
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
						target: "(" + edge.to.x + "," + edge.to.y + ")"
					});
				});
			});
		});
    });
    s.refresh();
};
editions.sisyphos_graph.updateState = editions.text.updateState;

function checkInbox() {
	//pentameter.talk("get", $("#hades").val(), "net.life", [{a:42}]);
	pentameter.talk("get", "dummy", "pentameter.pending", [{bother:$("#hades").val()}]);
	if ( hadesState != "dead" ) {
		setTimeout(checkInbox, 1000);
	};
}

function hadesUpdate() {
	$(".hades-mode\\!").text(hadesMode);
	$(".hades-state\\!").text(hadesState + " " + JSON.stringify(hadesAdvancedState));
	$(".hades-edition\\!").text(hadesEdition);
	$(".hades-runcount\\!").text(hadesRuncount);
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
}

function orpheus(type, author, space, parameter) {
	if ( space == "server.mode" ) {
		$.each(parameter, function(i, item) {
			if ( item.mode ) {
				hadesMode = item.mode;

			};
		});
	};
	if ( space == "server.state" || space == "hades.subscriptions.server.state" ) {
		$.each(parameter, function(i, item) {
			var state = item.state ? item.state.type : item.type;
			if ( state ) {
				hadesState = state;
				hadesAdvancedState = item.state ? item.state : item;

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
	$(".frame, .topbar").click(function(e) {
		if ( !$(e.target).hasClass("frame") && !$(e.target).hasClass("chrome") && $(e.target).parents(".chrome").length == 0 ) {
            e.preventDefault();
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
	$("#hades-connect").click(function() {
		$("#hades").attr("disabled", "disabled");
		$("#eury").attr("disabled", "disabled");
		$("#dike").attr("disabled", "disabled");
		var ctx = new nullmq.Context("ws://" + $("#eury").val()); //username "guest", password "guest" are ASSUMED by nullmq (!)
		var req = ctx.socket(nullmq.REQ);
		req.connect("tcp://"+ $("#dike").val());
		pentameter.init(req, orpheus);
		$(".hadesaddress").text($("#hades").val());
		if ($(".hadesaddressfield").val() == "") {
			$(".hadesaddressfield").val($("#hades").val());
		};
		pentameter.talk("get", $("#hades").val(), "server.mode", [{}]);
		pentameter.talk("get", $("#hades").val(), "server.state", [{}]);
		pentameter.talk("get", $("#hades").val(), "server.runcount", [{}]);
		pentameter.talk("get", $("#hades").val(), "state", [{}]);
		pentameter.talk("put", $("#hades").val(), "subscriptions", [{to: "state", space: "hades.subscription.state"}]);
		
		pentameter.talk("get", $("#hades").val(), "remote", [{call: "edition"}]); 
		pentameter.talk("get", $("#hades").val(), "remote", [{call: "stuff"}]); 
		checkInbox();
	});
	$("#hades-construct").click(function() {
		pentameter.talk("put", $("#hades").val(), "construction", [{steps: 1}]);
		pentameter.talk("get", $("#hades").val(), "server.state", [{}]);
	});
	$("#hades-unterminate").click(function() {
		pentameter.talk("put", $("#hades").val(), "untermination", [{}]);
		pentameter.talk("get", $("#hades").val(), "server.runcount", [{}]);
	});
	$("#hades-terminate").click(function() {
		pentameter.talk("put", $("#hades").val(), "termination", [{}]);
		hadesState = "dead";
		hadesAdvancedState = {};
		hadesUpdate();
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
}); 