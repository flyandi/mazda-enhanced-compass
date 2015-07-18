/**
 * Enhanced Compass for Mazda Connect Infotainment
 * 
 * This is a full replacement for the standard Compass Application that also offers a moving map.
 *
 * Written by Andreas Schwarz (http://github.com/flyandi/mazda-enhanced-compass)
 * Copyright (c) 2015. All rights reserved.
 * 
 * WARNING: The installation of this application requires modifications to your Mazda Connect system.
 * If you don't feel comfortable performing these changes, please do not attempt to install this. You might
 * be ending up with an unusuable system that requires reset by your Dealer. You were warned!
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the 
 * GNU General Public License as published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even 
 * the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
 * License for more details.
 * 
 * You should have received a copy of the GNU General Public License along with this program. 
 * If not, see http://www.gnu.org/licenses/
 *
 */

/**
 * Bootstrap Loader
 * This part of the application just loads the application from th SDCard. 
 */

/**
 * Log Initialization
 */

log.addSrcFile("CompassCtrl.js", "common");


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

    _SYSTEMFILE: 'apps/emnavi/controls/Compass/resources/system/js/NavCtrl.js',

    _MAXRETRY: 10,

    _RETRYTIMEOUT: 30 * 1000, // every 30 seconds 

    /**
     * (System methods)
     */

    attemptLoadSystem: function() {

        // this function tries to load the system

        // continue
        var _continue = function() {

            this.displayMissing();

            // check retry count
            this.retryCount++;

            if(this.retryCount > this._MAXRETRY) {

                 this.ctrlLabel.innerHTML = "Invalid SD Card";

            } else {

                setTimeout(function() {
                    this.attemptLoadSystem();
                }.bind(this), this._RETRYTIMEOUT); 

            }


        }.bind(this);

        // attempt to load the update script
        try {
            // set timeout
            var initTimeout = setTimeout(function() {
                _continue();
            }.bind(this), 850); // enough time?

            // load update script
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = this._SYSTEMFILE;

            // finish
            script.onload = function() {

                clearTimeout(initTimeout);
            
                this.invokeSystem();

            }.bind(this);

            document.body.appendChild(script);
        
        } catch(e) {
            // any error just continue
            _continue();
        }
    },

    displayMissing: function() {

        if(this.hasDisplay) return;

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

    invokeSystem: function() {

        if(typeof(NavCtrl) != "undefined") {

            // clear display
            if(this.hasDisplay) 
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

    cleanUp: function() {

        if(!this.hasNav) return;

        this.nav.cleanUp();

    },

    setLocationData: function(location) {

        // check system loaded
        if(!this.hasNav) return;

        // pass
        this.nav.setLocationData(location);
    },


    /**
     * (legacy-hooks) 
     * WARNING: DO NOT REMOVE. This function have no purpose but the original Compass app
     * is using these to send it's data to the control. If they are removed, you might
     * get a boot loop.
     */

    setLatitude: function (latValue) {},
    setLatitudeId: function (latValue, latSubMap) {},
    setLongitude: function (lonValue) {},
    setLongitudeId: function (lonValue, lonSubMap) {},
    setElevation: function (eleValue) {},
    setElevationId: function (eleValue, eleSubMap) {},
    setAditionalText: function (additionalText) {},
    setAditionalTextId: function (additionalTextId, additionalTextSubMap) {},

   
    /**
     * (input)
     */

    handleControllerEvent: function(eventId) {

        if(!this.hasNav) return "ignored";

        this.nav.handleControllerEvent(eventId);
    },

}; /** (CompassCtrl.prototype) */


/** 
 * Register with Framework
 */

framework.registerCtrlLoaded('CompassCtrl');
