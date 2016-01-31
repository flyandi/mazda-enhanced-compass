 var LatLng = function(lat, lng) {

  if (toString.call(lat) === '[object Array]') {
    lng = lat[0];
    lat = lat[1];
  }

  lat = parseFloat(lat);
  lng = parseFloat(lng);

  lat = Math.max(Math.min(lat, 90), -90);
  lng = (lng + 180) % 360 + (lng < -180 ? 180 : -180);

  this.lat = Math.round(10000000*lat)/10000000;
  this.lng = Math.round(10000000*lng)/10000000;
};

LatLng.prototype = {
  toString: function() {
    return 'LatLng: ' + this.lat + ', ' + this.lng;
  }
};