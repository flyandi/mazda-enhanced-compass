package com.quaso.mazda;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;

import com.google.appengine.api.mail.MailService;
import com.google.appengine.api.mail.MailServiceFactory;
import com.quaso.mazda.util.RouteCacheFileUtils;
import com.quaso.mazda.util.ZipUtils;

@SpringBootApplication
public class MazdaRoutesManagerApplication {

	public static void main(String[] args) {
		SpringApplication.run(MazdaRoutesManagerApplication.class, args);
	}

	//TODO uncomment for Google App Engine???
	// @Bean(name = DispatcherServlet.MULTIPART_RESOLVER_BEAN_NAME)
	// public MultipartResolver
	// multipartResolver(@Value("${multipart.maxFileSize:1048576}") int
	// maxUploadSize) {
	// GMultipartResolver multipartResolver = new GMultipartResolver();
	// multipartResolver.setMaxUploadSize(maxUploadSize);
	// return multipartResolver;
	// }

	@Bean
	@Scope(value = "session", proxyMode = ScopedProxyMode.TARGET_CLASS)
	public RoutesRepository routesRepository() {
		return new RoutesRepository();
	}

	@Bean
	public MailService mailService() {
		return MailServiceFactory.getMailService();
	}

	@Bean
	public RouteCacheFileUtils routeCacheFileUtils() {
		return new RouteCacheFileUtils();
	}

	@Bean
	public ZipUtils zipUtils() {
		return new ZipUtils();
	}
}
