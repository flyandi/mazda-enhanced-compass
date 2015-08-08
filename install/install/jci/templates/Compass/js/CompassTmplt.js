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

log.addSrcFile("CompassTmplt.js", "emnavi");


/**
 * (constructor)
 */

function CompassTmplt(uiaId, parentDiv, templateID, controlProperties) {

    this.divElt = null;
    this.templateName = "CompassTmplt";
    this.onScreenClass = "CompassTmplt";

    log.debug("  templateID in CompassTmplt constructor: " + templateID);

    //@formatter:off
    //set the template properties
    this.properties = {
        "statusBarVisible" : false,
        "leftButtonVisible" : false,
        "hasActivePanel" : false,
        "isDialog" : false,
    }
    //@formatter:on

    // create the div for template
    this.divElt = document.createElement('div');
    this.divElt.id = templateID;
    this.divElt.className = "CompassTmplt";


    parentDiv.appendChild(this.divElt);

    var compassProperties = controlProperties.CompassCtrl;

    this.compassCtrl = framework.instantiateControl(uiaId, this.divElt, "CompassCtrl", compassProperties);

    if(!this.compassCtrl) {
        console.error("ERROR: INIT CONTROL MAPS");
    }
}


/**
 * (Default Hooks)
 */

CompassTmplt.prototype.handleControllerEvent = function(eventID) {
    log.debug("handleController() called, eventID: " + eventID);

    // Route the event to the focused control
    var response = this.compassCtrl.handleControllerEvent(eventID);
    return response;
}

CompassTmplt.prototype.cleanUp = function() {
    this.compassCtrl.cleanUp();
}

framework.registerTmpltLoaded("CompassTmplt", ["apps/emnavi/controls/Compass"]);
