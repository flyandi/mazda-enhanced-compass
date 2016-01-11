var __NavPOICtrl;

function init() {
    __NavPOICtrl = new NavCtrl();
};

function NavCtrl() {
    this.createMap();

    var position = ol.proj.fromLonLat([ 17.213764, 48.1392171 ]);
    this.mapView.setCenter(position);
};

/**
 * Prototype
 */

NavCtrl.prototype = {

    createMap : function() {

	// create view
	this.mapView = new ol.View({
	    maxZoom : 17, zoom : 15,
	});

	// create map source
	this.mapSource = new ol.source.OSM();

	// create map layer
	this.mapLayer = new ol.layer.Tile({
	    source : this.mapSource
	});

	this.mapLayer.setUseInterimTilesOnError(false);

	// create map
	this.map = new ol.Map({
	    layers : [ this.mapLayer ], target : 'map', view : this.mapView, interactions : ol.interaction.defaults({
		dragPan : true, mouseWheelZoom : true,
	    }),
	});

    },
}

$(document).ready(
	function() {
	    $(function() {
		$('#routesForm').submit(
			function(e) {
			    e.preventDefault();
			    var formData = new FormData();
			    formData.append("file", inputFile.files[0]);
			    $.ajax(
				    {
					url : "/uploadFile", type : 'POST', data : formData, contentType : false,
					processData : false, dataType : 'text'
				    }).done(function(data) {
				console.info("routes uploaded " + data);
				var listRoutes = $('#routesList');
			        var numRoutes = listRoutes.children().length;
//
			        $.each(data, function(i, route) {
			                var htmlRoute = "<li class='list-group-item'>" + data + "</li>";
			                $(htmlRoute).appendTo($(listRoutes));
			        });
			    }).fail(function(jqXHR, textStatus, errorThrown) {
				if (jqXHR.readyState == 0 && jqXHR.status == 0 && jqXHR.statusText == "error") {
				    alert("connection error");
				}
			    });

			});
	    });
	});