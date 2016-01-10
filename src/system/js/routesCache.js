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
				distance : parseInt(route.distance, 10),
				duration : route.time / 1000
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
							path : path.slice(
									accContinueInstructionIntervalStart,
									accContinueInstructionIntervalEnd + 1),
							turnType : instruction.sign,
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
		}
		;

		function objToString(obj, ndeep) {
			switch (typeof obj) {
			case "string":
				return '"' + obj + '"';
			case "function":
				return obj.name || obj.toString();
			case "object":
				var indent = Array(ndeep || 1).join('\t'), isArray = Array
						.isArray(obj);
				return ('{['[+isArray]
						+ Object.keys(obj).map(
								function(key) {
									return '\n\t'
											+ indent
											+ (isArray ? '' : key + ': ')
											+ objToString(obj[key],
													(ndeep || 1) + 1);
								}).join(',') + '\n' + indent + '}]'[+isArray])
						.replace(
								/[\s\t\n]+(?=(?:[^\'"]*[\'"][^\'"]*[\'"])*[^\'"]*$)/g,
								'');
			default:
				return obj.toString();
			}
		}
		;

		/**
		 * compute destination to start
		 */
		function checkDistance(start, dest, route) {
			var distanceStart = GeoUtils.getInstance().distance(start,
					route.start);
			return (distanceStart <= Navigation.getInstance().MAX_DISTANCE
					&& dest.lat == route.dest.lat && dest.lng == route.dest.lng);
		}

		return {
			// Public methods and variables
			cacheResult : function(startLat, startLng, destLat, destLng,
					routeStruct) {
				var x = btoa(escape(objToString({
					start : {
						lat : startLat,
						lng : startLng
					},
					dest : {
						lat : destLat,
						lng : destLng
					},
					data : routeStruct
				})));
				var text = unescape(atob(x));
				localStorage.setItem(CACHED_ROUTE_PREFIX + startLat + ','
						+ startLng + '/' + destLat + ',' + destLng, text);
			},

			readFromCache : function(start, dest) {
				var result = null;

				// read from file
				for (var i = 0; i < Object.keys(CACHED_ROUTES).length; i++) {
					var route = CACHED_ROUTES[i];
					// compute destination to start
					if (checkDistance(start, dest, route)) {
						console.info("found route in file");
						result = route.data;
						break;
					}
				}

				if (result == null) {
					// read from localStorage
					for ( var name in localStorage) {
						if (name.indexOf(CACHED_ROUTE_PREFIX) == 0) {
							data = localStorage.getItem(name);
							var route = eval('(' + data + ')');
							if (checkDistance(start, dest, route)) {
								console.info("found route in localStorage");
								result = route.data;
								break;
							}
						}
					}
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

			exportCachedRoutes : function() {
				for ( var name in localStorage) {
					if (name.indexOf(CACHED_ROUTE_PREFIX) == 0) {
						var reqUrl = SETTINGS.exportURI + "/import?data="
								+ localStorage.getItem(name);

						$.ajax({
							url : reqUrl,
							dataType : "jsonp"
						}).done(function(data) {
							console.info("route sent");
						}).fail(function(jqXHR, textStatus, errorThrown) {
							console.info(jqXHR);
						});
					}
				}
			},
		};

	}
	;

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
