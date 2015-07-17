#!/usr/bin/php
<?php
/**
 * POI Database Builder
 * Enhanced Compass for Mazda Connect Infotainment
 * 
 * This will automatically create a POI database based on data placed in the  corresponding folders.
 *
 * Detects "csv", "gpx", "osx" and transform it to a optimized format for the Mazda Enhanced Compass Application.
 *
 * Written by Andreas Schwarz (http://github.com/flyandi/mazda-enhanced-compass)
 * Copyright (c) 2015. All rights reserved.
 * 
 * WARNING: The installation of this application requires modifications to your Mazda Connect system.
 * If you don't feel comfortable performing these changes, please do not attempt to install this. You might
 * be ending up with an unusuable system that requires reset by your Dealer. You were warned!
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the 
 * GNU General Public License as published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even 
 * the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
 * License for more details.
 * 
 * You should have received a copy of the GNU General Public License along with this program. 
 * If not, see http://www.gnu.org/licenses/
 */


# Configuration

$configuration = array(

	// Allowed POI's - specify a list of POI's that will be compiled into the
	// database. Refer to the "poi.dec" for index numbers

	"allowedPOIIndexes" => array(
		163, // Gas Stations
	),

	// Providers - specify what providers should be used. Usually no change
	// required

	"allowedProviders" => array(
		"csv",		// CSV Poi's
		"gpx",		// GPX Formatted
		"osx"		// OSM.PBF extracted
	),

	// bounding box information
	"useBBX" => true,

	// Output directory
	"outputDirectory" => "output/",

	// Zoom levels for XYZ coordinates
	"zoomLevels" => array(11, 13 ,15, 17),

	// ---
	// Other Configurations
	"tileSize" => 256, // required for some calculations

	"jsonpCommandBegin" => "__NavPOICtrl.registerPOI(",
	"jsonpCommandEnd" => ");/*epf*/",

);



# DO NOT CHANGE ANYTING BELOW HERE 


/**
 * __main
 */

class __main {

	/*:(constructor)*/
	public function __construct() {

		// initialize
		$this->configuration = (object) $GLOBALS["configuration"];

		// load desc table and quick parse
		$this->table = array();
		foreach(file("poi.dec") as $_entry) {
			$_entry = explode(",", trim($_entry));
			if(count($_entry) == 2) 
				$this->table[trim($_entry[1])] = trim($_entry[0]);
		}

		// load translation table
		$this->translate = array();
		foreach(file("poi.tns") as $_entry) {
			$_values = array();
			$_entry = explode(",", trim($_entry));
			$_name = trim(strtolower(array_shift($_entry)));

			foreach($_entry as $_value) $_values[] = strtolower(trim($_value));
			$this->translate[$_name] = $_values;
		}

		// load bbx
		if($this->configuration->useBBX) {

			$this->boundingBoxes = array();
			foreach(file("poi.bbx") as $_entry) {
				$_entry = explode(",", trim($_entry));
				if(count($_entry) == 5) {
					$_area = array_shift($_entry);
					$this->boundingBoxes[$_area] = $_entry;
				}
			}
		}

		// outputdir
		if(!is_dir($this->configuration->outputDirectory)) 
			@mkdir($this->configuration->outputDirectory, 0777, true);

	}

	/*:(run) */
	public function run() {

		foreach($this->configuration->allowedProviders as $_providerId) {

			$_provider = "provider" . ucfirst($_providerId);


			if(method_exists($this, $_provider)) {
				$this->_($_providerId, ": processing");

				foreach($this->_dirContents($_providerId) as $_id => $_file) {

					$this->_($_providerId, $_file, $this->{$_provider}($_id, $_file), "processed");

				}
				
			} else {

				$this->_($_providerId, ": not found");
			}

		}

	}

	/*:(dump) */
	private function _() {
		echo implode(" ", func_get_args()) . "\n";
	}


	/*:(_dirContents)*/
	private function _dirContents($id) {

		$r = array();

		if ($dh = opendir($id)) {
   			while (($file = readdir($dh)) !== false) 
   				if(pathinfo($id . "/" . $file, PATHINFO_EXTENSION) == $id) {
   					$r[$file] = $id . "/" . $file;
   				}

   			closedir($dh);
   		}

   		return $r;
   	}

   	/**
   	 * (processing)
   	 */

