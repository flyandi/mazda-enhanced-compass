package com.quaso.mazda.json;

import java.util.List;

public class Direction {
	private int distance;
	private List<Double[]> path;
	private int turnType;
	private String text;
	private Integer exit_number;
	
	Direction() {
	}

	public int getDistance() {
		return distance;
	}

	public void setDistance(int distance) {
		this.distance = distance;
	}

	public List<Double[]> getPath() {
		return path;
	}

	public void setPath(List<Double[]> path) {
		this.path = path;
	}

	public int getTurnType() {
		return turnType;
	}

	public void setTurnType(int turnType) {
		this.turnType = turnType;
	}

	public String getText() {
		return text;
	}

	public void setText(String text) {
		this.text = text;
	}

	public int getExit_number() {
		return exit_number;
	}

	public void setExit_number(int exit_number) {
		this.exit_number = exit_number;
	}

}
