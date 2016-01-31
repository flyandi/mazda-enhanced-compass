(function() {
    var routeData = null;

    var mapView = null;
    var map = null;
    var routeLayer = [];
    var newRoute = {
	start : null, finish : null
    };

    $(function() {
	createMap();

	createRouteList(null);

	$('#routesForm').submit(
		function(e) {
		    e.preventDefault();
		    $('#menuUpload.dropdown.open .dropdown-toggle').dropdown('toggle');
		    var formData = new FormData();
		    formData.append("file", inputRoutesFile.files[0]);
		    $.ajax(
			    {
				url : "/uploadFile", type : 'POST', data : formData, contentType : false,
				processData : false, dataType : 'text'
			    }).done(function(data) {
			createRouteList(JSON.parse(data), true);

		    }).fail(function(jqXHR, textStatus, errorThrown) {
			if (jqXHR.readyState == 0 && jqXHR.status == 0 && jqXHR.statusText == "error") {
			    alert("connection error");
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
				    window.contextMenu.extend(item);
				}
			    }
			}
			reader.onerror = function(evt) {
			    alert("error reading file");
			}
		    }

		});

	$('#show-all-routes').on('click', showAllRoutes);
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
		newRoute.finish = obj.data;
		feature = new ol.Feature(new ol.geom.Point(ol.proj.transform([ obj.data.lat, obj.data.lng ],
			'EPSG:4326', 'EPSG:3857')));
	    } else {
		feature = new ol.Feature(new ol.geom.Point(obj.coordinate));
		newRoute.finish = new LatLng(ol.proj.transform(obj.coordinate, 'EPSG:3857', 'EPSG:4326'));
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

	this.contextMenu = new ContextMenu({
	    width : 170, default_items : false, items : [ {
		text : 'Set start', icon : 'images/routeStart.png', callback : createStartMarker
	    }, '-', // this is a separator
	    {
		text : 'Set finish', icon : 'images/routeFinish.png', callback : createFinishMarker
	    } ]
	});
	map.addControl(this.contextMenu);
    }

    function computeRoute() {
	if (newRoute.start != null && newRoute.finish != null) {
	    console.info("start: " + newRoute.start);
	    console.info("finish: " + newRoute.finish);
	    GraphHopper.getInstance().fetch(newRoute.start.lng, newRoute.start.lat, newRoute.finish.lng,
		    newRoute.finish.lat, routeFinishCallback);
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
	    console.info(route);
	    showRoute(route);
	}
    };

    function createRouteList(data, doConcat) {
	var $listRoutes = $('#routesList');
	$listRoutes.empty();

	if (routeData != null && doConcat) {
	    routeData = routeData.concat(data);
	} else {
	    routeData = data;
	}

	if (routeData === null || routeData.length === 0) {
	    $("#message").html("<b>No routes found.</b>");
	} else {
	    $("#message").html("");

	    $.each(routeData, function(i, route) {
		var htmlRoute = createListItem(i, route);
		$(htmlRoute).appendTo($listRoutes);

		$('#route-item-' + i).on('click', function() {
		    // route selected

		    clearRoutes();
		    showRoute(route);
		});

		$('#route-item-delete-' + i).on('click', function(e) {
		    // remove route
		    e.stopPropagation();
		    routeData.splice(i, 1);
		    createRouteList(routeData);
		});
	    });
	}
    }

    function createListItem(id, route) {
	return "<li id='route-item-" + id + "' class='list-group-item'><button id='route-item-delete-" + id
		+ "' class='remove-route' ><i class='fa fa-trash-o'></i></button>" + route.start.lat + ","
		+ route.start.lng + " - " + route.dest.lat + "," + route.dest.lng + "</li>";
    }

    function showRoute(route, lineWidth, removeCurrent) {

	var coordinates = [];
	var path;
	try {
	    path = route.data.path;
	} catch (e) {
	    path = route.full_path;
	}

	for (var i = 0, len = path.length; i < len; i++) {
	    var point = path[i];
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

})();