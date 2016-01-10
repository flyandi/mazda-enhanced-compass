package com.quaso.mazda.json;

public class RouteData {
	private LatLng start;
	private LatLng dest;
	private Route data;

	public LatLng getStart() {
		return start;
	}

	public void setStart(LatLng start) {
		this.start = start;
	}

	public LatLng getDest() {
		return dest;
	}

	public void setDest(LatLng dest) {
		this.dest = dest;
	}

	public Route getData() {
		return data;
	}

	public void setData(Route data) {
		this.data = data;
	}
}
