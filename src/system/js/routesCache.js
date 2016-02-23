var RoutesCache = (function() {

    // Instance stores a reference to the Singleton
    var instance;

    function init() {

	// Singleton

	// Private methods and variables
	var CACHED_ROUTE_PREFIX = "cachedRoute-";

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

	    cacheResult(startLat, startLng, destLat, destLng, routeStruct);

	    return new Route().parse(routeStruct);
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

	/**
	 * check if distance between gonnabe-start and route start is within range
	 */
	function checkStartDistance(start, routeStart) {
	    var distanceStart = GeoUtils.getInstance().distance(start, routeStart);
	    return distanceStart <= Navigation.getInstance().MAX_DISTANCE;
	}

	/**
	 * check if gonnabe-destination and route destination are the same
	 */
	function checkDestDistance(dest, routeDest) {
	    return Math.abs(routeDest.lat - dest.lat) < 0.000001 && Math.abs(routeDest.lng - dest.lng) < 0.000001;
	}

	function generateUUID() {
	    var d = new Date().getTime();
	    if (window.performance && typeof window.performance.now === "function") {
		d += performance.now(); // use high-precision timer if available
	    }
	    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = (d + Math.random() * 16) % 16 | 0;
		d = Math.floor(d / 16);
		return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
	    });
	    return uuid;
	}

	return {
	    // Public methods and variables
	    cacheResult : function(startLat, startLng, destLat, destLng, routeStruct) {
		var x = btoa(escape(objToString({
		    start : new LatLng(startLat, startLng), dest : new LatLng(destLat, destLng), data : routeStruct
		})));
		var text = unescape(atob(x));
		localStorage.setItem(CACHED_ROUTE_PREFIX + startLat + ',' + startLng + '/' + destLat + ',' + destLng,
			text);
	    },

	    readFromCache : function(start, dest) {
		var result = null;

		// read from file
		for (var i = 0; i < Object.keys(CACHED_ROUTES).length; i++) {
		    var route = CACHED_ROUTES[i];
		    // check if destination matches and if start is within range
		    if (checkDestDistance(dest, route.dest) && checkStartDistance(start, route.start)) {
			console.info("found route in file");
			result = route.data;
			break;
		    }
		}

		if (result == null) {
		    // read from localStorage
		    for ( var name in localStorage) {
			if (name.indexOf(CACHED_ROUTE_PREFIX) == 0) {
			    arr = name.split(/[-/,]+/);
			    if (arr.length != 5) {
				continue;
			    }
			    // check if destination matches and if start is within range
			    if (checkDestDistance(dest, new LatLng(arr[3], arr[4]))
				    && checkStartDistance(start, new LatLng(arr[1], arr[2]))) {
				console.info("found route in localStorage");
				var route = eval('(' + localStorage.getItem(name) + ')');
				result = route.data;
				break;
			    }
			}
		    }
		}
		return result;
	    },

	    readMoreFromCache : function(dest) {
		var result = [];

		if (typeof (dest.lat) != "undefined") {
		    // read from file
		    for (var i = 0; i < Object.keys(CACHED_ROUTES).length; i++) {
			var route = CACHED_ROUTES[i];
			// check if destination matches
			if (checkDestDistance(dest, route.dest)) {
			    result.push(route);
			}
		    }

		    // read from localStorage
		    for ( var name in localStorage) {
			if (name.indexOf(CACHED_ROUTE_PREFIX) == 0) {
			    arr = name.split(/[-/,]+/);
			    if (arr.length != 5) {
				continue;
			    }
			    // check if destination matches
			    if (checkDestDistance(dest, new LatLng(arr[3], arr[4]))) {
				route = eval('(' + localStorage.getItem(name) + ')');
				result.push(route);
			    }
			}
		    }

		    console.info("found " + result.length + " cached routes to destination");
		}
		return result;
	    },

	    clearCachedRoutes : function() {
		for ( var name in localStorage) {
		    if (name.indexOf(CACHED_ROUTE_PREFIX) == 0) {
			localStorage.removeItem(name);
		    }
		}
	    },

	    exportCachedRoutes : function(exportProgressCallback) {
		if (SETTINGS.exportEmail == null || SETTINGS.exportEmail === ""){
		    exportProgressCallback("Export email not set. Cannot export routes.");
		    return;
		}
		
		// wait till all routes are send, then call sendEmail
		var toBeUploaded = 0;
		for ( var name in localStorage) {
		    if (name.indexOf(CACHED_ROUTE_PREFIX) == 0) {
			toBeUploaded++;
		    }
		}
		if (toBeUploaded == 0){
		    exportProgressCallback("No routes for export");
		    return;
		}
		var uploadingRouteId = 1;
		

		uuid = generateUUID();

		var errorDetected = null;
		function callbackInternal() {
		    console.info("Exported " + uploadingRouteId + "/" + toBeUploaded + " routes");
		    exportProgressCallback("Exported " + uploadingRouteId + "/" + toBeUploaded + " routes");
		    if (toBeUploaded == uploadingRouteId) {
			// uploading finished
			if (errorDetected != null) {
			    exportProgressCallback("Exporting error " + errorDetected.status + ": "
				    + errorDetected.statusText);
			} else {
			    exportProgressCallback("Sending routes to " + SETTINGS.exportEmail);
			    $.ajax(
				    {
					url : SETTINGS.exportURI + "/sendEmail", type : 'POST',
					data : JSON.stringify({
					    uuid : uuid, email : SETTINGS.exportEmail
					}), dataType : 'json', contentType : "application/json", processData : false
				    }).done(function(data) {
				console.info("routes sent by email");
				exportProgressCallback("Routes successfully exported to " + SETTINGS.exportEmail);
			    }).fail(function(jqXHR, textStatus, errorThrown) {
				console.info(jqXHR);
			    });
			}
		    } else {
			uploadingRouteId++;
		    }
		};

		for ( var name in localStorage) {
		    if (name.indexOf(CACHED_ROUTE_PREFIX) == 0 && errorDetected == null) {
			var route = eval('(' + localStorage.getItem(name) + ')');
			console.info("Exporting route [start=[lat=" + route.start.lat + ", lng=" + route.start.lng
				+ "], dest=[lat=" + route.dest.lat + ", lng=" + route.dest.lng + "]]");
			$.ajax(
				{
				    url : SETTINGS.exportURI + "/importRoute", type : 'POST',
				    data : JSON.stringify({
					uuid : uuid, route : route
				    }), dataType : 'json', contentType : "application/json", processData : false
				}).done(function(data) {
			    console.info("route uploaded");
			}).fail(function(jqXHR, textStatus, errorThrown) {
			    console.info(jqXHR);
			    if (errorDetected == null) {
				errorDetected = jqXHR;
			    }
			}).always(function() {
			    callbackInternal();
			});
		    }
		}
	    },
	};
    };

    return {

	// Get the Singleton instance if one exists or create one if it doesn't
	getInstance : function() {

	    if (!instance) {
		instance = init();
	    }

	    return instance;
	}

    };

})();
