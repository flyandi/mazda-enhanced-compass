var TurnTypes = (function() {

    // Instance stores a reference to the Singleton
    var instance;

    function init() {
	return {
	    FINISH: 4,
	    
	    getImgClass : function(indication) {
		var result;
		switch (indication) {
		case -3: // TURN_SHARP_LEFT
		    result = "arrow-hard-left";
		    break;
		case -2: // TURN_LEFT
		    result = "arrow-left";
		    break;
		case -1: // TURN_SLIGHT_LEFT
		    result = "arrow-half-left";
		    break;
		case 0: // CONTINUE_ON_STREET
		    result = "arrow-straight";
		    break;
		case 1: // TURN_SLIGHT_RIGHT
		    result = "arrow-half-right";
		    break;
		case 2: // TURN_RIGHT
		    result = "arrow-right";
		    break;
		case 3: // TURN_SHARP_RIGHT
		    result = "arrow-hard-right";
		    break;
		case this.FINISH: // FINISH
		    result ="arrow-flag";
		    break;
		case 5: // VIA_REACHED
		    result = "arrow-flag";
		    break;
		case 6: // USE_ROUNDABOUT
		    result = "arrow-roundabout";
		    break;
		}
		return result;
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
