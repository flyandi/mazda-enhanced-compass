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

	var CACHED_ROUTE_PREFIX = "cachedRoute-";

	function resolveError(statusCode, error) {
	    var result = "unkown";
	    if (429 == statusCode) {
		result = "API limit reached";
	    } else if (error !== null) {
		result = error;
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
			    path : path.slice(accContinueInstructionIntervalStart, accContinueInstructionIntervalEnd + 1),
			    turnType : instruction.sign,
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

	    cacheResult(startLat, startLng, destLat, destLng, routeStruct);

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

	function readFromCache(start, dest) {
	    var result = null;

	    // read from file
	    for (var i = 0; i < Object.keys(CACHED_ROUTES).length; i++) {
		var route = CACHED_ROUTES[i];
		// compute destination to start
		var distanceStart = GeoUtils.getInstance().distance(start, route.start);
		console.info("file " + distanceStart);
		if (distanceStart <= Navigation.getInstance().MAX_DISTANCE && dest.lat == route.dest.lat
			&& dest.lng == route.dest.lng) {
		    result = route.data;
		    break;
		}
	    }

	    if (result == null) {
		// read from localStorage
		for ( var name in localStorage) {
		    if (name.indexOf(CACHED_ROUTE_PREFIX) == 0) {
			text = localStorage.getItem(name);
			var route = eval('(' + text + ')');
			// compute destination to start
			var distanceStart = GeoUtils.getInstance().distance(start, route.start);
			console.info("localStorage " + distanceStart);
			if (distanceStart <= Navigation.getInstance().MAX_DISTANCE && dest.lat == route.dest.lat
				&& dest.lng == route.dest.lng) {
			    result = route.data;
			    break;
			}
		    }
		}
	    }
	    return result;
	};

	function objToString(obj, ndeep) {
	    switch (typeof obj) {
	    case "string":
		return '"' + obj + '"';
	    case "function":
		return obj.name || obj.toString();
	    case "object":
		var indent = Array(ndeep || 1).join('\t'), isArray = Array.isArray(obj);
		return ('{['[+isArray] + Object.keys(obj).map(function(key) {
		    return '\n\t' + indent + (isArray ? '' : key + ': ') + objToString(obj[key], (ndeep || 1) + 1);
		}).join(',') + '\n' + indent + '}]'[+isArray]).replace(
			/[\s\t\n]+(?=(?:[^\'"]*[\'"][^\'"]*[\'"])*[^\'"]*$)/g, '');
	    default:
		return obj.toString();
	    }
	};

	function cacheResult(startLat, startLng, destLat, destLng, routeStruct) {
	    var x = btoa(escape(objToString({
		start : {
		    lat : startLat, lng : startLng
		}, dest : {
		    lat : destLat, lng : destLng
		}, data : routeStruct
	    })));
	    var text = unescape(atob(x));
	    localStorage.setItem(CACHED_ROUTE_PREFIX + startLat + ',' + startLng + '/' + destLat + ',' + destLng, text);
	};

	return {
	    // Public methods and variables
	    fetch : function(startLat, startLng, destLat, destLng, routeFinishCallback) {

		var via = '';

		if (direction) {
		    via += '&point=' + [ direction.lat, direction.lng ].join('%2C');
		}

		var routeStruct = readFromCache({
		    lat : startLat, lng : startLng
		}, {
		    lat : destLat, lng : destLng
		});

		if (routeStruct != null) {
		    console.info("cached route used");
		    routeFinishCallback(new Route().parse(routeStruct));
		} else {
		    var reqUrl = [ BASE_URL, 'route?type=jsonp', '&key=', apiKey, '&locale=', lang, '&vehicle=',
			    routeType, '&weighting=', modifier, '&point=', [ startLat, startLng, ].join('%2C'), via,
			    '&point=', [ destLat, destLng ].join('%2C') ];

		    var route = null;
		    $.ajax({
			url : reqUrl.join(''), dataType : "jsonp"
		    }).done(function(data) {
			route = parse(data, startLat, startLng, destLat, destLng);
		    }).fail(function(jqXHR, textStatus, errorThrown) {
			if (jqXHR.readyState == 4) {
			    // HTTP error (can be checked by
			    // XMLHttpRequest.status
			    // and XMLHttpRequest.statusText)
			    route = {
				error : resolveError(jqXHR.statusCode(), textStatus)
			    };
			} else if (jqXHR.readyState == 0) {
			    // Network error (i.e. connection refused, access
			    // denied
			    // due to CORS, etc.)
			    route = {
				error : resolveError(jqXHR.statusCode(), "connection problem")
			    };
			} else {
			    // something weird is happening
			    route = {
				error : resolveError(jqXHR.statusCode(), textStatus)
			    };
			}
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
