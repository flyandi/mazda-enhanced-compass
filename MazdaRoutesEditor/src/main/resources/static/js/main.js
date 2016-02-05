(function() {
    var routeData = null;

    var mapView = null;
    var map = null;
    var contextMenu = null;
    var routeLayer = [];
    var newRoute = {};
    var destinationsData = [];

    $(function() {
	createMap();

	createRoutesList(null);

	createDestinationsList();

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

	$('#settingsForm').submit(
		function(e) {
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

				for (i = 0; i < SETTINGS.destinations.length; i++) {
				    var item = [ {
					text : 'Go to: ' + SETTINGS.destinations[i].name,
					icon : 'images/routeFinish.png', callback : createFinishMarker, data : {
					    lat : SETTINGS.destinations[i].lat, lng : SETTINGS.destinations[i].lng
					}
				    } ];
				    contextMenu.extend(item);
				}

				destinationsData = destinationsData.concat(SETTINGS.destinations);
				createDestinationsList();
			    }
			}
			reader.onerror = function(evt) {
			    alert("error reading file");
			}
		    }

		});

	$('#show-all-routes').on('click', showAllRoutes);
	$('#createNewRoute').on('click', createNewRoute);
	$('#addNewRoute').on('click', addNewRoute);
	$('#saveToFile').on('click', saveToFile);
	$('#createSettings').on('click', createSettings);
    });

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

	var startMarkerLayer = new ol.layer.Vector({
	    source : new ol.source.Vector({})
	});
	var finishMarkerLayer = new ol.layer.Vector({
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
		    scale : .6, anchor : [ 0.5, 1 ], src : 'images/routeStart.png'
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
		feature = new ol.Feature(new ol.geom.Point(obj.coordinate));
		newRoute.dest = new LatLng(ol.proj.transform(obj.coordinate, 'EPSG:3857', 'EPSG:4326'));
	    }
	    feature.setStyle(new ol.style.Style({
		image : new ol.style.Icon({
		    scale : .6, anchor : [ 0.5, 1 ], src : 'images/routeFinish.png'
		})
	    }));
	    finishMarkerLayer.getSource().clear();
	    finishMarkerLayer.getSource().addFeature(feature);
	    computeRoute();
	}

	contextMenu = new ContextMenu({
	    width : 170, default_items : false, items : [ {
		text : 'Set start', icon : 'images/routeStart.png', callback : createStartMarker
	    }, '-', // this is a separator
	    {
		text : 'Set finish', icon : 'images/routeFinish.png', callback : createFinishMarker
	    }, {
		text : 'Create destination here', callback : createDestination
	    } ]
	});
	map.addControl(contextMenu);
    }

    function computeRoute() {
	if (newRoute.start != null && newRoute.dest != null) {
	    console.info("start: " + newRoute.start);
	    console.info("dest: " + newRoute.dest);
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
	    newRoute.data = route;
	    showRoute(route);
	    $('#addNewRoute').parent().removeClass("disabled");
	}
    };

    function createRoutesList(data, doConcat) {
	var $listRoutes = $('#routesList');
	$listRoutes.empty();

	if (routeData != null && doConcat) {
	    routeData = routeData.concat(data);
	} else {
	    routeData = data;
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
		    showRoute(route.data);
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
	    return "<li id='route-item-" + id + "' class='list-group-item'><button id='route-item-delete-" + id
		    + "' class='remove' ><i class='fa fa-trash-o'></i></button>" + route.start.lat + ","
		    + route.start.lng + " - " + route.dest.lat + "," + route.dest.lng + "</li>";
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
		});
	    });
	}
    }

    function showRoute(route, lineWidth, removeCurrent) {
	var coordinates = [];

	for (var i = 0, len = route.path.length; i < len; i++) {
	    var point = route.path[i];
	    coordinates.push(ol.proj.transform([ point[1], point[0] ], 'EPSG:4326', 'EPSG:3857'));
	}

	var routeFeature = new ol.Feature({
	    geometry : new ol.geom.LineString(coordinates, 'XY'), name : 'Line', type : 'route'
	});
	routeFeature.setStyle(new ol.style.Style({
	    stroke : new ol.style.Stroke({
		color : '#ff0000', width : 4
	    })
	}));

	var startMarker = new ol.Feature({
	    geometry : new ol.geom.Point(coordinates[0])
	});
	startMarker.setStyle(new ol.style.Style({
	    image : new ol.style.Icon({
		anchor : [ 0.5, 1 ], src : 'images/routeStart.png'
	    })
	}));

	var endMarker = new ol.Feature({
	    type : 'icon', geometry : new ol.geom.Point(coordinates[coordinates.length - 1])
	});
	endMarker.setStyle(new ol.style.Style({
	    image : new ol.style.Icon({
		anchor : [ 0.5, 1 ], src : 'images/routeFinish.png'
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
		anchor : [ 0.5, 1 ], src : 'images/routeFinish.png'
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

    function createDestination(data) {
	var name = window.prompt("Name this destination", "");
	temp = ol.proj.transform([ data.coordinate[1], data.coordinate[0] ], 'EPSG:3857', 'EPSG:4326');
	destinationsData.push({
		name : name, lat : temp[0], lng : temp[1]
	    });
	createDestinationsList();
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

    function createNewRoute(dontHideRoute) {
	newRoute = {};
	$('#addNewRoute').parent().addClass("disabled");
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
	createNewRoute(true);
    }

    function saveToFile() {
	// wait till all routes are send, then call saveAsZip

	var errorDetected = null;
	var toBeUploaded = routeData.length;
	function callbackInternal() {
	    toBeUploaded--;
	    if (toBeUploaded == 0) {
		// uploading finished
		if (errorDetected != null) {
		    alert(errorDetected.status + ": " + errorDetected.statusText);
		} else {
		    $.fileDownload('/saveAsZip/filename/routesCacheFile.zip', {
			successCallback : function(url) {
			    console.info("routes sent by email");
			}, failCallback : function(html, url, error) {
			    alert('Error downloading file with the routes: ' + error);
			}
		    });
		}
	    }
	};

	for (i = 0; i < routeData.length; i++) {
	    $.ajax(
		    {
			url : "/importRoute", type : 'POST', data : JSON.stringify(routeData[i]), dataType : 'json',
			contentType : "application/json"
		    }).done(function(data) {
		console.info("route uploaded");
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

    function createSettings() {

    }
})();