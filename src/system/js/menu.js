function Menu(menuContainerDiv) {
    this.menuContainer = menuContainerDiv;
    this.menuList = document.createElement("div");
    this.menuList.classList.add("menuList");
}

Menu.prototype = {
    items : [],

    menuCurrentIndex : 0,

    // Public methods and variables
    addItem : function(label, action, closeAfterSelect) {
	var close = closeAfterSelect || true;
	if (!action) {
	    close = false;
	}
	this.items.push({
	    action : (action) ? action.bind(__NavPOICtrl) : null, closeAfterSelect : close
	});

	var menuItem = document.createElement("div");
	menuItem.setAttribute("menuIndex", this.items.length - 1);
	menuItem.classList.add("menuItem");
	this.menuList.appendChild(menuItem);

	var menuItemLabel = document.createElement("span");
	menuItem.appendChild(menuItemLabel);

	menuItemLabel.innerHTML = label;
    },

    selectNextItem : function() {
	this.selectMenuItem(this.menuCurrentIndex < this.items.length - 1 ? this.menuCurrentIndex + 1 : 0);
    },

    selectPreviousItem : function() {
	this.selectMenuItem(this.menuCurrentIndex > 0 ? this.menuCurrentIndex - 1 : this.items.length - 1);
    },

    selectMenuItem : function(index) {

	// clear
	var selected = this.menuList.querySelector(".selected");
	if (selected)
	    selected.classList.remove("selected");

	var menuItem = this.menuList.querySelector("[menuIndex='" + index + "']");

	menuItem.classList.add("selected");

	this.menuCurrentIndex = index;

	// adjust scroll height
	var itemHeight = menuItem.clientHeight, visibleHeight = this.menuContainer.clientHeight, totalHeight = this.menuList.clientHeight, posHeight = (index + 1)
		* itemHeight, p = Math.max(itemHeight, (posHeight - visibleHeight));

	if (p % itemHeight > 0)
	    p = p - (p % itemHeight) + itemHeight;

	// check
	this.menuList.style.top = (-1 * (posHeight > visibleHeight ? p : 0)) + "px";
    },

    executeMenuItemAction : function() {

	item = this.items[this.menuCurrentIndex];
	if (item) {
	    switch (true) {

	    case typeof (item.action) == "function":
		item.action.call(this);
		break;
	    }

	    return item.closeAfterSelect;
	}
    },

};
