
(function(){
	var routeData;
var __NavPOICtrl;

$(function(){
	 __NavPOICtrl = new NavCtrl();
});

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

function createRouteList(routeData){
	var $listRoutes = $('#routesList');
	$listRoutes.empty();
	
	this.routeData = routeData;
	
	if (routeData === null || routeData.length === 0){
		$("#message").html("<b>No routes found.</b>");
	}else{
		$("#message").html("");
	
	  $.each(routeData, function(i, route) {
          var htmlRoute = "<li id='route-item-"+i+"' class='list-group-item'><button id='route-item-delete-"+i+"' class=\"remove-route\" ><i class=\"fa fa-trash-o\"></i></button>" + route.start.lat + "</li>";
          $(htmlRoute).appendTo($listRoutes);
          
          $('#route-item-'+i).on('click', function(){
          	//route selected
	        	alert('route clicked ' + JSON.stringify(route));
	        });
          
          $('#route-item-delete-'+i).on('click', function(e){
          	//remove route
          	e.stopPropagation();	         
	        	routeData.splice(i, 1);
	        	createRouteList(routeData);
	        });
  });
	}
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
			      createRouteList(JSON.parse(data));			        
			   
			        
			    }).fail(function(jqXHR, textStatus, errorThrown) {
				if (jqXHR.readyState == 0 && jqXHR.status == 0 && jqXHR.statusText == "error") {
				    alert("connection error");
				}
			    });

			});
	    });
	});
})();