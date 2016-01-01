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

	var anchorPoint = null;

	var direction = null;

	function resolveError(statusCode, error) {
	    var result = "unkown";
	    if (429 == statusCode){
		result = "API limit reached";
	    } else if (error !== null){
		result = error;
	    }
	    return result;
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

	    var path = decodePolyline(route.points);

	    var instruction, d, extractedStreet, geomArr;
	    var instructions = route.instructions;

	    for (var i = 0, len = instructions.length; i < len; i++) {
		instruction = instructions[i];
		d = {
		    instruction : instruction.text, distance : parseInt(instruction.distance, 10),
		    duration : instruction.time / 1000, turnType : instruction.sign
		};
		if (typeof (instruction.exit_number) !== "undefined") {
		    d.exit_number = instruction.exit_number;
		}

		d.path = path.slice(instruction.interval[0], instruction.interval[1] + 1);

		if (d.turnType == 0 && routeStruct.directions.length > 0) { // CONTINUE_ON_STREET
		    // check if this direction should be merged with previous
		    // one
		    var lastD = routeStruct.directions[routeStruct.directions.length - 1];
		    if (lastD.turnType == 0) {
			if (lastD.instruction.startsWith(d.instruction) || d.instruction.startsWith(lastD.instruction)) {
			    lastD.duration += d.duration;
			    lastD.distance += d.distance;
			    continue;
			}
		    }
		}

		routeStruct.directions.push(d);
	    }
	    routeStruct.path = path;

	    return new Route().parse(routeStruct);
	};

	// This function is from Google's polyline utility.
	function decodePolyline(polylineStr) {
	    var len = polylineStr.length;
	    var index = 0;
	    var array = [];
	    var lat = 0;
	    var lng = 0;

	    while (index < len) {
		var b;
		var shift = 0;
		var result = 0;
		do {
		    b = polylineStr.charCodeAt(index++) - 63;
		    result |= (b & 0x1f) << shift;
		    shift += 5;
		} while (b >= 0x20);
		var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
		lat += dlat;

		shift = 0;
		result = 0;
		do {
		    b = polylineStr.charCodeAt(index++) - 63;
		    result |= (b & 0x1f) << shift;
		    shift += 5;
		} while (b >= 0x20);
		var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
		lng += dlng;

		array.push([ lat * 1e-5, lng * 1e-5 ]);
	    }

	    return array;
	};

	return {
	    // Public methods and variables
	    fetch : function(startLat, startLng, destLat, destLng, routeFinishCallback) {

		var via = '';

		if (direction) {
		    via += '&point=' + [ direction.lat, direction.lng ].join('%2C');
		}

		var reqUrl = [ BASE_URL, 'route?type=jsonp', '&key=', apiKey, '&locale=', lang, '&vehicle=', routeType,
			'&weighting=', modifier, '&point=', [ startLat, startLng, ].join('%2C'), via, '&point=',
			[ destLat, destLng ].join('%2C') ];

		var route = null;
		$.ajax({
		    url : reqUrl.join(''), dataType : "jsonp"
		}).done(function(data) {
		    route = parse(data);
		}).fail(function(jqXHR, textStatus, errorThrown) {
		    console.info("error receiving data: " + textStatus);
		    route = {error:resolveError(jqXHR.statusCode(), textStatus)};
		}).always(function() {
		    routeFinishCallback(route);
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
