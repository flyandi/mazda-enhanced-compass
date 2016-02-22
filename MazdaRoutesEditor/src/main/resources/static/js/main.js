(function() {
    var routeData = null;

    var mapView = null;
    var map = null;
    var contextMenu = null;
    var routeLayer = [];
    var newRoute = {};
    var destinationsData = [];
    var routeColor = "red";

    GraphHopper.getInstance().locale = "en";

    $(function() {
	createMap();

	createRoutesList(null);

	createDestinationsList();

	createColorpicker();

	$('#localeId').val(GraphHopper.getInstance().locale);
	$('#localeId').change(function() {
	    newLocale = $('#localeId').val();
	    if (newLocale === "") {
		alert("locale code cannot be empty");
	    } else {
		if (newLocale != GraphHopper.getInstance().locale && routeData.length > 0) {
		    alert("Current routes uses different locale and you must regenerate them.");
		}
		GraphHopper.getInstance().locale = newLocale;
	    }
	});

	$('#routesForm').submit(
		function(e) {
		    e.preventDefault();
		    $('#menuUpload.dropdown.open .dropdown-toggle').dropdown('toggle');
		    var formData = new FormData();
		    formData.append("file", inputRoutesFile.files[0]);
		    $.ajax(
			    {
				url : "/uploadFile", type : 'POST', data : formData, contentType : false,
				processData : false, dataType : 'multipart/form-data'
			    }).done(function(data) {
			createRoutesList(JSON.parse(data), true);
		    }).fail(function(jqXHR, textStatus, errorThrown) {
			if (jqXHR.readyState == 4 && jqXHR.status == 200 && jqXHR.statusText === "OK") {
			    createRoutesList(JSON.parse(jqXHR.responseText), true);
			} else {
			    alert("connection error " + jqXHR.status + ": " + jqXHR.statusText);
			}
		    });

		});

	$('#settingsForm').submit(function(e) {
	    e.preventDefault();
	    $('#menuUpload.dropdown.open .dropdown-toggle').dropdown('toggle');
	    var file = inputSettingsFile.files[0];
	    if (file) {
		var reader = new FileReader();
		reader.readAsText(file, "UTF-8");
		reader.onload = function(evt) {
		    var elm = document.getElementById("settingsJs");
		    if (elm != null) {
			alert("You cannot load settings.js file more than once. Reload the page.");
		    } else {
			elm = document.createElement('script');
			elm.id = "settingsJs";
			elm.type = "application/javascript";
			elm.innerHTML = evt.target.result;
			document.body.appendChild(elm);
			GraphHopper.getInstance().apiKey = SETTINGS.credentials.graphHopper;
			GraphHopper.getInstance().locale = SETTINGS.locale;
			routeColor = SETTINGS.routeColor;

			destinationsData = destinationsData.concat(SETTINGS.destinations);
			createDestinationsList();
			createMapContextMenu();
			createRoutesList();

			$('#colorPicker').colorpicker('destroy');
			createColorpicker(routeColor);

			$('#graphhopperAPILabel').html("GraphHopper API key set");
			$('#graphhopperAPILabel').removeClass("alert-danger");
			$('#graphhopperAPILabel').addClass("alert-success");
			$('#localeId').val(GraphHopper.getInstance().locale);
		    }
		}
		reader.onerror = function(evt) {
		    alert("error reading file");
		}
	    }

	});

	$('#show-all-routes').on('click', showAllRoutes);
	$('#cleanNewRoute').on('click', cleanNewRoute);
	$('#addNewRoute').on('click', addNewRoute);
	$('#saveToFile').on('click', saveToFile);
	$('#setAPIKey').on('click', setAPIKey);
	$('#unsavedRouteWarning').on('click', addNewRoute);
	$('#createSettings').click(function(e) {
	    createSettings();
	    e.preventDefault();
	});
    });

    function createColorpicker(color) {
	$('#colorPicker').colorpicker({
	    color : color || 'red'
	}).on('changeColor', function(ev) {
	    routeColor = ev.color.toHex();
	});
    }

    function createMap() {
	// create view
	mapView = new ol.View({
	    maxZoom : 17, zoom : 15
	});

	// create map source
	mapSource = new ol.source.OSM();

	// create map layer
	mapLayer = new ol.layer.Tile({
	    source : this.mapSource
	});

	mapLayer.setUseInterimTilesOnError(false);

	startMarkerLayer = new ol.layer.Vector({
	    source : new ol.source.Vector({})
	});
	finishMarkerLayer = new ol.layer.Vector({
	    source : new ol.source.Vector({})
	});

	// create map
	map = new ol.Map({
	    layers : [ this.mapLayer, startMarkerLayer, finishMarkerLayer ], target : 'map', view : mapView,
	    interactions : ol.interaction.defaults({
		dragPan : true, mouseWheelZoom : true
	    })
	});

	var geolocation = new ol.Geolocation({
	    projection : mapView.getProjection()
	});
	geolocation.setTracking(true);

	geolocation.on('change:position', function() {
	    var coordinates = geolocation.getPosition();
	    mapView.setCenter(coordinates);
	});
	geolocation.on('error', function(error) {
	    var position = ol.proj.fromLonLat([ 0, 0 ]);
	    mapView.setCenter(position);
	    mapView.setZoom(2);
	});

	createStartMarker = function(obj) {
	    feature = new ol.Feature(new ol.geom.Point(obj.coordinate));
	    feature.setStyle(new ol.style.Style({
		image : new ol.style.Icon({
		    scale : .6, anchor : [ 0.5, 1 ], src : 'img/routeStart.png'
		})
	    }));
	    startMarkerLayer.getSource().clear();
	    startMarkerLayer.getSource().addFeature(feature);
	    newRoute.start = new LatLng(ol.proj.transform(obj.coordinate, 'EPSG:3857', 'EPSG:4326'));
	    computeRoute();
	}

	createFinishMarker = function(obj) {
	    if (obj.data != null) {
		newRoute.dest = obj.data;
		feature = new ol.Feature(new ol.geom.Point(ol.proj.transform([ obj.data.lat, obj.data.lng ],
			'EPSG:4326', 'EPSG:3857')));
	    } else {
		newFinish = new LatLng(ol.proj.transform(obj.coordinate, 'EPSG:3857', 'EPSG:4326'));
		// check if destination exists
		var foundDestination = false;
		for (i = 0; i < destinationsData.length; i++) {
		    if (Math.abs(destinationsData[i].lat - newFinish.lat) < 0.0001
			    && Math.abs(destinationsData[i].lng - newFinish.lng) < 0.0001) {
			foundDestination = true;
			newFinish = destinationsData[i];
			break;
		    }
		}
		if (!foundDestination) {
		    // we have to create new one
		    if (!createDestination(obj, "This destination does not exist yet. Create new with this name:")) {
			return;
		    }
		}
		feature = new ol.Feature(new ol.geom.Point(obj.coordinate));
		newRoute.dest = newFinish;
	    }
	    feature.setStyle(new ol.style.Style({
		image : new ol.style.Icon({
		    scale : .6, anchor : [ 0.5, 1 ], src : 'img/routeFinish.png'
		})
	    }));
	    finishMarkerLayer.getSource().clear();
	    finishMarkerLayer.getSource().addFeature(feature);
	    computeRoute();
	}

	contextMenu = new ContextMenu({
	    width : 170, default_items : false, items : []
	});
	createMapContextMenu();
	map.addControl(contextMenu);
    }

    function createMapContextMenu() {
	contextMenu.clear();
	contextMenu.extend([ {
	    text : 'Set start', icon : 'img/routeStart.png', callback : createStartMarker
	}, {
	    text : 'Set finish', icon : 'img/routeFinish.png', callback : createFinishMarker
	} ]);

	if (typeof (SETTINGS) != "undefined") {
	    contextMenu.extend([ '-', // this is a separator
	    {
		text : 'Create destination here', callback : createDestination
	    } ]);
	    for (i = 0; i < destinationsData.length; i++) {
		var item = [ {
		    text : 'Go to: ' + destinationsData[i].name, icon : 'img/routeFinish.png',
		    callback : createFinishMarker, data : {
			lat : destinationsData[i].lat, lng : destinationsData[i].lng
		    }
		} ];
		contextMenu.extend(item);
	    }
	}
    }

    function computeRoute() {
	if (newRoute.start != null && newRoute.dest != null) {
	    GraphHopper.getInstance().fetch(newRoute.start.lng, newRoute.start.lat, newRoute.dest.lng,
		    newRoute.dest.lat, routeFinishCallback);
	}
    }

    function routeFinishCallback(route) {
	if (route == null || typeof (route.error) !== "undefined") {
	    if (route == null) {
		alert("Error: unkown");
	    } else {
		alert("Error: " + route.error);
	    }
	} else {
	    clearRoutes();
	    newRoute.data = route;
	    showRoute(newRoute);
	    $('#addNewRoute').parent().removeClass("disabled");
	    setVisible($('#unsavedRouteWarning'));
	}
    };

    function createRoutesList(data, doConcat) {
	var $listRoutes = $('#routesList');
	$listRoutes.empty();

	if (typeof (data) != "undefined" && data != null) {
	    if (routeData != null && doConcat) {
		routeData = routeData.concat(data);
	    } else {
		routeData = data;
	    }
	}

	if (routeData === null || routeData.length === 0) {
	    $("#routesMessage").html("<b>No routes found.</b>");
	} else {
	    $("#routesMessage").html("");

	    $.each(routeData, function(id, route) {
		var htmlRoute = createRouteListItem(id, route);
		$(htmlRoute).appendTo($listRoutes);

		$('#route-item-' + id).on('click', function() {
		    // route selected
		    $('#addNewRoute').parent().addClass("disabled");
		    clearRoutes();
		    showRoute(route);
		});

		$('#route-item-delete-' + id).on('click', function(e) {
		    // remove route
		    e.stopPropagation();
		    routeData.splice(id, 1);
		    createRoutesList(routeData);
		});
	    });
	}

	function createRouteListItem(id, route) {
	    var dest = route.dest.lat + "," + route.dest.lng;
	    for (i = 0; i < destinationsData.length; i++) {
		if (Math.abs(destinationsData[i].lat - route.dest.lat) < 0.000001
			&& Math.abs(destinationsData[i].lng - route.dest.lng) < 0.000001) {
		    dest = destinationsData[i].name;
		    break;
		}
	    }
	    return "<li id='route-item-" + id + "' class='list-group-item'><button id='route-item-delete-" + id
		    + "' class='remove' ><i class='fa fa-trash-o'></i></button>" + route.start.lat + ","
		    + route.start.lng + " - " + dest + "</li>";
	}
    }

    function createDestinationsList() {
	var $listDestinations = $('#destinationsList');
	$listDestinations.empty();

	if (destinationsData.length === 0) {
	    $("#destinationsMessage").html("<b>No destinations</b>");
	} else {
	    $("#destinationsMessage").html("");

	    $.each(destinationsData, function(id, destination) {
		var htmlRoute = "<li id='destination-item-" + id
			+ "' class='list-group-item'><button id='destination-item-delete-" + id
			+ "' class='remove' ><i class='fa fa-trash-o'></i></button>" + destination.name + "</li>"
		$(htmlRoute).appendTo($listDestinations);

		$('#destination-item-' + id).on('click', function() {
		    // destination selected
		    showDestination(destination);
		});

		$('#destination-item-delete-' + id).on('click', function(e) {
		    // remove destination
		    e.stopPropagation();
		    destinationsData.splice(id, 1);
		    createDestinationsList();
		    createMapContextMenu();
		});
	    });
	}
    }

    function showRoute(route, lineWidth, removeCurrent) {
	finishMarkerLayer.getSource().clear();
	startMarkerLayer.getSource().clear();

	var coordinates = [];

	for (var i = 0, len = route.data.path.length; i < len; i++) {
	    var point = route.data.path[i];
	    coordinates.push(ol.proj.transform([ point[1], point[0] ], 'EPSG:4326', 'EPSG:3857'));
	}

	var routeFeature = new ol.Feature({
	    geometry : new ol.geom.LineString(coordinates, 'XY'), name : 'Line', type : 'route'
	});
	routeFeature.setStyle(new ol.style.Style({
	    stroke : new ol.style.Stroke({
		color : routeColor, width : 4
	    })
	}));

	var startMarker = new ol.Feature({
	    geometry : new ol.geom.Point(coordinates[0])
	});
	startMarker.setStyle(new ol.style.Style({
	    image : new ol.style.Icon({
		anchor : [ 0.5, 1 ], src : 'img/routeStart.png'
	    })
	}));

	var endMarker = new ol.Feature({
	    type : 'icon', geometry : new ol.geom.Point(coordinates[coordinates.length - 1])
	});
	endMarker.setStyle(new ol.style.Style({
	    image : new ol.style.Icon({
		anchor : [ 0.5, 1 ], src : 'img/routeFinish.png'
	    })
	}));

	var layer = new ol.layer.Vector({
	    source : new ol.source.Vector({
		features : [ routeFeature, startMarker, endMarker ]
	    })
	});

	routeLayer.push(layer);
	map.addLayer(layer);

	var polygon = routeFeature.getGeometry();
	var size = map.getSize();
	mapView.fit(polygon, size, {
	    padding : [ 170, 50, 30, 150 ], constrainResolution : false
	});
    }

    function showDestination(destination) {
	clearRoutes();
	var point = ol.proj.transform([ destination.lng, destination.lat ], 'EPSG:4326', 'EPSG:3857');
	var marker = new ol.Feature({
	    geometry : new ol.geom.Point(point)
	});
	marker.setStyle(new ol.style.Style({
	    image : new ol.style.Icon({
		anchor : [ 0.5, 1 ], src : 'img/routeFinish.png'
	    })
	}));

	var layer = new ol.layer.Vector({
	    source : new ol.source.Vector({
		features : [ marker ]
	    })
	});

	routeLayer.push(layer);
	map.addLayer(layer);

	mapView.setCenter(point);
	mapView.setZoom(15);
    }

    function createDestination(data, message) {
	var name = window.prompt(message || "Name this destination", "");
	if (name != null) {
	    temp = ol.proj.transform([ data.coordinate[0], data.coordinate[1] ], 'EPSG:3857', 'EPSG:4326');
	    destinationsData.push({
		name : name, lat : temp[1], lng : temp[0]
	    });
	    createDestinationsList();
	    createMapContextMenu();
	    return true;
	}
	return false;
    }

    function showAllRoutes() {
	clearRoutes();
	$.each(routeData, function(i, route) {
	    showRoute(route, 2);
	});
    }

    function clearRoutes() {
	routeLayer.forEach(function(route) {
	    map.removeLayer(route);
	});
	routeLayer = [];
    }

    function cleanNewRoute(dontHideRoute) {
	newRoute = {};
	$('#addNewRoute').parent().addClass("disabled");
	setHidden($('#unsavedRouteWarning'));
	if (!dontHideRoute) {
	    clearRoutes();
	}
    }

    function addNewRoute() {
	if (routeData === null || routeData.length === 0) {
	    routeData = [];
	}
	if (newRoute == null) {
	    return;
	}
	routeData.push(newRoute);
	createRoutesList(routeData, false);
	cleanNewRoute(true);
    }

    function generateUUID() {
	var d = new Date().getTime();
	if (window.performance && typeof window.performance.now === "function") {
	    d += performance.now(); // use high-precision timer if available
	}
	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	    var r = (d + Math.random() * 16) % 16 | 0;
	    d = Math.floor(d / 16);
	    return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
	});
	return uuid;
    }

    function saveToFile() {
	// wait till all routes are send, then call saveAsZip

	var errorDetected = null;
	var toBeUploaded = routeData.length;

	uuid = generateUUID();

	function callbackInternal() {
	    toBeUploaded--;
	    if (toBeUploaded == 0) {
		// uploading finished
		if (errorDetected != null) {
		    alert(errorDetected.status + ": " + errorDetected.statusText);
		} else {
		    $.fileDownload('/saveAsZip/filename/' + uuid + '/routesCacheFile.zip?', {
			successCallback : function(url) {
			    console.info("routes downloaded");
			}, failCallback : function(html, url, error) {
			    alert('Error downloading file with the routes: ' + error);
			}
		    });
		}
	    }
	};

	for (i = 0; i < routeData.length; i++) {
	    var route = routeData[i];
	    $.ajax({
		url : "/importRoute", type : 'POST', data : JSON.stringify({
		    uuid : uuid, route : route
		}), dataType : 'json', contentType : "application/json"
	    }).done(
		    function(data) {
			console.info("route [start=[lat=" + route.start.lat + ", lng=" + route.start.lng
				+ "], dest=[lat=" + route.dest.lat + ", lng=" + route.dest.lng + "]] exported");
		    }).fail(function(jqXHR, textStatus, errorThrown) {
		console.info(jqXHR);
		if (errorDetected == null) {
		    errorDetected = jqXHR;
		}
	    }).always(function() {
		callbackInternal();
	    });
	}
    }

    function setAPIKey() {
	GraphHopper.getInstance().apiKey = window.prompt(
		"Enter GraphHopper API key or obtain one at https://graphhopper.com/", GraphHopper.getInstance().apiKey
			|| "");
	if (GraphHopper.getInstance().apiKey != null) {
	    $('#graphhopperAPILabel').html("GraphHopper API key set");
	    $('#graphhopperAPILabel').removeClass("alert-danger");
	    $('#graphhopperAPILabel').addClass("alert-success");
	}
    }

    function createSettings() {
	if (GraphHopper.getInstance().apiKey == null) {
	    setAPIKey();
	    if (GraphHopper.getInstance().apiKey == null) {
		return;
	    }
	}

	if (SETTINGS != null) {
	    exportURI = SETTINGS.exportURI;
	} else {
	    exportURI = "https://mazdaroutesmanager.appspot.com/";
	}
	var newExportURI = window.prompt("Change export URL", exportURI);
	if (newExportURI != null) {
	    exportURI = newExportURI;
	}

	var SETTINGS = {
	    locale : GraphHopper.getInstance().locale, destinations : [], credentials : {
		graphHopper : GraphHopper.getInstance().apiKey
	    }, routeColor : routeColor, exportURI : exportURI, exportEmail : "some@address"
	};

	for (i = 0; i < destinationsData.length; i++) {
	    SETTINGS.destinations.push({
		name : destinationsData[i].name, lat : destinationsData[i].lat, lng : destinationsData[i].lng
	    });
	}

	var blob = new Blob([ "var SETTINGS =" + JSON.stringify(SETTINGS, null, 2) + ";" ], {
	    type : "text/plain;charset=utf-8"
	});
	saveAs(blob, "settings.js");
    }

    function setVisible(el) {
	el.removeClass("hidden");
	el.addClass("visible");
    };

    function setHidden(el) {
	el.removeClass("visible");
	el.addClass("hidden");
    };
})();