var OfflineNavigation = (function() {

    // Instance stores a reference to the Singleton
    var instance;

    function init() {

	// Singleton

	// Private methods and variables
	var routes = [];

	var nearestRoute = null;

	function findNearestRoute(position) {
	    var result = {
		distance : 999999, route : null
	    };

	    for (i = 0; i < routes.length; i++) {
		var nearestPoint = routes[i].nearestTo(position, 0, 0);
		if (nearestPoint.distance < result.distance) {
		    result = {
			distance : nearestPoint.distance, route : routes[i], onRoute : false
		    };
		}
	    }

	    return result;
	};

	function log(result, text) {
	    result.text = text + " " + Date.now();
	    console.info(text);
	};

	return {

	    // Public methods and variables
	    findCachedRoutesToDestination : function(destLat, destLng) {
		var result = RoutesCache.getInstance().readMoreFromCache(new LatLng(destLat, destLng));
		for (i = 0; i < result.length; i++) {
		    route = new Route().parse(result[i].data);
		    routes.push(route);
		}
		return result;
	    },

	    /**
	     * Set position and return route, if some route to destination was found and we are "on route"
	     */
	    setPosition : function(position) {
		result = [];
		if (nearestRoute != null && nearestRoute.route != null) {
		    // check if we are approaching the nearest route
		    var nearestPoint = nearestRoute.route.nearestTo(position, 0, 0);
		    if (nearestPoint.distance <= nearestRoute.distance) {
			// yes
			nearestRoute.distance = nearestPoint.distance;
			log(result, "nearest route distance " + nearestRoute.distance);
			if (nearestPoint.distance < Navigation.getInstance().MAX_DISTANCE) {
			    log(result, "maybe on route");
			    // we are "on route", but we need to avoid false positives, so we must be "on route" twice
			    // consecutively
			    if (nearestRoute.onRoute) {
				// we are officially "on route"
				result = nearestRoute.route;
			    }
			    nearestRoute.onRoute = true;
			} else {
			    nearestRoute.onRoute = false;
			}
		    } else if (nearestRoute.onRoute) {
			if (nearestPoint.distance < Navigation.getInstance().MAX_DISTANCE) {
			    // we are officially "on route"
			    result = nearestRoute.route;
			} else {
			    nearestRoute.onRoute = false;
			    nearestRoute.distance = nearestPoint.distance;
			    log(result, "off radius, nearest route distance " + nearestRoute.distance);
			}
		    } else {
			// we might lost the nearest route
			nearestRoute = null;
			log(result, "nearest route lost");
		    }
		}

		// recalculate nearest route, if there is none or we one was lost
		if (nearestRoute == null) {
		    nearestRoute = findNearestRoute(position);
		    if (nearestRoute.route != null) {
			log(result, "nearest route found, distance " + nearestRoute.distance);
			if (nearestRoute.distance < Navigation.getInstance().MAX_DISTANCE) {
			    log(result, "maybe on route already");
			    nearestRoute.onRoute = true;
			}
		    }
		}

		return result;
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
