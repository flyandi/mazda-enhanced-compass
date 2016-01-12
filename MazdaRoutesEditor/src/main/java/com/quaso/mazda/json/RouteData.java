package com.quaso.mazda.json;

import java.util.List;

import org.apache.commons.lang3.builder.EqualsBuilder;

public class RouteData {
	private List<Direction> directions;
	private Summary summary;
	private List<Double[]> path;

	RouteData() {

	}

	public RouteData(List<Direction> directions, Summary summary, List<Double[]> path) {
		this.directions = directions;
		this.summary = summary;
		this.path = path;
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