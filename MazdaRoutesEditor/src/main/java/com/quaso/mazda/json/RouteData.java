package com.quaso.mazda.json;

import java.io.Serializable;
import java.util.List;

@SuppressWarnings("serial")
public class RouteData implements Serializable {
	private List<Direction> directions;
	private Summary summary;
	private List<Double[]> path;
	private List<Double[]> full_path;

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

	public List<Double[]> getFull_path() {
		return full_path;
	}

	public void setFull_path(List<Double[]> full_path) {
		this.full_path = full_path;
	}
}