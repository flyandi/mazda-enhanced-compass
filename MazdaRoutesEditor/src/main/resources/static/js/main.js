(function () {
    var routeData = null;

    var mapView = null;
    var map = null;
    var routeLayer = [];

    $(function () {
        createMap();
        var position = ol.proj.fromLonLat([17.213764, 48.1392171]);
        mapView.setCenter(position);
        createRouteList(null);

        $('#routesForm').submit(
            function (e) {
                e.preventDefault();
                $('#menuUpload.dropdown.open .dropdown-toggle').dropdown('toggle');
                var formData = new FormData();
                formData.append("file", inputFile.files[0]);
                $.ajax(
                    {
                        url: "/uploadFile", type: 'POST', data: formData, contentType: false,
                        processData: false, dataType: 'text'
                    }).done(function (data) {
                    createRouteList(JSON.parse(data));

                }).fail(function (jqXHR, textStatus, errorThrown) {
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
            maxZoom: 17, zoom: 15
        });

        // create map source
        mapSource = new ol.source.OSM();

        // create map layer
        mapLayer = new ol.layer.Tile({
            source: this.mapSource
        });

        mapLayer.setUseInterimTilesOnError(false);

        // create map
        map = new ol.Map({
            layers: [this.mapLayer], target: 'map', view: mapView, interactions: ol.interaction.defaults({
                dragPan: true, mouseWheelZoom: true
            })
        });

    }

    function createRouteList(data) {
        var $listRoutes = $('#routesList');
        $listRoutes.empty();

        if (routeData != null) {
            routeData = routeData.concat(data);
        } else {
            routeData = data;
        }

        if (routeData === null || routeData.length === 0) {
            $("#message").html("<b>No routes found.</b>");
        } else {
            $("#message").html("");

            $.each(routeData, function (i, route) {
                var htmlRoute = createListItem(i, route);
                $(htmlRoute).appendTo($listRoutes);

                $('#route-item-' + i).on('click', function () {
                    // route selected

                    clearRoutes();
                    showRoute(route);
                });

                $('#route-item-delete-' + i).on('click', function (e) {
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

        for (var i = 0, len = route.data.path.length; i < len; i++) {
            var point = route.data.path[i];
            coordinates.push(ol.proj.transform([point[1], point[0]], 'EPSG:4326', 'EPSG:3857'));
        }

        var feature = new ol.Feature({
            geometry: new ol.geom.LineString(coordinates, 'XY'), name: 'Line'
        });

        feature.setStyle(new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#ff0000', width: 4 || lineWidth
            })
        }));

        var layer = new ol.layer.Vector({
            source: new ol.source.Vector({
                features: [feature]
            })
        });

        routeLayer.push(layer);
        map.addLayer(layer);

        var polygon = feature.getGeometry();
        var size = map.getSize();
        mapView.fit(polygon, size, {
            padding: [170, 50, 30, 150], constrainResolution: false
        });
    }

    function showAllRoutes() {
        clearRoutes();
        $.each(routeData, function (i, route) {
            showRoute(route, 2);
        });
    }

    function clearRoutes(){
        routeLayer.forEach(function(route){
            map.removeLayer(route);
        });
        routeLayer = [];
    }

})();