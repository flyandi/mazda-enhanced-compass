package com.quaso.mazda.json;

import java.io.Serializable;
import java.util.List;

@SuppressWarnings("serial")
public class Direction implements Serializable {
	private int distance;
	private List<Double[]> path;
	private int turnType;
	private String text;
	@SuppressWarnings("unused")
	private Integer exit_number;

	Direction() {
	}

	public Direction(int distance, List<Double[]> path, int turnType, String text, Integer exit_number) {
		this.distance = distance;
		this.path = path;
		this.turnType = turnType;
		this.text = text;
		this.exit_number = exit_number;
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

	public void setExit_number(int exit_number) {
		this.exit_number = exit_number;
	}

}
