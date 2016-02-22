package com.quaso.mazda;

import javax.sql.DataSource;

import org.gmr.web.multipart.GMultipartResolver;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;
import org.springframework.web.multipart.MultipartResolver;
import org.springframework.web.servlet.DispatcherServlet;

import com.google.appengine.api.mail.MailService;
import com.google.appengine.api.mail.MailServiceFactory;
import com.quaso.mazda.util.RouteCacheFileUtils;
import com.quaso.mazda.util.ZipUtils;

@SpringBootApplication
public class MazdaRoutesManagerApplication {

	public static void main(String[] args) {
		SpringApplication.run(MazdaRoutesManagerApplication.class, args);
	}

	@Bean
//	@Scope(value = "session", proxyMode = ScopedProxyMode.TARGET_CLASS)
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

	@Profile("!boot")
	@Configuration
	private static class GaeConfig {

		@SuppressWarnings("unused")
		public GaeConfig() {

		}

		@Bean(name = DispatcherServlet.MULTIPART_RESOLVER_BEAN_NAME)
		public MultipartResolver multipartResolver(@Value("${multipart.maxFileSize:1048576}") int maxUploadSize) {
			GMultipartResolver multipartResolver = new GMultipartResolver();
			multipartResolver.setMaxUploadSize(maxUploadSize);
			return multipartResolver;
		}

		@Bean
		public DataSource dataSource() {
			return new EmbeddedDatabaseBuilder().setType(EmbeddedDatabaseType.HSQL).build();
		}
	}
}
