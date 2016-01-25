/**
 * The route object represents a calculated route as it is returned by one of the routing services.
 */
function Route() {

}

Route.prototype = {
    summary : null,

    directions : null,

    full_path : null,

    // Public methods and variables
    parse : function(json) {
	this.summary = json.summary;
	this.directions = json.directions;
	this.full_path = json.path;

	if (this.directions.length > 0 && this.directions[0].path.length > 0
		&& typeof (this.directions[0].path[0].lat) == "undefined") {
	    for (var i = 0, len = this.directions.length; i < len; i++) {
		var path = this.directions[i].path, newPath = [];
		for (var j = 0, plen = path.length; j < plen; j++) {
		    newPath.push(new LatLng(path[j][0], path[j][1]));
		}
		this.directions[i].path = newPath;
	    }
	}
	return this;
    },

    start : function() {
	var firstDirection = this.directions[0];
	var firstPosition = firstDirection.path[0];
	return firstPosition;
    },

    destination : function() {
	var lastDirection = this.directions[this.directions.length - 1];
	var lastPosition = lastDirection.path[lastDirection.path.length - 1];
	return lastPosition;
    },

    /**
     * Tries to map the current position on the route.
     * 
     * @param {ffwdme.LatLng}
     *                pos A ffwdme LatLng object
     * @param {Object}
     *                direction_index The index of the directions of the route to start searching for the nearest point
     *                of the route.
     * @param {Object}
     *                path_index The index of the single paths representing the direction above the start searching.
     * @param {Object}
     *                direction_max The maximum number of directions to go through.
     * 
     * @return {Object} A hashtable containing the following information: directionIndex (int): The direction index of
     *         the nearest point found. prevPathIndex (int): The path index of the nearest point found. nextPathIndex
     *         (int): The path index of the nearest point found. distance (float): The distance to from the nearest
     *         point found to the captured position. point: (ffwdme.LatLng):The nearest point found on the route (keys:
     *         lat, lng).
     */
    nearestTo : function(pos, directionIndex, pathIndex, maxIterations) {

	var nearest = {
	    distance : 999999, point : null, directionIndex : null, prevPathIndex : null, nextPathIndex : null
	};

	var geo = GeoUtils.getInstance();
	var len = maxIterations ? Math.min(maxIterations, this.directions.length) : this.directions.length;

	for (var i = directionIndex; i < len; i++) {
	    var direction = this.directions[i];
	    var pathLen = direction.path.length - 1;
	    var pathStart = (i === directionIndex) ? pathIndex : 0;

	    for (var j = pathStart; j < pathLen; j++) {
		var point = geo.closestOnLine(direction.path[j], direction.path[j + 1], pos);

		var distance = geo.distance(pos, point);

		// not closer than before
		if (nearest.distance < distance)
		    continue;

		nearest.distance = distance;
		nearest.point = point;
		nearest.directionIndex = i;
		nearest.prevPathIndex = j;
		nearest.nextPathIndex = j + 1;
	    }
	}
	return nearest;
    }
};
