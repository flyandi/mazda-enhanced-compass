package com.quaso.mazda.json;

import java.io.Serializable;

@SuppressWarnings("serial")
public class Route implements Serializable{
	private LatLng start;
	private LatLng dest;
	private RouteData data;

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

	public RouteData getData() {
		return data;
	}

	public void setData(RouteData data) {
		this.data = data;
	}
	
	@Override
	public String toString() {
		return "route [start=" + start + ", dest=" + dest +"]";
	}
	
	
}
