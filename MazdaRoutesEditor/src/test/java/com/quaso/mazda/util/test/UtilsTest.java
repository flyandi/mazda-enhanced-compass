package com.quaso.mazda.util.test;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.lang3.builder.EqualsBuilder;
import org.junit.Test;

import com.quaso.mazda.json.Direction;
import com.quaso.mazda.json.LatLng;
import com.quaso.mazda.json.Route;
import com.quaso.mazda.json.RouteData;
import com.quaso.mazda.json.Summary;
import com.quaso.mazda.util.RouteCacheFileUtils;
import com.quaso.mazda.util.ZipUtils;

public class UtilsTest {

	@Test
	public void testJson() {
		List<Route> routes = new ArrayList<>();
		routes.add(createRoute());
		routes.add(createRoute());
		routes.add(createRoute());
		byte[] data = new RouteCacheFileUtils().createFileContent(routes);

		List<Route> routes2 = new RouteCacheFileUtils().parseRoutes(data);
		EqualsBuilder.reflectionEquals(routes, routes2);
	}

	@Test
	public void testZip() throws IOException {
		List<Route> routes = new ArrayList<>();
		routes.add(createRoute());
		routes.add(createRoute());
		routes.add(createRoute());
		byte[] data = new RouteCacheFileUtils().createFileContent(routes);
		byte[] zipData = new ZipUtils().doZip(data);

		List<Route> routes2 = new RouteCacheFileUtils().parseRoutes(new ZipUtils().doUnzip(zipData));
		EqualsBuilder.reflectionEquals(routes, routes2);
	}

	private Route createRoute() {
		Route result = new Route();

		result.setStart(new LatLng(Math.random(), Math.random()));
		result.setDest(new LatLng(Math.random(), Math.random()));

		List<Direction> directions = new ArrayList<>();
		Summary summary = new Summary(createRandomInt(100), Math.random());

		for (int i = 0; i < createRandomInt(10); i++) {
			Integer exitNo = createRandomInt(3);
			if (exitNo == 0) {
				exitNo = null;
			}
			directions.add(new Direction(createRandomInt(100), createRandomPathDoubles(), createRandomInt(10) - 5,
					String.valueOf(Math.random()), exitNo));
		}

		RouteData data = new RouteData(directions, summary, createRandomPathDoubles());
		result.setData(data);

		return result;
	}

	private int createRandomInt(int max) {
		return (int) (max * Math.random());
	}

	private List<Double[]> createRandomPathDoubles() {
		List<Double[]> path = new ArrayList<>();
		for (int i = 0; i < createRandomInt(20); i++) {
			path.add(new Double[] { Math.random(), Math.random() });
		}
		return path;
	}

}
