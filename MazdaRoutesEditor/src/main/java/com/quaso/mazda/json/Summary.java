package com.quaso.mazda.json;

import java.io.Serializable;

@SuppressWarnings("serial")
public class Summary implements Serializable {
	private int distance;
	private double duration;

	Summary() {
	}

	public Summary(int distance, double duration) {
		this.distance = distance;
		this.duration = duration;
	}

	public int getDistance() {
		return distance;
	}

	public void setDistance(int distance) {
		this.distance = distance;
	}

	public double getDuration() {
		return duration;
	}

	public void setDuration(double duration) {
		this.duration = duration;
	}

}