   	private function feature($ident, $data) {

   		// translate fields
   		$_values = array();

   		foreach($data as $key=>$value) {
   			$key = strtolower($key);
   			foreach($this->translate as $tkey=>$tvalues) {
   				if($key == $tkey || in_array($key, $tvalues)) {
   					$_values[$tkey] = $value;
   				}
   			}
   		}

   		// check bbx
   		$_area = false;
   		if($this->configuration->useBBX) {
   			$_area = $this->findBoundingBoxArea($_values["latitude"], $_values["longitude"]);
   			if(!$_area) return; // next
   		}


   		// get sLat, sLng for xyz
   		$sLat = number_format($_values["latitude"], $this->configuration->storagePrecision);
   		$sLng = number_format($_values["longitude"], $this->configuration->storagePrecision);

   		// process tiles
		if(isset($this->configuration->zoomLevels)) {

			foreach($this->configuration->zoomLevels as $zoom) {

				// get coordinates
				$c = (object) $this->_toXYZ($zoom, $_values["latitude"], $_values["longitude"]);

				// read existing data
				$fn = sprintf("%s%s%s/%s/%s.pson", 
					$this->configuration->outputDirectory,
					$_area ? $_area . "/" : "",
					$zoom,
					$c->x,
					$c->y
				);

				if(!is_dir(dirname($fn))) mkdir(dirname($fn), 0777, true);

				// create skeleton 
				if(!file_exists($fn)) {
					// save skeleton
					file_put_contents($fn, json_encode(array()));
				}


				// read old file
				$psonFile = json_decode(str_replace(array(
					$this->configuration->jsonpCommandBegin,
					$this->configuration->jsonpCommandEnd
				), "", file_get_contents($fn)), true);

				// check category
				if(!isset($psonFile[$ident->cat])) 
					$psonFile[$ident->cat] = array();

				// create hash
				$hash = md5($_values["name"] . $_values["latitude"]);

				// register poi
				$psonFile[$ident->cat][$hash] = array_merge($_values, array(
					"_category" => $ident->cat,
					"_name" => $ident->name
				));

				// save
				file_put_contents($fn,  
					$this->configuration->jsonpCommandBegin .
					json_encode($psonFile) .
					$this->configuration->jsonpCommandEnd
				);

			}
		}

   	}

   	private function _ident($id, $ref) {
		$_i = explode("-", $id);

		return (object) array(
			"cat" => $_i[0],
			"name" => str_replace("." . $ref, "",  $_i[1]),
		);

   	}

   	private function _toXYZ($zoom, $lat, $lng) {


   		return array(
   			"x" => floor((($lng + 180) / 360) * pow(2, $zoom)),
   			"y" => floor((1 - log(tan(deg2rad($lat)) + 1 / cos(deg2rad($lat))) / pi()) /2 * pow(2, $zoom))
   		);
   	}

   	private function _toMercator($lat, $lng) {

   		if(abs($lon) > 180 || abs($lat) > 90) return;

   		$num = $lng * 0.017453292519943295;
   		$x = 6378137.0 * $num;
   		$a = $lat * 0.017453292519943295;
   		$y = 3189068.5 * log((1.0 + sin($a)) / (1.0 - sin($a)));

   		return array($x, $y);
   	}

   	private function findBoundingBoxArea($lat, $lng) {
 
   		foreach($this->boundingBoxes as $area => $bb) {
   			
   			if($lng >= (float)$bb[0] && $lng <= (float)$bb[2] && $lat >= (float)$bb[1] && $lat <= (float)$bb[3])
   				return $area;
   		}

   		return false;
   	}


	/**
	 * (providers)
	 */

	private function providerCsv($id, $file) {

		$p = 0;

		// Splits a standard POI
		// Longitude, Latitude, City, Address (Street, City, State, Zip)
		$csv = file($file);

		// parse ident
		$ident = $this->_ident($id, "csv");

		if(($handle = fopen($file, "r")) !== false) 
			while(($data = fgetcsv($handle, 1000, ",")) !== false) {

				// prepare address data
				$_location = explode(",", @$data[3]);

				// save feature
				$this->feature($ident, array(
					"latitude" => (float) $data[1],
					"longitude" => (float) $data[0],
					"name" => ucwords(str_replace("_", " ", $ident->name)),
					"address" => @$_location[0],
					"city" => @$_location[1],
					"state" => @$_location[2],
					"zip" => @$_location[3]
				));

				// up one
				$p++;
			}

    	fclose($handle);

    	return $p;

	}

	private function providerGpx($id, $file) {

		$p = 0;

		// read as xml file
		$gpx = simplexml_load_file($file);
		$gpx->registerXPathNamespace('gpx', 'http://www.topografix.com/GPX/1/1');

		// parse ident
		$ident = $this->_ident($id, "gpx");

		// check if exists
		if(isset($gpx->wpt)) {

			foreach($gpx->wpt as $wpt) {

				$data = array_merge( 
					(array) $wpt->extensions->children('gpxx', true)->WaypointExtension->Address,
					array(
						"phone" => (string) @$wpt->extensions->children('gpxx', true)->WaypointExtension->PhoneNumber
					)
				); 

				// transform data
				$this->feature($ident, array_merge((array) $data, array(

					"latitude" => (float) $wpt["lat"],
					"longitude" => (float) $wpt["lon"],
					"name" => (string) $wpt->name
					
				), $data));


				$p++;
			}

		}


		return $p;
	}



}

$_ = new __main();
$_->run();