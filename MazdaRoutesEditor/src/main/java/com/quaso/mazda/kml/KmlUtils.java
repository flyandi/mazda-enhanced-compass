package com.quaso.mazda.kml;

import java.io.File;
import java.io.IOException;
import java.util.HashSet;
import java.util.Scanner;
import java.util.Set;

import org.apache.commons.io.FileUtils;

import com.google.gson.Gson;

import de.micromata.opengis.kml.v_2_2_0.Coordinate;
import de.micromata.opengis.kml.v_2_2_0.Document;
import de.micromata.opengis.kml.v_2_2_0.Feature;
import de.micromata.opengis.kml.v_2_2_0.Folder;
import de.micromata.opengis.kml.v_2_2_0.Kml;
import de.micromata.opengis.kml.v_2_2_0.Placemark;
import de.micromata.opengis.kml.v_2_2_0.Point;

public class KmlUtils {

	public static void main(String[] args) throws IOException {
		loadKml(new File(args[0]), new File("alerts.js"));
	}

	public static void loadKml(File inputFile, File outputFile) throws IOException {
		Kml kml = Kml.unmarshal(inputFile);
		ProcessedData data = new ProcessedData();

		if (kml.getFeature() instanceof Document) {
			Document doc = (Document) kml.getFeature();
			for (Feature f : doc.getFeature()) {
				if (f instanceof Folder) {
					data.merge(processFolder((Folder) f));
				}
			}
		} else if (kml.getFeature() instanceof Folder) {
			data.merge(processFolder((Folder) kml.getFeature()));
		}

		String[] categories = data.getData().keySet().toArray(new String[0]);
		for (int i = 0; i < categories.length; i++) {
			System.out.println("[" + i + "] -> " + categories[i]);
		}
		System.out.println("Enter space separates numbers of categories you want to include:");
		@SuppressWarnings("resource")
		String[] catIds = new Scanner(System.in).nextLine().split(" ");

		Set<AlertData> result = new HashSet<>();
		for (String idStr : catIds) {
			result.addAll(data.getData().get(categories[Integer.parseInt(idStr)]));
		}

		FileUtils.write(outputFile, "var ALERTS = " + new Gson().toJson(result));
	}

	private static ProcessedData processFolder(Folder folder) {
		ProcessedData result = new ProcessedData();

		for (Feature feature : folder.getFeature()) {
			if (feature instanceof Placemark) {
				Placemark placemark = (Placemark) feature;
				if (placemark.getGeometry() instanceof Point) {
					Coordinate coord = ((Point) placemark.getGeometry()).getCoordinates().get(0);
					AlertData data = new AlertData();
					data.setLat(coord.getLatitude());
					data.setLng(coord.getLongitude());
					result.add(placemark.getName().trim().toLowerCase(), data);
				}
			}
		}

		return result;
	}

}
