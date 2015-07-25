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

var __NavPOICtrl;

/**
 * (constructor)
 */

function NavCtrl(uiaId, parentDiv, ctrlId) {

    this.id = ctrlId;                
    this.parentDiv = parentDiv;          
    this.uiaId = uiaId;
    this.hasMap = false;
    this.hasUI = false;
    this.hasPOI = false;
    this.lastDirection = false;

    __NavPOICtrl = this;

    // run
    this.init();

};

/**
 * Prototype
 */

NavCtrl.prototype = {

    /**
     * (locals)
     */

    _initialized: false,

    _version: '0.0.3',

    _compass: {
        n :  { type:'major', key: 'n',  label:'N',  fullname : 'north',     heading : 0,   rad : 0 * Math.PI / 180,   next:1, prev:7, index:0 },
        ne : { type:'minor', key: 'ne', label:'NE', fullname : 'northeast', heading : 45,  rad : 45 * Math.PI / 180,  next:2, prev:0, index:1 },
        e :  { type:'major', key: 'e',  label:'E',  fullname : 'east',      heading : 90,  rad : 90 * Math.PI / 180,  next:3, prev:1, index:2 },
        se : { type:'minor', key: 'se', label:'SE', fullname : 'southeast', heading : 135, rad : 135 * Math.PI / 180, next:4, prev:2, index:3 },
        s :  { type:'major', key: 's',  label:'S',  fullname : 'south',     heading : 180, rad : 180 * Math.PI / 180, next:5, prev:3, index:4 },
        sw : { type:'minor', key: 'sw', label:'SW', fullname : 'southwest', heading : 225, rad : 225 * Math.PI / 180, next:6, prev:4, index:5 },
        w :  { type:'major', key: 'w',  label:'W',  fullname : 'west',      heading : 270, rad : 270 * Math.PI / 180, next:7, prev:5, index:6 },
        nw : { type:'minor', key: 'nw', label:'NW', fullname : 'northwest', heading : 315, rad : 315 * Math.PI / 180, next:0, prev:6, index:7 },
    },

    // Vendor prefix
    _VENDOR: ('opera' in window) ? 'O' : 'webkit',

    // Paths
    _PATH: 'apps/emnavi/controls/Compass/resources/',

   	/**
   	 * (framework)
   	 */

    cleanUp: function() {

        clearInterval(this.clockTimer);

    },


    /**
     * (init) init routines
     */

    init: function() {

        // check for initialization
        if(this._initialized) return;

        // load css
        var css = document.createElement('link');
        css.rel = "stylesheet";
        css.type = "text/css";
        css.href = this._PATH + 'system/css/NavCtrl.css';
        document.body.appendChild(css);


        // Container element
        this.ctrlDiv = document.createElement('div');
        this.ctrlDiv.id = this.id;
        this.ctrlDiv.className = 'NavCtrl';
        this.parentDiv.appendChild(this.ctrlDiv);


        // create map
        this.ctrlMap = document.createElement('div');
        this.ctrlMap.id = "map";
        this.ctrlDiv.appendChild(this.ctrlMap);

        // (UI)
        this.createMapControls();
        this.disableInterface(true);

        // (MAP)
        this.initMap(function() {
            // create map
            this.createMap();

            // POI
            this.initPOI();

        }.bind(this));
        
        this._initialized = true;

    },

    initMap: function(callback) {

        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = this._PATH + 'system/js/ol.js';
        script.onload = function() {
            callback();
        }
        document.body.appendChild(script);
    },

    /**
     * Map Init
     */

    createMap: function() {

        // create view
        this.mapView = new ol.View({
            maxZoom: 17,
            center: [-13618678.447785482, 4201854.181677031],
            zoom: 3,
            //rotation: Math.PI / 6,
        });

        // create map source
        this.mapSource = new ol.source.OSM({
            url: this._PATH + 'tiles/{z}/{x}/{y}.png',
        });

        this.mapSource.on("tileloadend", function(event) {

            // pass to loadPOI
            this.loadPOI(event.tile.getTileCoord());

        }.bind(this));

        // create map layer
        this.mapLayer =  new ol.layer.Tile({
            source: this.mapSource
        });

        this.mapLayer.setUseInterimTilesOnError(false);

        // create map
        this.map = new ol.Map({
            layers: [
                this.mapLayer
            ],
            target: this.ctrlMap,
            controls: [],
            view: this.mapView,
            interactions: ol.interaction.defaults({
                dragPan: false,
                mouseWheelZoom: false,
            }),
            /** (Experimental) */
            //loadTilesWhileAnimating: true,
            //loadTilesWhileInteracting: true,
        });

        // set props
        this.mapProps = {
            lastCenterLocation: false,
            lastMoveLocation: false,
            currentZoom: 3,
            defaultZoom: 15, 
            moveWithGPS: true,
            isFirstPosition: true,
            saveZoomPosition: false,
        };

        // create marker
        this.gpsMarker = this.addMarker(this._PATH + "system/images/marker.png", 51, 51);


        // map
        this.hasMap = true;
        this.disableInterface(false);
    },

    /**
     * POI Init
     */


    initPOI: function() {
        // poi layer
        this.mapPOILayers = {};

        // poi active
        this.hasPOI = true;
    },

    loadPOI: function(coord) {

        if(coord.length != 3 || !this.hasPOI) return;

        var zoom = coord[0],
            x = Math.abs(coord[1]),
            y = Math.abs(coord[2]);

        // verify
        if(zoom < 11) return;

        // create xhr and load pson data
        try {
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = this._PATH + 'poi/' + zoom + '/' + x + '/' + y + '.pson';
            document.body.appendChild(script);
        } catch(e) {
            // silent
            console.log(e);
        }
    },

    registerPOI: function(pson) {

        // cycle pson
        for(var category in pson) {

            if(pson.hasOwnProperty(category)) {

                // iterate through hash's
                for(var hash in pson[category]) {

                    if(pson[category].hasOwnProperty(hash)) {

                        // get data
                        var data = pson[category][hash];
                        data._hash = hash;

                        // check category layer
                        if(typeof(this.mapPOILayers[category]) == "undefined") {


                            this.mapPOILayers[category] = {};

                            this.mapPOILayers[category].icon = new ol.style.Icon({
                                src: this._PATH + 'poi/markers/' + category + ".png",
                                anchor: [0.5, 1]
                            });

                            this.mapPOILayers[category].style =  [new ol.style.Style({
                                image: this.mapPOILayers[category].icon
                            })];

                            this.mapPOILayers[category].source = new ol.source.Vector();

                            this.mapPOILayers[category].layer = new ol.layer.Vector({
                                source: this.mapPOILayers[category].source,
                                style: function(feature, resolution) {

                                    switch(true) {
                                        case resolution < 2: scale = 1; break;
                                        case resolution < 5: scale = 0.8; break;
                                        case resolution < 20: scale = 0.65; break;
                                        default: scale = 0.5;
                                    }

                                    this.mapPOILayers[category].icon.setScale(scale);

                                    return this.mapPOILayers[category].style;
                                }.bind(this)
                            });

                            // add layer to map
                            this.map.addLayer(this.mapPOILayers[category].layer);
                        }

                        // check if feature already exists
                        var features = this.mapPOILayers[category].source.getFeaturesInExtent(this.mapView.calculateExtent(this.map.getSize())),
                            hasFeature = false;

                        features.forEach(function(feature) {
                            if(feature._hash == data._hash) hasFeature = true;
                        });


                        if(!hasFeature) {
                            // transform to GeoJSON and add feature
                            this.mapPOILayers[category].source.addFeature((new ol.format.GeoJSON()).readFeature({
                                type: "Feature",
                                geometry: {
                                    type: "Point",
                                    coordinates: [data.longitude, data.latitude]
                                },
                                properties: data
                            }, { 
                                featureProjection: 'EPSG:3857'
                            }));
                        } 
                    }
                }
            }
        }
    },


    showPOI: function(show) {

        if(!this.hasPOI) return;

        for(var category in this.mapPOILayers) 
            if(this.mapPOILayers.hasOwnProperty(category)) {
                this.mapPOILayers[category].layer.setVisible(show);
            }
    },


    /**
     * (UI)
     */

    createMapControls: function() {

        // create menu
        this.controlMenu = document.createElement("div");
        this.controlMenu.classList.add("mapMenu");
        this.ctrlDiv.appendChild(this.controlMenu);

        this.menuContainer = document.createElement("div");
        this.menuContainer.classList.add("menuContainer");
        this.controlMenu.appendChild(this.menuContainer);

        var arc = document.createElement("div");
        arc.classList.add("rightArc");
        this.menuContainer.appendChild(arc);

        this.menuList = document.createElement("div");
        this.menuList.classList.add("menuList");
        this.menuContainer.appendChild(this.menuList);

        this.menuItemIndex = 0;
        this.menuCurrentIndex = 0;
        this.menuItemLength = 0;

        this.menuItems = [

            {label: 'Center Map', action: function() {
                this.reCenter();
                return true; // close 
            }},
            {label: 'Cancel', action: function() { 
                return true; 
            }},
            {label: 'Find POI'},
            {label: 'Add POI'},
            {label: 'Favorites'},
            {label: 'POI'},

        ];

        this.menuItems.forEach(function(item) {

            this.addMenuItem(item);

        }.bind(this));

        this.isMenuOpen = false;

        // create container
        this.controlsContainer = document.createElement("div");
        this.controlsContainer.classList.add("mapControls");
        this.ctrlDiv.appendChild(this.controlsContainer);

        // create compass
        this.controlCompass = document.createElement("div");
        this.controlCompass.classList.add("mapCompass");
        this.controlsContainer.appendChild(this.controlCompass);

        var arc = document.createElement("div");
        arc.classList.add("arc");
        this.controlCompass.appendChild(arc);

        this.compassRose = document.createElement("div");
        this.compassRose.classList.add("mapCompassRose");
        this.controlCompass.appendChild(this.compassRose);

        ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'].forEach(function(d, index) {

            var dc = document.createElement("span");
            dc.innerHTML = this._compass[d].label;  
            dc.classList.add(this._compass[d].type);
            dc.setAttribute("compassIndex", this._compass[d].index);
            this.compassRose.appendChild(dc);

            // get size
            this._compass[d].spanWidth = dc.offsetWidth;

        }.bind(this));

        this.compassDirection = 's'; 
        this.compassHeading = 180;
        this.setDirection("s");
        this.setNeedleVisible(false);

        // create date/time 
        this.controlDateTime = document.createElement("div");
        this.controlDateTime.classList.add("mapDateTime");
        this.controlsContainer.appendChild(this.controlDateTime);

        var clockDisplay = document.createElement("div");
        clockDisplay.classList.add("clock");
        this.controlDateTime.appendChild(clockDisplay);

        this.clockTimer = setInterval(function() {
            clockDisplay.innerHTML = framework.common.statusBar.clock.innerHTML;
        }, 1000);
        clockDisplay.innerHTML = framework.common.statusBar.clock.innerHTML;


        // create direction display
        this.controlDirection = document.createElement("div");
        this.controlDirection.classList.add("mapDirection");
        this.controlsContainer.appendChild(this.controlDirection);

        // info display
        this.controlInfoDisplay = document.createElement("div");
        this.controlInfoDisplay.classList.add("mapInfoDisplay");
        this.controlDirection.appendChild(this.controlInfoDisplay);

        // create info labels
        this.controlInfoDisplayLabels = {};

        ['Latitude', 'Longitude', 'Elevation'].forEach(function(name) {

            var id = name.toLowerCase();

            var host = document.createElement("div");
            host.classList.add("label");

            var label = document.createElement("label");
            label.innerHTML = name;
            host.appendChild(label);

            this.controlInfoDisplayLabels[id] = document.createElement("strong");
            this.controlInfoDisplayLabels[id].innerHTML = "---";
            host.appendChild(this.controlInfoDisplayLabels[id]);

            this.controlInfoDisplay.appendChild(host);

        }.bind(this));

        // finalize
        this.hasUI = true;

        this.showMenu(true);
    },

    setMapInfoLabelValue: function(id, value) {

        if(!this.hasUI) return;

        if(this.controlInfoDisplayLabels[id]) {

            this.controlInfoDisplayLabels[id].innerHTML = value;

        }

    },

    disableInterface: function(disable) {

        this.isDisabled = disable;

        if(disable) {
            this.controlsContainer.classList.add("disabled");
        } else {
            this.controlsContainer.classList.remove("disabled");
        }
    },


    /**
     * Menu 
     */

    showMenu: function(open) {
        if(open) {
            this.controlMenu.classList.add("open");
            this.selectMenuItem(0);
        } else {
            this.controlMenu.classList.remove("open");
        }

        this.isMenuOpen = open;
    },

    addMenuItem: function(item) {

        var menuItem = document.createElement("div");
        menuItem.setAttribute("menuIndex", this.menuItemIndex);
        menuItem.classList.add("menuItem");
        this.menuList.appendChild(menuItem);

        var menuItemLabel = document.createElement("span");
        menuItem.appendChild(menuItemLabel);

        menuItemLabel.innerHTML = item.label;

        this.menuItemIndex++;
        this.menuItemLength++;

    },

    selectMenuItem: function(index) {

        // clear
        var selected = this.menuList.querySelector(".selected");
        console.log(selected);
        if(selected) selected.classList.remove("selected");

        var menuItem = this.menuList.querySelector("[menuIndex='" + index + "']");

        menuItem.classList.add("selected");

        this.menuCurrentIndex = index;
    },

    menuItemAction: function(index) {

        console.log(this.menuItems[index]);

        if(this.menuItems[index]) {
            switch(true) {

                case typeof(this.menuItems[index].action) == "function":

                    var result = this.menuItems[index].action.call(this);

                    if(result) {
                        this.showMenu(false);
                    }
                    break;

            }
        }
    },

    handleMenuEvent: function(event) {

        switch(event) {
            case "select":
                this.menuItemAction(this.menuCurrentIndex);
                break;


            case "cw":
                this.selectMenuItem(this.menuCurrentIndex < this.menuItemLength - 1 ? this.menuCurrentIndex + 1 : 0);

                break;

            case "ccw":
                this.selectMenuItem(this.menuCurrentIndex > 0 ? this.menuCurrentIndex - 1 : this.menuItemLength - 1);
                break;   
        }
    },

   
    /** 
     * (map) methods
     */

    bound: function(bounds, callback) {
        return;

        this.map.fitBounds(bounds);     
        
        if(typeof(callback) == "function") callback();

    },

    center: function(lat, lng) {

        var center = ol.proj.fromLonLat([lng, lat]);

        this.mapView.setCenter(center);

        return center;

    },

    addMarker: function(image, width, height, id) {

        var markerImage = document.createElement("img");
        markerImage.src = image;

        if(id) {
            markerImage.id = id;
        }

        var marker = new ol.Overlay({
            offset: [-1 * width / 2, -1 * height / 2],
            position: [0, 0],
            element: markerImage
        });

        this.map.addOverlay(marker);

        return marker;
    },  

    setTilt: function(tilt) {

        if(tilt) {
            this.ctrlMap.classList.add("tilted");
        } else {
            this.ctrlMap.classList.remove("tilted");
        }
    },

    defaultCenter: function() {
        this.bound(new google.maps.LatLngBounds(
            new google.maps.LatLng(25.82, -124.39),
            new google.maps.LatLng(49.38, -66.94)
        ));
    },

    setPosition: function (lat, lng) {

        if(!this.hasMap) return;

        var position = ol.proj.fromLonLat([lng, lat]);
        
        // set zoom
        if(this.mapProps.isFirstPosition) {
            this.mapProps.isFirstPosition = false;
            this.setZoom(this.mapProps.defaultZoom);
        }

        // set props
        this.mapProps.lastCenterLocation = position;

        if(this.mapProps.moveWithGPS) {
        
            this.mapProps.lastMoveLocation = this.offsetPosition(this.mapProps.lastCenterLocation);
        }

        // center gps marker and map
        this.gpsMarker.setPosition(position);

        var marker = this.gpsMarker.getElement();
        if(marker) {
            // rotate
            ['', 'o', 'webkit'].forEach(function(vp) {
                marker.style[vp + (vp == '' ? 't' : 'T') + 'ransform'] = "rotate(" + (this.compassHeading || 0) + "deg)";
            }.bind(this));
        }

        // cache coords
        this.mapProps.currentLatitude = lat;
        this.mapProps.currentLongitude = lng;
       
    },

    moveMap: function(id) {

        if(this.mapProps.lastMoveLocation) {

            var factor = 200,
                moves = {
                    left: [factor, 0],
                    right: [-1 * factor, 0],
                    up: [0, -1 * factor],
                    down: [0, factor]
                };

            if(moves[id]) {

                this.mapProps.moveWithGPS = false;

                this.mapProps.lastMoveLocation = this.offsetPosition(
                    this.mapProps.lastMoveLocation,
                    moves[id][0],
                    moves[id][1]
                );

            }

        }

    },

    offsetPosition: function(position, offsetX, offsetY, preventAnimation) {

        if(!this.hasMap) return;

        if(typeof(offsetX) == "undefined" || offsetX === false) offsetX = 125;
        if(typeof(offsetY) == "undefined" || offsetY === false) offsetY = 0;

        var resolution = this.mapView.getResolution(),
            cp = [
                position[0] - (offsetX * resolution),
                position[1] - (offsetY * resolution)
            ];

        // set animation
        if(this.mapProps.lastMoveLocation && !preventAnimation) {
            var animPan =  new ol.animation.pan({
                source: this.mapProps.lastMoveLocation,
                duration: 150
            });

            this.map.beforeRender(animPan);
        }

        this.mapView.setCenter(cp);

        return cp;
    },

    setZoom: function(zoom) {

        // check valid zoom
        // >= 3 <= 10, 11, 13, 15, 17
        if((zoom >=3 && zoom <= 10) || zoom == 11 || zoom == 13 || zoom == 15 || zoom == 17) {

            this.mapView.setZoom(zoom);
            this.mapProps.currentZoom = zoom;

            // adjust missing tile issue
        
            if(zoom < 13) {
                this.ctrlMap.classList.add("waterZoomFix"); 
            } else {
                this.ctrlMap.classList.remove("waterZoomFix");
            }

            // poi
            if(typeof(this.showPOI) == "function") {

                this.showPOI(zoom >= 11);

            }
        }

    },

    zoomIn: function() {
        var z = this.mapProps.currentZoom;

        if(z >= 17) return;
        if(z <= 10) {
            z++;
        } else {
            z += 2;
        } 

        this.setZoom(z);
        this.reCenterAfterZoom();
    },

    zoomOut: function() {

        var z = this.mapProps.currentZoom;

        if(z <= 3) return;
        if(z <= 11) {
            z--;
        } else {
            z -= 2;
        } 

        this.setZoom(z);
        this.reCenterAfterZoom();
    },

    reCenterAfterZoom: function() {

        if(!this.mapProps.moveWithGPS) {
            this.mapView.setCenter(this.mapProps.lastMoveLocation);
        } else {
            this.offsetPosition(this.mapProps.lastCenterLocation, false, false, true);
        }
    },

    reCenter: function() {

        if(this.mapProps.lastCenterLocation) {
            
            // reset
            this.mapProps.moveWithGPS = true;

            // set view
            this.setZoom(this.mapProps.defaultZoom);
            this.mapProps.lastMoveLocation = this.offsetPosition(this.mapProps.lastCenterLocation);

        }

    },


    /** 
     * (compass) methods
     */

    setDirection: function (direction) {

        var direction = direction.toLowerCase();

        if (!this._compass.hasOwnProperty(direction) || !this._compass.hasOwnProperty(this.compassDirection)) {
            return this.compassDirection;
        }

        if(this.lastDirection == direction) return;

        this.lastDirection = direction;
        

        // find new position
        var start = this._compass[this.compassDirection],
            end = this._compass[direction],
            ccw = start.index > end.index;
        
        // scroll to position
        this.compassRose.style.left = (115 - 20 - (end.index * 80)) + "px";

        // set selected
        var selected = this.compassRose.querySelector(".selected");
        if(selected) selected.classList.remove("selected");

        setTimeout(function() {

            this.compassRose.querySelector("span[compassIndex='" + end.index + "']").classList.add("selected");

        }.bind(this), 200);


        // save prev direction and set new direction
        this.compassDirection = direction;
        this.compassHeading = end.heading;

        // return
        return this.compassDirection;
    },

    
    /**
     * (hooks) methods
     */

    setLocationData: function(location) {

        if(location.isValidInfo) {

            this.setMapInfoLabelValue("latitude", location.latitude + " " + location.latUnit.toUpperCase());
            this.setMapInfoLabelValue("longitude", location.longitude + " " + location.longUnit.toUpperCase());
            this.setMapInfoLabelValue("elevation", location.elevation + location.eleUnit.toLowerCase());

            this.setDirection(location.heading);
            this.setNeedleVisible(location.showNeedle);

            if(typeof(location.latlng) == "object") {
                this.setPosition(location.latlng.lat, location.latlng.lng);
            }

        } else {

            this.setNeedleVisible(false);
        }
    },

    setNeedleVisible: function (state) {

        if(!this.hasUI) return;

    	var state = Boolean(state);

        if (state) {
            this.compassRose.classList.remove("disabled");
        } else {
            this.compassRose.classList.add("disabled");
        }
    },

   
    /**
     * (input)
     */

    handleControllerEvent: function(eventId) {

        //response will be return value at end of function
        var response = "ignored"; // always ignore for this app

        switch(true) {

            // pass control to menu handler
            case this.isMenuOpen: 
                return this.handleMenuEvent(eventId);
                break;

            // default: map controls
            default:
                switch(eventId) {
                    case "select":
                        //this.reCenter();
                        this.showMenu(true);
                        break;

                    case "left":
                    case "right":
                    case "down":
                    case "up":
                        this.moveMap(eventId);
                        break;

                    case "cw":
                        this.zoomIn();
                        break;

                    case "ccw":
                        this.zoomOut();
                        break;    
                }
        
                return response;
        }
    },

}; /** (NavCtrl.prototype) */
