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

	var modifier = 'fastest';

	var routeType = 'car';

	var anchorPoint = null;

	var direction = null;

	function resolveError(readyState, statusCode, textStatus) {
	    var result;
	    switch (readyState) {
	    case 4:
		switch (statusCode.status) {
		case 404:
		    result = "no connection";
		    break;
		case 429:
		    result = "API limit reached";
		    break;
		default:
		    result = "unkown";
		    break;
		}
		break;
	    default:
		result = "error (" + readyState + ") " + textStatus;
		break;
	    }
	    return result;
	};

	function parse(response, startLat, startLng, destLat, destLng) {

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

	    try {
		var path = decodePolyline(route.points);

		var instructions = route.instructions;

		var accContinueDuration = 0;
		var accContinueDistance = 0;
		var accContinueInstructionIntervalStart = null;
		var accContinueInstructionIntervalEnd;

		for (var i = 0, len = instructions.length; i < len; i++) {
		    var instruction = instructions[i];
		    if (instruction.sign == 0) { // CONTINUE_ON_STREET
			if (accContinueInstructionIntervalStart == null) {
			    accContinueInstructionIntervalStart = instruction.interval[0];
			}
			accContinueInstructionIntervalEnd = instruction.interval[1];
		    } else {
			var d = {
			    distance : accContinueDistance,
			    path : path.slice(accContinueInstructionIntervalStart,
				    accContinueInstructionIntervalEnd + 1), turnType : instruction.sign,
			    text : instruction.text,
			}
			if (typeof (instruction.exit_number) !== "undefined") {
			    d.exit_number = instruction.exit_number;
			}
			accContinueDistance = 0;
			accContinueInstructionIntervalStart = instruction.interval[0];
			accContinueInstructionIntervalEnd = instruction.interval[1];
			routeStruct.directions.push(d);
		    }
		    accContinueDistance += parseInt(instruction.distance, 10);
		}
		// last instruction is always FINISH
	    } catch (e) {
		return {
		    error : e.message
		};
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
	    apiKey : null,
	    locale : "en",

	    // Public methods and variables
	    fetch : function(startLat, startLng, destLat, destLng, routeFinishCallback) {

		var via = '';

		if (direction) {
		    via += '&point=' + [ direction.lat, direction.lng ].join('%2C');
		}

		if (this.apiKey == null) {
		    routeFinishCallback({
			error : "You must load your settings.js file first"
		    });
		} else {

		    var reqUrl = [ BASE_URL, 'route?type=jsonp', '&key=', this.apiKey, '&locale=', this.lang,
			    '&vehicle=', routeType, '&weighting=', modifier, '&point=',
			    [ startLng, startLat, ].join('%2C'), via, '&point=', [ destLng, destLat ].join('%2C') ];

		    var route = null;
		    $.ajax({
			url : reqUrl.join(''), dataType : "jsonp"
		    }).done(function(data) {
			route = parse(data, startLat, startLng, destLat, destLng);
		    }).fail(function(jqXHR, textStatus, errorThrown) {
			route = {
			    error : resolveError(jqXHR.readyState, jqXHR.statusCode(), textStatus)
			};
		    }).always(function() {
			routeFinishCallback(route);
		    });
		}
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
