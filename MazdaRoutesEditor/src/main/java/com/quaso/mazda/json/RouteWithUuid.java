package com.quaso.mazda.json;

import java.io.Serializable;

@SuppressWarnings("serial")
public class RouteWithUuid implements Serializable {
	private Route route;
	private String uuid;

	public Route getRoute() {
		return route;
	}

	public void setRoute(Route route) {
		this.route = route;
	}

	public String getUuid() {
		return uuid;
	}

	public void setUuid(String uuid) {
		this.uuid = uuid;
	}
}
