package com.quaso.mazda;

import java.io.Serializable;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.quaso.mazda.json.Route;

public class RoutesRepository implements Serializable{
	private static final Logger log = LoggerFactory.getLogger(RoutesRestController.class);

	private Set<Route> routes = new HashSet<>();

	public void addRoute(Route route) {
		log.info("Obtained {}", route);
		this.routes.add(route);
	}

	public Collection<Route> getAllRoutes() {
		return Collections.unmodifiableCollection(this.routes);
	}

	
}
