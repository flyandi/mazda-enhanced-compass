package com.quaso.mazda;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
import java.util.Properties;

import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Multipart;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.FilenameUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.quaso.mazda.json.Route;
import com.quaso.mazda.util.RouteCacheFileUtils;
import com.quaso.mazda.util.ZipUtils;

@RestController
public class RoutesRestController implements InitializingBean {
	private static final Logger log = LoggerFactory.getLogger(RoutesRestController.class);

	@Autowired
	private RoutesRepository routeRepository;

	@Autowired
	private ZipUtils zipUtils;

	@Autowired
	private RouteCacheFileUtils routeCacheFileUtils;

	@Autowired
	private ObjectMapper objectMapper;

	@RequestMapping(value = "/importOne")
	@ResponseStatus(HttpStatus.OK)
	public void importRoute(String data) {
		this.routeRepository.addRoute(new Gson().fromJson(data, Route.class));
	}

	@RequestMapping(value = "/uploadFile", method = RequestMethod.POST)
	public @ResponseBody Collection<Route> handleFileUpload(MultipartHttpServletRequest request,
			HttpServletResponse response) throws IOException {
		Iterator<String> itr = request.getFileNames();

		MultipartFile mpf = request.getFile(itr.next());
		log.info("{} uploaded", mpf.getOriginalFilename());

		String extension = FilenameUtils.getExtension(mpf.getOriginalFilename());
		byte[] data = null;
		if ("zip".equals(extension)) {
			data = zipUtils.doUnzip(mpf.getBytes());
		} else if ("js".equals(extension)) {
			data = mpf.getBytes();
		}

		if (data == null) {
			throw new IllegalArgumentException("Unrecognized file extension");
		}

		List<Route> routes = routeCacheFileUtils.parseRoutes(data);
		log.info("Found {} routes", routes.size());
		routeRepository.addRoutes(routes);

		return routeRepository.getAllRoutes();
	}

	@RequestMapping(value = "/sendEmail")
	@ResponseStatus(HttpStatus.OK)
	public void sendEmail(@RequestParam String email) throws IOException, MessagingException {
		Properties props = new Properties();
		Session session = Session.getDefaultInstance(props, null);

		Message msg = new MimeMessage(session);
		msg.setFrom(new InternetAddress("admin@mazdaRoutesmanager.com", "Example.com Admin"));
		msg.addRecipient(Message.RecipientType.TO, new InternetAddress(email, "Mr. User"));
		msg.setSubject("These are your exported cached routes from Mazda");

		Multipart mp = new MimeMultipart();

		MimeBodyPart textPart = new MimeBodyPart();
		textPart.setContent("Please find attached zip file", "text");
		mp.addBodyPart(textPart);

		MimeBodyPart attachment = new MimeBodyPart();
		byte[] zipData = zipUtils.doZip(routeCacheFileUtils.createFileContent(routeRepository.getAllRoutes()));
		InputStream attachmentDataStream = new ByteArrayInputStream(zipData);
		attachment.setFileName("routes.zip");
		attachment.setContent(attachmentDataStream, "application/zip");
		mp.addBodyPart(attachment);

		msg.setContent(mp);

		Transport.send(msg);

	}

	@Override
	public void afterPropertiesSet() throws Exception {
		objectMapper.setSerializationInclusion(Include.NON_NULL);
	}
}
