var GraphHopper = (function() {

    // Instance stores a reference to the Singleton
    var instance;

    function init() {

	// Singleton

	// Private methods and variables
	/**
	 * The base url for the service.
	 * 
	 * @type String
	 */
	var BASE_URL = 'http://graphhopper.com/api/1/';

	var apiKey = SETTINGS.credentials.graphHopper;

	var modifier = 'fastest';

	var routeType = 'car';

	var lang = SETTINGS.locale;

	var route = null;

	var anchorPoint = null;

	var direction = null;

	function error(error) {
	    this.base(error);
	};

	function parse(response) {

	    // check for error codes
	    // https://github.com/graphhopper/graphhopper/blob/master/docs/web/api-doc.md
	    if (response.info.errors)
		return this.error(response);

	    var route = response.paths[0];

	    var routeStruct = {
		directions : []
	    };
	    routeStruct.summary = {
		distance : parseInt(route.distance, 10), duration : route.time / 1000
	    };

	    var path = ffwdme.Route.decodePolyline(route.points);

	    var instruction, d, extractedStreet, geomArr;
	    var instructions = route.instructions;

	    // we remove the last instruction as it only says "Finish!" in
	    // GraphHopper and has no value for us.
	    instructions.pop();

	    for (var i = 0, len = instructions.length; i < len; i++) {
		instruction = instructions[i];
		d = {
		    instruction : instruction.text, distance : parseInt(instruction.distance, 10),
		    duration : instruction.time / 1000, turnAngle : this.extractTurnAngle(instruction.sign),
		    turnType : this.extractTurnType(instruction.sign)
		};

		d.path = path.slice(instruction.interval[0], instruction.interval[1] + 1);

		// Strip the streetname out of the route description
		extractedStreet = d.instruction.split(/(?:on |near |onto |at |Head )/).pop();
		d.street = extractedStreet.length == d.instruction.length ? '' : extractedStreet;

		routeStruct.directions.push(d);
	    }

	    this.route = new ffwdme.Route().parse(routeStruct);

	    this.success(response, this.route);
	};

	// "FINISH"
	// "EXIT1"
	// "EXIT2"
	// "EXIT3"
	// "EXIT4"
	// "EXIT5"
	// "EXIT6"
	// "TU"
	function extractTurnType(indication) {
	    var name;
	    switch (indication) {
	    case 0: // continue (go straight)
		name = 'C';
		break;
	    case -2: // turn left
		name = 'TL';
		break;
	    case -1: // turn slight left
		name = 'TSLL';
		break;
	    case -3: // turn sharp left
		name = 'TSHL';
		break;
	    case 2: // turn right
		name = 'TR';
		break;
	    case 1: // turn slight right
		name = 'TSLR';
		break;
	    case 3: // turn sharp right
		name = 'TSHR';
		break;
	    // case 'TU': // U-turn
	    // name = 180;
	    // break;
	    }
	    return name;
	};

	// see
	// https://github.com/graphhopper/graphhopper/blob/master/docs/web/api-doc.md
	function extractTurnAngle(indication) {
	    var angle;
	    switch (indication) {
	    case 0: // continue (go straight)
		angle = 0;
		break;
	    case -2: // turn left
		angle = 90;
		break;
	    case -1: // turn slight left
		angle = 45;
		break;
	    case -3: // turn sharp left
		angle = 135;
		break;
	    case 2: // turn right
		angle = -90;
		break;
	    case 1: // turn slight right
		angle = -45;
		break;
	    case 3: // turn sharp right
		angle = -135;
		break;
	    // case 'TU': // U-turn
	    // angle = 180;
	    // break;
	    }
	    return angle;
	};

	return {

	    // Public methods and variables
	    fetch : function(startLat, startLng, destLat, destLng) {

		var via = '';

		if (direction) {
		    via += '&point=' + [ direction.lat, direction.lng ].join('%2C');
		}

		var reqUrl = [ BASE_URL, 'route?type=jsonp', '&key=', apiKey, '&locale=', lang, '&vehicle=', routeType,
			'&weighting=', modifier, '&point=', [ startLat, startLng, ].join('%2C'), via, '&point=',
			[ destLat, destLng ].join('%2C') ];

		var data = $.ajax({
		    url : reqUrl.join(''), dataType : "jsonp"
		}).done(function(data) {
		    parse(data);
		}).fail(function(jqXHR, textStatus, errorThrown) {
		    console.info("error receiving data: " + textStatus);
		    error();
		    return null;
		});
	    },
	};

    };

    return {

	// Get the Singleton instance if one exists
	// or create one if it doesn't
	getInstance : function() {

	    if (!instance) {
		instance = init();
	    }

	    return instance;
	}

    };

})();
