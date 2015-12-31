var Navigation = (function() {

    // Instance stores a reference to the Singleton
    var instance;

    function init() {

	// Singleton

	// Private methods and variables

	/**
	 * Holds an Array of the positions that could be mapped to the route.
	 * 
	 * Basically these are HTML GeoPosition objects enriched with a
	 * _positionOnRoute hashtable.
	 * 
	 * @type Array
	 */
	var _lastPositionsOnRoute = [];

	var _currentPositionOnRoute = null;

	var _lastDirectionPathIndex = null;

	var _lastDrivingDirectionIndex = null;

	var startTime = null;

	var startTimeByDirection = {};

	/**
	 * In case the position of the device can't be mapped on the route this
	 * counter holds the number of times it happened in a row.
	 * 
	 * Will be resetted once the position can be mapped again on the route.
	 * 
	 * @type Integer
	 */
	var offRouteCounter = 0;

	/**
	 * In case the position of the device can't be mapped on the route this
	 * timestamp saves the first time this occured.
	 * 
	 * Will be resetted once the position can be mapped again on the route.
	 * 
	 * @type Integer
	 */
	var offRouteStartTimestamp = 0;

	// debug only
	var routePointCounter = 0;

	/**
	 * Time in ms that the position could not be mapped to the route.
	 * 
	 * Will be resetted once the position can be mapped again on the route.
	 * 
	 * @type Integer
	 */
	var offRouteTime = 0;

	function approachInSteps() {
	    return [ {
		dIndex : _lastDrivingDirectionIndex, pIndex : _lastDirectionPathIndex, max : 2
	    }, {
		dIndex : Math.max(_lastDrivingDirectionIndex - 2, 0), pIndex : 0, max : 5
	    }, {
		dIndex : Math.max(_lastDrivingDirectionIndex - 4, 0), pIndex : 0, max : 10
	    }, {
		dIndex : 0, pIndex : 0, max : false
	    } ];
	};

	return {

	    // Public methods and variables
	    route : null,

	    notFoundOnRoute : function(result) {

		if (offRouteCounter === 0) {
		    offRouteStartTimestamp = Date.now();
		} else {
		    offRouteTime = Date.now() - offRouteStartTimestamp;
		}

		offRouteCounter++;

		ffwdme.trigger('navigation:offroute', {
		    navInfo : result
		});
	    },

	    getPositionOnRoute : function(position, navigationOnRouteCallback, navigationOffRouteCallback) {

		var MAX_DISTANCE = 30;// Math.max(35,
		// Math.min(pos.coords.accuracy.toFixed(1),
		// 50));// OR 35?!

		var nearest;
		// try to find the current position on the route
		if (!_lastDrivingDirectionIndex) {
		    nearest = this.route.nearestTo(position.point, 0, 0);
		} else {

		    var jumping = this.approachInSteps();

		    var jumpLen = jumping.length, currJump;
		    for (var i = 0; i < jumpLen; i++) {
			currJump = jumping[i];
			nearest = this.route.nearestTo(position.point, currJump.dIndex, currJump.pIndex, currJump.max);
			if (nearest.point && nearest.distance < MAX_DISTANCE)
			    break;
		    }
		}

		routePointCounter++;

		var navInfo = new NavigationInfo({
		    nearest : nearest, raw : position, navigation : this, route : this.route,
		    onRoute : !!(nearest.point && nearest.distance < MAX_DISTANCE)
		});

		if (!navInfo.onRoute) {
		    navigationOffRouteCallback(navInfo);
//		    return this.notFoundOnRoute(navInfo);
		}

		offRouteCounter = 0;
		
		navigationOnRouteCallback(navInfo);
//
//		return ffwdme.trigger('navigation:onroute', {
//		    navInfo : navInfo
//		});
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
