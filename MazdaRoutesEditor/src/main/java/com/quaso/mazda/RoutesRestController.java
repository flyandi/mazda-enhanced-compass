package com.quaso.mazda;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.exception.ExceptionUtils;
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
import com.google.apphosting.api.ApiProxy.CallNotFoundException;
import com.quaso.mazda.json.EmailData;
import com.quaso.mazda.json.Route;
import com.quaso.mazda.json.RouteWithUuid;
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

	@CrossOrigin(origins="*")
	@RequestMapping(value = "/importRoute", method = RequestMethod.POST, consumes = MediaType.APPLICATION_JSON_VALUE)
	@ResponseStatus(HttpStatus.OK)
	public String importRoute(@RequestBody RouteWithUuid routeUuid) {
		this.routeRepository.addRoute(routeUuid.getUuid(), routeUuid.getRoute());
		return "{}";
	}

	@CrossOrigin(origins="*")
	@RequestMapping(value = "/sendEmail", method = RequestMethod.POST, consumes = MediaType.APPLICATION_JSON_VALUE)
	@ResponseStatus(HttpStatus.OK)
	public String sendEmail(@RequestBody EmailData emailData) throws IOException {
		return sendEmail(emailData.getEmail(), emailData.getEmail(), emailData.getUuid());
	}

	@CrossOrigin(origins="*")
	@RequestMapping(value = "/sendEmailFromTo")
	@ResponseStatus(HttpStatus.OK)
	public String sendEmail(String fromAddress, String toAddress, String uuid) throws IOException {
		SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm");
		Message message = new Message(fromAddress, toAddress,
				"Your mazda	routes exported at " + sdf.format(new Date()),
				"These are your exported cached routes from Mazda");
		byte[] data = createZip(uuid);
		Attachment attachment = new Attachment("routes.zip", data);
		message.setAttachments(attachment);
		try {
			mailService.send(message);
			log.info("Routes sent to \"{}\"", toAddress);
		} catch (CallNotFoundException ex) {
			log.error("Cannot send email: {}", ExceptionUtils.getRootCauseMessage(ex));
			File file = new File("routes_" + toAddress + "_" + System.currentTimeMillis() + ".zip");
			FileUtils.writeByteArrayToFile(file, data);
			log.info("Routes save to file: {}", file.getAbsolutePath());
		} finally {
			routeRepository.clearRoutes(uuid);
		}
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

	@RequestMapping(value = "/saveAsZip/filename/{uuid}/{filename}", method = RequestMethod.GET, produces = "application/zip")
	public ResponseEntity<InputStreamResource> saveAsZip(@PathVariable String uuid, @PathVariable String filename)
			throws IOException {
		HttpHeaders headers = new HttpHeaders();
		headers.add("Cache-Control", "no-cache, no-store, must-revalidate");
		headers.add("Pragma", "no-cache");
		headers.add("Expires", "0");
		headers.add("Content-Disposition", "attachment; filename=" + filename + ".zip");
		headers.add("Set-Cookie", "fileDownload=true; path=/");

		byte[] data = createZip(uuid);
		routeRepository.clearRoutes(uuid);
		return ResponseEntity.ok().headers(headers).contentLength(data.length)
				.contentType(MediaType.parseMediaType("application/zip"))
				.body(new InputStreamResource(new ByteArrayInputStream(data)));
	}

	private byte[] createZip(String uuid) throws IOException {
		return zipUtils.doZip(routeCacheFileUtils.createFileContent(routeRepository.getAllRoutes(uuid)));
	}
}
