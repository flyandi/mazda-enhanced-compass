package com.quaso.mazda;

import java.io.ByteArrayInputStream;
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
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.google.appengine.api.mail.MailService;
import com.google.appengine.api.mail.MailService.Attachment;
import com.google.appengine.api.mail.MailService.Message;
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

	@CrossOrigin
	@RequestMapping(value = "/importRoute", method = RequestMethod.POST, consumes = MediaType.APPLICATION_JSON_VALUE)
	@ResponseStatus(HttpStatus.OK)
	public String importRoute(@RequestBody Route route) {
		this.routeRepository.addRoute(route);
		return "{}";
	}

	@CrossOrigin
	@RequestMapping(value = "/sendEmail")
	@ResponseStatus(HttpStatus.OK)
	public String sendEmail(String address) throws IOException {
		return sendEmail(address, address);
	}

	@RequestMapping(value = "/sendEmailFromTo")
	@ResponseStatus(HttpStatus.OK)
	public String sendEmail(String fromAddress, String toAddress) throws IOException {
		SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm");
		Message message = new Message(fromAddress, toAddress,
				"Your mazda		 routes exported at " + sdf.format(new Date()),
				"These are your exported cached routes from Mazda");
		Attachment attachment = new Attachment("routes.zip", createZip());
		message.setAttachments(attachment);
		mailService.send(message);
		log.info("Routes sent to \"{}\"", toAddress);
		return "{}";
	}

	@RequestMapping(value = "/uploadFile", method = RequestMethod.POST)
	@ResponseStatus(value = HttpStatus.OK)
	public Collection<Route> handleFileUpload(@RequestParam("file") MultipartFile file) {
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

	@RequestMapping(value = "/saveAsZip/filename/{filename}", method = RequestMethod.GET, produces = "application/zip")
	public ResponseEntity<InputStreamResource> saveAsZip(@PathVariable String filename) throws IOException {
		HttpHeaders headers = new HttpHeaders();
		headers.add("Cache-Control", "no-cache, no-store, must-revalidate");
		headers.add("Pragma", "no-cache");
		headers.add("Expires", "0");
		headers.add("Content-Dispositionn", "attachment; filename=" + filename + ".zip");
		headers.add("Set-Cookie", "fileDownload=true; path=/");

		byte[] data = createZip();
		routeRepository.clearRoutes();
		return ResponseEntity.ok().headers(headers).contentLength(data.length)
				.contentType(MediaType.parseMediaType("application/zip"))
				.body(new InputStreamResource(new ByteArrayInputStream(data)));
	}

	private byte[] createZip() throws IOException {
		return zipUtils.doZip(routeCacheFileUtils.createFileContent(routeRepository.getAllRoutes()));
	}
}
