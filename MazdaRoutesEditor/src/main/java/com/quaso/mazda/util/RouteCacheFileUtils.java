package com.quaso.mazda.util;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStreamReader;
import java.io.PrintStream;
import java.io.Reader;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.springframework.stereotype.Component;

import com.google.gson.Gson;
import com.quaso.mazda.json.Route;

@Component
public class RouteCacheFileUtils {
	private static final String VARIABLE_DEF = "var CACHED_ROUTES = ";

	public List<Route> parseRoutes(byte[] data) {
		ByteArrayInputStream bais = new ByteArrayInputStream(data);
		Reader reader = new InputStreamReader(bais);

		bais.skip(VARIABLE_DEF.length());
		Gson gson = new Gson();
		Route[] temp = gson.fromJson(reader, Route[].class);
		List<Route> result = new ArrayList<>();
		for (Route route : temp) {
			if (route != null) {
				result.add(route);
			}
		}
		return result;
	}

	public byte[] createFileContent(Collection<Route> routes) {
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		PrintStream ps = new PrintStream(baos);
		ps.print(VARIABLE_DEF);
		ps.println("[");
		Gson gson = new Gson();
		for (Route route : routes) {
			ps.print(gson.toJson(route));
			ps.println(",");
		}
		ps.print("]");
		return baos.toByteArray();
	}
}
