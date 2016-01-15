var Navigation = (function() {

    // Instance stores a reference to the Singleton
    var instance;

    function init() {

	// Singleton

	// Private methods and variables
	/**
	 * In case the position of the device can't be mapped on the route this counter holds the number of times it
	 * happened in a row.
	 * 
	 * Will reset once the position can be mapped again on the route.
	 * 
	 * @type Integer
	 */
	var offRouteCounter = 0;

	return {

	    // Public methods and variables
	    route : null,

	    MAX_DISTANCE : 30,// Math.max(35, Math.min(pos.coords.accuracy.toFixed(1), 50));// OR 35?!

	    getPositionOnRoute : function(position, navigationOnRouteCallback, navigationOffRouteCallback) {
		// try to find the current position on the route
		var nearest = this.route.nearestTo(position.point, 0, 0);

		var navInfo = new NavigationInfo({
		    nearest : nearest, raw : position, navigation : this, route : this.route,
		    onRoute : !!(nearest.point && nearest.distance < this.MAX_DISTANCE)
		});

		if (navInfo.onRoute) {
		    this.clearOffRouteCounter();
		    navigationOnRouteCallback(navInfo);
		} else {
		    offRouteCounter++;
		    navigationOffRouteCallback(navInfo, offRouteCounter);
		}
	    },

	    clearOffRouteCounter : function() {
		offRouteCounter = 0;
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
