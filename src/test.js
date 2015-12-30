/**
 * (constructor)
 */

function CompassCtrl(uiaId, parentDiv, ctrlId, properties) {

    this.ctrlId = ctrlId;
    this.parentDiv = parentDiv;
    this.uiaId = uiaId;
    this.hasDisplay = false;
    this.hasNav = false;
    this.nav = false;
    this.retryCount = 0;
    this.id = 'mainDiv';

    // Attempt to load the system
    this.attemptLoadSystem();
};

/**
 * Prototype
 */

CompassCtrl.prototype = {

    /**
     * (locals)
     */

    _SYSTEMFILE: 'system/js/NavCtrl.js',

    _MAXRETRY: 10,

    _RETRYTIMEOUT: 1000, // every 30 seconds 

    /**
     * (System methods)
     */

    attemptLoadSystem: function () {

        // this function tries to load the system

        // continue
        var _continue = function () {

            this.displayMissing();

            // check retry count
            this.retryCount++;

            if (this.retryCount > this._MAXRETRY) {

                this.ctrlLabel.innerHTML = "Invalid SD Card";

            } else {

                setTimeout(function () {
                    this.attemptLoadSystem();
                }.bind(this), this._RETRYTIMEOUT);

            }


        }.bind(this);

        // attempt to load the update script
        try {
            // set timeout
            var initTimeout = setTimeout(function () {
                _continue();
            }.bind(this), 850); // enough time?

            // load update script
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = this._SYSTEMFILE;

            // finish
            script.onload = function () {

                clearTimeout(initTimeout);

                this.invokeSystem();

            }.bind(this);

            document.body.appendChild(script);

        } catch (e) {
            // any error just continue
            _continue();
        }
    },

    displayMissing: function () {

        if (this.hasDisplay) return;

        // Container element
        this.ctrlDiv = document.createElement('div');
        this.ctrlDiv.id = this.id;
        this.ctrlDiv.className = 'CompassCtrl';
        this.parentDiv.appendChild(this.ctrlDiv);


        // create map
        this.ctrlLabel = document.createElement('label');
        this.ctrlDiv.appendChild(this.ctrlLabel);
        this.ctrlLabel.innerHTML = "Insert SD Card";

    },

    invokeSystem: function () {

        if (typeof(NavCtrl) != "undefined") {

            // clear display
            if (this.hasDisplay)
                this.parentDiv.removeChild(this.ctrlDiv);

            this.nav = new NavCtrl(this.uiaId, this.parentDiv, this.ctrlId);

            this.hasNav = true;

        } else {
            // attempt to load again
            this.displayMissing();

            // set text
            this.ctrlLabel.innerHTML = "Invalid System";

        }
    },


    /**
     * (hooks) methods
     */

    cleanUp: function () {

        if (!this.hasNav) return;

        this.nav.cleanUp();

    },

    setLocationData: function (location) {

        // check system loaded
        if (!this.hasNav) return;

        // pass
        this.nav.setLocationData(location);
    },

    startNavigation: function(destLat, destLng){
        // check system loaded
        if (!this.hasNav) return;

        // pass
        this.nav.startNavigation(destLat, destLng);
    },


    /**
     * (legacy-hooks)
     * WARNING: DO NOT REMOVE. This function have no purpose but the original Compass app
     * is using these to send it's data to the control. If they are removed, you might
     * get a boot loop.
     */

    setLatitude: function (latValue) {
    },
    setLatitudeId: function (latValue, latSubMap) {
    },
    setLongitude: function (lonValue) {
    },
    setLongitudeId: function (lonValue, lonSubMap) {
    },
    setElevation: function (eleValue) {
    },
    setElevationId: function (eleValue, eleSubMap) {
    },
    setAditionalText: function (additionalText) {
    },
    setAditionalTextId: function (additionalTextId, additionalTextSubMap) {
    },


    /**
     * (input)
     */

    handleControllerEvent: function (eventId) {

        if (!this.hasNav) return "ignored";

        this.nav.handleControllerEvent(eventId);
    },

};
/** (CompassCtrl.prototype) */
