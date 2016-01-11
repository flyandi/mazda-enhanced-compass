package com.quaso.mazda;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.quaso.mazda.json.Route;

public class RoutesRepository {
	private static final Logger log = LoggerFactory.getLogger(RoutesRestController.class);
	
	private List<Route> routes = Collections.synchronizedList(new ArrayList<>());
	
	public void addRoute(Route route){
		log.info("Obtained route from {},{} to {},{}", route.getStart().getLat(), route.getStart().getLng(), route.getDest().getLat(), route.getDest().getLng());
		this.routes.add(route);
	}
	
	public void addRoutes(Collection<Route> routes){
		this.routes.addAll(routes);
	}
	
	public List<Route> getAllRoutes(){
		return (List<Route>) Collections.unmodifiableCollection(this.routes);
	}
	
	
}
