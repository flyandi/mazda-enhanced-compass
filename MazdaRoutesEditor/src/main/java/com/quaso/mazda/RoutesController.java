package com.quaso.mazda;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.google.gson.Gson;
import com.quaso.mazda.json.RouteData;

@RestController
public class RoutesController {

	@RequestMapping(value = "/import")
	public String importRoute(String data) {
		RouteData route = new Gson().fromJson(data, RouteData.class);
		System.out.println(route.getDest().getLat());
		return String.valueOf(route.getDest().getLng());
	}
}
