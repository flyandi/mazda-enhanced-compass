/**
 * The route object represents a calculated route as it is returned by one of the routing services.
 */
function Route() {

}

Route.prototype = {
    summary : null,

    directions : null,

    path : null,

    // Public methods and variables
    parse : function(json) {
	if (typeof (json) == "undefined") {
	    return;
	}
	this.summary = json.summary;
	this.directions = json.directions;
	this.path = json.path;

	if (this.directions.length > 0 && this.directions[0].path.length > 0
		&& typeof (this.directions[0].path[0].lat) == "undefined") {
	    for (var i = 0, len = this.directions.length; i < len; i++) {
		var path = this.directions[i].path, newPath = [];
		for (var j = 0, plen = path.length; j < plen; j++) {
		    newPath.push([path[j][0], path[j][1]]);
		}
		this.directions[i].path = newPath;
	    }
	}
	return this;
    }
};
