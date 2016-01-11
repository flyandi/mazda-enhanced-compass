package com.quaso.mazda;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
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

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.google.gson.Gson;
import com.quaso.mazda.json.Route;
import com.quaso.mazda.util.RouteCacheFileUtils;
import com.quaso.mazda.util.ZipUtils;

@RestController
public class RoutesRestController {
	@Autowired
	private RoutesRepository routeRepository;

	@Autowired
	private ZipUtils zipUtils;

	@Autowired
	private RouteCacheFileUtils routeCacheFileUtils;

	@RequestMapping(value = "/import")
	@ResponseStatus(HttpStatus.OK)
	public void importRoute(String data) {
		this.routeRepository.addRoute(new Gson().fromJson(data, Route.class));
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
}
