package com.quaso.mazda.json;

public class LatLng {
	public double lat;
	public double lng;

	LatLng() {

	}
	
	public LatLng(double lat, double lng){
		this.lat = lat;
		this.lng = lng;
	}

	public double getLat() {
		return lat;
	}

	public void setLat(double lat) {
		this.lat = lat;
	}

	public double getLng() {
		return lng;
	}

	public void setLng(double lng) {
		this.lng = lng;
	}

}