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
		    formData.append("file", inputFile.files[0]);
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
	var finishMarkerLaxer = new ol.layer.Vector({
	    source : new ol.source.Vector({})
	});

	// create map
	map = new ol.Map({
	    layers : [ this.mapLayer, startMarkerLayer, finishMarkerLaxer ], target : 'map', view : mapView,
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
	    feature = new ol.Feature(new ol.geom.Point(obj.coordinate));
	    feature.setStyle(new ol.style.Style({
		image : new ol.style.Icon({
		    scale : .6, anchor : [ 0.5, 1 ], src : 'images/routeFinish.png'
		})
	    }));
	    finishMarkerLaxer.getSource().clear();
	    finishMarkerLaxer.getSource().addFeature(feature);
	    newRoute.finish = new LatLng(ol.proj.transform(obj.coordinate, 'EPSG:3857', 'EPSG:4326'));
	    computeRoute();
	}

	var contextmenu = new ContextMenu({
	    width : 170, default_items : false, items : [ {
		text : 'Set start', icon : 'images/routeStart.png', callback : createStartMarker
	    }, {
		text : 'Set finish', icon : 'images/routeFinish.png', callback : createFinishMarker
	    } ]
	});
	map.addControl(contextmenu);
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