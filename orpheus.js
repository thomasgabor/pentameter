$(document).ready(function() {
	var ctx = new nullmq.Context("ws://localhost:9000"); //username "guest", password "guest" are ASSUMED by nullmq (!)
	var req = ctx.socket(nullmq.REQ);
	req.connect('tcp://localhost:88888');
	pentameter.init(req, function(type, author, space, parameter) {
		if (space == "report") {
			$("#bodies").text("");
			$.each(parameter[0].bodies, function(key, value) {
				$("#bodies").append("<li>" + key + "</li>");
			});
		};
		if (space == "state") {
			$("#bodies").text("");
			$.each(parameter[0], function(name, state) {
				$("#bodies").append("<li><p>" + name + "</p><dl>");
				$.each(state, function(property, value) {
					$("#bodies").append("<dt>" + property + "</dt><dd>" + JSON.stringify(value) + "</dd>");
				});
				$("#bodies").append("</dl></li>");
			});
		};
		if (space == "construction") {
			if ( parameter[0].missing == 0 ) {
				$("#hadesmissing").text("HADES is running the simulation now, Orpheus is finished.");
			} else {
				$("#hadesmissing").text("" + parameter[0].missing + " step(s) missing...");
			};
		}
		$("#msgtype").text(type);
		$("#msgauthor").text(author);
		$("#msgspace").text(space);
		$("#msgparameter").text(JSON.stringify(parameter));
	});
	$("#newmessage").click(function(e) {
	    if(!($(e.target).is('section') || $(e.target).is('p'))) {
            e.preventDefault();
            return;
        };
		$("#newmessage").toggleClass("active");
		e.stopPropagation();
	});
	$("#lastresponse").click(function(e) {
		if(!($(e.target).is('section') || $(e.target).is('p'))) {
            e.preventDefault();
            return;
        };
		$("#lastresponse").toggleClass("active");
		e.stopPropagation();
	});
	$("#hadesconnect").click(function() {
		$("#hadesmissing").text("");
		$(".hadesaddress").text($("#hades").val());
		if ($(".hadesaddressfield").val() == "") {
			$(".hadesaddressfield").val($("#hades").val());
		};
		pentameter.talk("get", $("#hades").val(), "state", [{}]);
	});
	var firstrun = true;
	$("#hadesrun").click(function() {
		if (firstrun) {
			pentameter.talk("put", $("#hades").val(), "construction", [{steps: 1}]);
			$("#hadesrun").val("run another simulation");
			firstrun = false;
		} else {
			pentameter.talk("put", $("#hades").val(), "untermination", [{}]);
		};
	});
	$("#hadesexit").click(function() {
		pentameter.talk("put", $("#hades").val(), "termination", [{}]);
	});
	$("#sendnewmessage").click(function() {
		var msgtype = $("#newtype select").val();
		var msgrecipient = $("#newrecipient input").val();
		var msgspace = $("#newspace input").val();
		var msgparameter = $("#newparameter textarea").val();
		pentameter.talk(msgtype, msgrecipient, msgspace, JSON.parse(msgparameter));
		$("#lastresponse").toggleClass("active", true);
	});
}); 