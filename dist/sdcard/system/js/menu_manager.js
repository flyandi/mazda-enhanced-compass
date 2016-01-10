var MenuManager = (function() {

    // Instance stores a reference to the Singleton
    var instance;

    function init() {

	// Singleton

	// Private methods and variables

	var menus = [];

	var openMenuHistory = [];

	function getActiveMenu() {
	    return (openMenuHistory.length == 0) ? null : openMenuHistory[openMenuHistory.length - 1].menu;
	};

	return {
	    // Public methods and variables

	    /**
	     * Register a menu instance with its id.
	     */
	    registerMenu : function(id, menuContainerDiv) {
		var menu = new Menu(menuContainerDiv);
		menus.push({
		    id : id, menu : menu
		});
		return menu;
	    },

	    /**
	     * Select menu as active and return the instance
	     */
	    activateMenu : function(id) {
		var result = null;
		for (i = 0; i < menus.length; i++) {
		    if (id == menus[i].id) {
			openMenuHistory.push(menus[i]);
			result = menus[i].menu;
			break;
		    }
		}
		return result;
	    },

	    /**
	     * Close active menu and return the one, which should be active
	     */
	    closeAcitveMenu : function() {
		openMenuHistory.pop();
		return getActiveMenu();
	    },
	    
	    closeAllMenus : function() {
		openMenuHistory.length = 0;
	    },

	    executeMenuItemAction : function() {
		return getActiveMenu().executeMenuItemAction();
	    },

	    selectNextItem : function() {
		getActiveMenu().selectNextItem();
	    },

	    selectPreviousItem : function() {
		getActiveMenu().selectPreviousItem();
	    },

	    selectMenuItem : function(index) {
		getActiveMenu().selectMenuItem(index);
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
