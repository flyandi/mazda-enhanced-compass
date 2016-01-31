package com.quaso.mazda;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import org.apache.commons.io.FilenameUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.google.appengine.api.mail.MailService;
import com.google.appengine.api.mail.MailService.Attachment;
import com.google.appengine.api.mail.MailService.Message;
import com.google.gson.Gson;
import com.quaso.mazda.json.Route;
import com.quaso.mazda.util.RouteCacheFileUtils;
import com.quaso.mazda.util.ZipUtils;

@RestController
public class RoutesRestController {
	private static final Logger log = LoggerFactory.getLogger(RoutesRestController.class);

	@Autowired
	private RoutesRepository routeRepository;

	@Autowired
	private ZipUtils zipUtils;

	@Autowired
	private RouteCacheFileUtils routeCacheFileUtils;

	@Autowired
	private MailService mailService;

	@RequestMapping(value = "/importOne")
	@ResponseStatus(HttpStatus.OK)
	public void importRoute(String data) {
		this.routeRepository.addRoute(new Gson().fromJson(data, Route.class));
	}

	@RequestMapping(value = "/sendEmail")
	@ResponseStatus(HttpStatus.OK)
	public void sendEmail(String address) throws IOException {
		sendEmail(address, address);
	}

	@RequestMapping(value = "/sendEmailFromTo")
	@ResponseStatus(HttpStatus.OK)
	public void sendEmail(String fromAddress, String toAddress) throws IOException {
		SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm");
		Message message = new Message(fromAddress, toAddress,
				"Your mazda routes exported at " + sdf.format(new Date()),
				"These are your exported cached routes from Mazda");
		byte[] zipData = zipUtils.doZip(routeCacheFileUtils.createFileContent(routeRepository.getAllRoutes()));
		Attachment attachment = new Attachment("routes.zip", zipData);
		message.setAttachments(attachment);

		mailService.send(message);
		log.info("Routes sent to \"{}\"", toAddress);
	}

	@RequestMapping(value = "/uploadFile", method = RequestMethod.POST)
	public @ResponseBody Collection<Route> handleFileUpload(@RequestParam("file") MultipartFile file) {
		Collection<Route> result = Collections.emptyList();
		if (!file.isEmpty()) {
			log.info("{} uploaded", file.getOriginalFilename());
			try {
				String extension = FilenameUtils.getExtension(file.getOriginalFilename());
				byte[] data = null;
				if ("zip".equals(extension)) {
					data = zipUtils.doUnzip(file.getBytes());
				} else if ("js".equals(extension)) {
					data = file.getBytes();
				}

				if (data == null) {
					throw new IllegalArgumentException("Unrecognized file extension");
				}

				List<Route> routes = routeCacheFileUtils.parseRoutes(data);
				log.info("Found {} routes", routes.size());
				result = routes;
			} catch (Exception e) {
				log.error("Unexpected error occured while uploading a file", e);
			}
		}
		return result;
	}
}
