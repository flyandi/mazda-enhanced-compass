package com.quaso.mazda;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.quaso.mazda.json.Route;

@SuppressWarnings("serial")
public class RoutesRepository implements Serializable {
	private static final Logger log = LoggerFactory.getLogger(RoutesRestController.class);

	private final Cache<String, List<Route>> routes = CacheBuilder.newBuilder().expireAfterWrite(30, TimeUnit.MINUTES)
			.build();

	public void addRoute(String uuid, Route route) {
		log.info("Obtained {}", route);
		try {
			final List<Route> myRoutes = routes.get(uuid, CreateEmptyList.INSTANCE);
			myRoutes.add(route);
			this.routes.put(uuid, myRoutes);
		} catch (ExecutionException e) {
			log.error(e.getMessage(), e);
		}
	}

	public Collection<Route> getAllRoutes(String uuid) {
		try {
			final List<Route> myRoutes = routes.get(uuid, CreateEmptyList.INSTANCE);
			log.info("Returning list with {} routes", myRoutes.size());
			return Collections.unmodifiableCollection(myRoutes);
		} catch (ExecutionException e) {
			throw new RuntimeException(e);
		}		
	}

	public void clearRoutes(String uuid) {
		this.routes.invalidate(uuid);
		this.routes.cleanUp();
	}

	private static class CreateEmptyList implements Callable<List<Route>> {

		private static final CreateEmptyList INSTANCE = new CreateEmptyList();

		@Override
		public List<Route> call() throws Exception {
			return new ArrayList<>();
		}

	}
}
