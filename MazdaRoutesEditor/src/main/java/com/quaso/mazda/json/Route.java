package com.quaso.mazda.json;

import java.util.List;

public class Route {
	private List<Direction> directions;
	private Summary summary;
	private List<Double[]> path;

	Route() {

	}

	public List<Direction> getDirections() {
		return directions;
	}

	public void setDirections(List<Direction> directions) {
		this.directions = directions;
	}

	public Summary getSummary() {
		return summary;
	}

	public void setSummary(Summary summary) {
		this.summary = summary;
	}

	public List<Double[]> getPath() {
		return path;
	}

	public void setPath(List<Double[]> path) {
		this.path = path;
	}

}