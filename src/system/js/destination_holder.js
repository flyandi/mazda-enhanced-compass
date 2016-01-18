var DestinationHolder = (function() {

    // Instance stores a reference to the Singleton
    var instance;

    function init() {

	// Singleton

	// Private methods and variables
	var data = null;

	var localStorageKey = "route-destination";

	return {
	    // Public methods and variables
	    saveDestination : function(lat, lng, name) {
		data = {
		    lat : lat, lng : lng, name : name
		}
		if (typeof (name) == "undefined") {
		    data.name = null;
		}
		this.update();
	    },

	    getDestination : function() {
		var result = {};
		if (data != null) {
		    result = data;
		} else {
		    var str = localStorage.getItem(localStorageKey);
		    if (str != null) {
			storedData = JSON.parse(str);
			if (Date.now() - storedData.timestamp < 60 * 60 * 1000) {
			    result = storedData;
			} else {
			    // expired
			    this.removeDestination();
			}
		    }
		}
		return result;
	    },

	    removeDestination : function() {
		localStorage.removeItem(localStorageKey);
		data = null;
	    },

	    update : function() {
		data.timestamp = Date.now();
		var temp = JSON.stringify(data);
		localStorage.setItem(localStorageKey, temp);
	    }
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
