package com.quaso.mazda;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;

import com.quaso.mazda.util.RouteCacheFileUtils;
import com.quaso.mazda.util.ZipUtils;

@SpringBootApplication
public class MazdaRoutesManagerApplication {

	@Bean
	@Scope(value = "session", proxyMode = ScopedProxyMode.TARGET_CLASS)
	public RoutesRepository routesRepository() {
		return new RoutesRepository();
	}

	@Bean
	public RouteCacheFileUtils routeCacheFileUtils() {
		return new RouteCacheFileUtils();
	}
	
	@Bean
	public ZipUtils zipUtils(){
		return new ZipUtils();
	}
}
