package com.quaso.mazda.util;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

public class ZipUtils {
	private static final Logger log = LoggerFactory.getLogger(ZipUtils.class);

	private static final String ROUTES_CACHE_FILE_JS = "routesCacheFile.js";

	public byte[] doUnzip(byte[] data) throws IOException {
		ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(data));
		ByteArrayOutputStream result = null;
		try {
			ZipEntry ze = null;
			while ((ze = zis.getNextEntry()) != null) {
				if (ROUTES_CACHE_FILE_JS.equals(ze.getName())) {
					if (result == null) {
						log.debug("Find {} file in the zip", ROUTES_CACHE_FILE_JS);
						result = new ByteArrayOutputStream();
						IOUtils.copy(zis, result);
					} else {
						log.warn("There are several {} files in the zip. All, but first are skipped");
					}
				}
			}
			if (result == null) {
				log.error("File {} was not found in zip", ROUTES_CACHE_FILE_JS);
			}
			return (result != null) ? result.toByteArray() : null;
		} finally {
			zis.close();
		}

	}

	public byte[] doZip(byte[] data) throws IOException {
		ByteArrayOutputStream result = new ByteArrayOutputStream();
		ZipOutputStream zos = new ZipOutputStream(result);
		try {
			zos.putNextEntry(new ZipEntry(ROUTES_CACHE_FILE_JS));
			try {
				IOUtils.copy(new ByteArrayInputStream(data), zos);
			} finally {
				zos.closeEntry();
			}
		} finally {
			zos.close();
		}
		return result.toByteArray();
	}
}
