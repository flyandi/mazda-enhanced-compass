package com.quaso.mazda;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.google.gson.Gson;
import com.quaso.mazda.json.RouteData;

@RestController
public class RoutesController {
	private static final Logger log = LoggerFactory.getLogger(RoutesController.class); 

	@RequestMapping(value = "/import")
	@ResponseStatus(HttpStatus.OK)
	public String importRoute(String data) {
		RouteData route = new Gson().fromJson(data, RouteData.class);
		log.info("Obtained route from {},{} to {},{}", route.getStart().getLat(), route.getStart().getLng(), route.getDest().getLat(), route.getDest().getLng());
		
		
		return String.valueOf(route.getDest().getLng());
	}
}
