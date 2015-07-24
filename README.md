Enhanced Compass for Mazda Connect
=============

The Enhanced Compass Application for Mazda Connect is an replacement for the Compass application. It features the original information like Compass Rose, Latitude, Longitude and Altitude plus a moving map that can be extended with POI, potential traffic and simple routing.

The idea behind this project is to offer an alternative to the optional Navigation Software. Most of the time it is enough to have a moving map to successfully navigate to a destination or find a place.

![Screen1](https://github.com/flyandi/mazda-enhanced-compass/blob/master/docs/images/eca-1.jpg)

Note: Screen includes a prototype of the POI database which will be part of the next release.


[![Video](https://github.com/flyandi/mazda-enhanced-compass/blob/master/docs/images/video_eca_gif.gif)](https://www.youtube.com/watch?v=RpYIg0FFnLI)

Full video at 
https://www.youtube.com/watch?v=RpYIg0FFnLI


## Getting Started

Before we start, please read the warning below. 

**WARNING: The installation of this application requires modifications to your Mazda Connect system.
If you don't feel comfortable performing these changes, please do not attempt to install this. You might
be ending up with an unusuable system that requires reset by your Dealer. You were warned!**

**Go slow and read the instructions first before you starting to mess around.**

I carefully crafted these instructions to the best of my knowledge but I don't take any responsibility if your Infotainment system becomes unusable because of corrupted system files, boot loops or other severe functionality issues.

These instructions have been tested with *Mazda Connect Version 51.0*



### Prerequisites

You should be familar with the process of connecting to your Mazda Connect System via ssh. If not, please go to http://www.mazda3hacks.com/doku.php or the Infotainment thread at http://mazda3revolution.com/forums/2014-mazda-3-skyactiv-audio-electronics/57714-infotainment-project.html to understand this process.

Here is the good news, you only have to do this one time and everytime you upgrade to a new system software version. The Enhanced Compass App is updated through the SD Card once these modifications are completed.



### Get the latest release

Download and unzip the latest release. The release package includes the following folder structure:


```jci/``` : Contains the bootloader

```jcipatch/``` : Contains the patches for the existing Navigation application

```sdcard/``` :	Contains the skeleton of the application including the application

Download the latest release here: https://github.com/flyandi/mazda-enhanced-compass/releases 

Direct download https://github.com/flyandi/mazda-enhanced-compass/releases/download/v0.0.3-beta/mazda-enhanced-compass-0.0.3.zip


### Prepare the Mazda Connect Infotainment System

**DO NOT, I REPEAT DO NOT(!), USE THE TOUCHSCREEN OR COMMAND WHEEL DURING THE MODIFICATION OF THESE FILES**

**Note: All changes can be done while the system is running**


Make sure you are connected to the Infotainment system via ssh and unlocked the hard drive for writing.



#### Compass Replacement (Bootloader)

If not done yet, backup the existing ```emnavi``` application by executing the following commands in the ssh shell:

```shell
cd /jci/gui/apps
cp -r emnavi emnavi.bak
```

Upload the entire ```jci/``` folder of the release package to the folder ```/tmp``` on your Infotainment system.


Replace the folder ```/jci/gui/apps/emnavi/controls/Compass``` with the folder ```jci/controls/Compass``` from the release package.

Replace the folder ```/jci/gui/apps/emnavi/templates/Compass``` with the folder ```jci/templates/Compass``` from the release package.


#### Patch emnaviApp.js 

Next we need to do some modifications to ```/jci/gui/apps/emnavi/js/emnaviApp.js```.

Open this file in vim, e.g. ```vi /jci/gui/apps/emnavi/js/emnaviApp.js```.

Open the file ```jcipatch/emnaviApp.patch.js``` on your local computer.


**WARNING: Basic JavaScript knowledge is required from this point***

Find the method ```emnaviApp.prototype._populateCompass``` in the first opened file and replace it entirely with the function found with the same name in the second file. 

Repeat this for the method ```emnaviApp.prototype._CurrentLocationInfoMsgHandler```.

```emnaviApp.prototype._populateCompass``` is found at line #637 (Version 51.x).
```emnaviApp.prototype._CurrentLocationInfoMsgHandler``` is found at line #580 (Version 51.x).


#### Prepare Symlinks

The final step is to connect the Compass application to it's resources on the SD Card (which will we setup in the next step). 

Execute the following command on the Infotainment system which will create the required symlink:

```shell
ln -s /tmp/mnt/sd_nav /jci/gui/apps/emnavi/controls/Compass/resources
```

#### Test the installation

Once this is completed, you can reboot the system or turn off and on your car. Once loaded you can go to the Navigation menu item and you will see a screen which asks for an "SD Card", e.g.

![Screen2](https://github.com/flyandi/mazda-enhanced-compass/blob/master/docs/images/sdcard.jpg)

Make sure that you have removed the original sd card since they aren't compatible. If you leave them in, you won't see the Enhanced Compass Application.


### Setting up the SD Card

The Enhanced Compass App requires it's own SD Card in a certain format. The SD Card contains the actual application, tiles and extensions, like the POI database.

#### Prepare the SD Card

I recommend to use a 16GB or 32GB Class 10 SD Card. Make sure the SD Card is formatted for FAT32 (most of them are). 

#### Copy the files

If you are creating a new SD Card, copy the entire contents of the folder ```sdcard/``` from the release package onto your SD Card. 

If you are upading to a new release, copy the folder ```sdcard/system/``` from the release package and replace it with the one found on your SD Card.


#### Installing Tiles

The final step is to actual install the tiles. The base release just comes with the outline of the world. In order to have a full working map you need to download the tiles or render them yourselve.

Tiles need to be copy and paste to ```tiles/``` on your SD Card. Make sure to extend or replace existing files since the tiles are sharing all the same folder naming.

A couple community members have offered to pre-render tiles for different regions. As of writing this wait a couple days before these tiles come available.

Instructions how to render the tiles can be found here: https://github.com/flyandi/mazda-enhanced-compass-map

See available tiles below to download certain sections.


#### POI

POI's are under development and not ready for production yet.


### Final Word

This is a very active project and changes are made daily. All releases are marked as pre-releases. A stable release should be available in a couple weeks.


## Available Tiles

### Base Packs

Download the base pack first to get an overview of the entire world.

Zone	 					|	Levels	|	Size	|	Download Link
---							| 	---		|	---		| 	---
World 						|	0-6		|	7MB 	| 	https://drive.google.com/open?id=0B-GwhRSdJBq8UzVFdlQ0XzhrMzA
World + North America 		| 	0-10	|	104MB 	|	https://drive.google.com/open?id=0B-GwhRSdJBq8NzFGU0dEUzdyZTA


### Tile Packs

Tile packs include detailed map information. Use these along with the base pack.

Zone	 		|	Region		|	Sub Region 			|	Size	|	Download Link
---				|	---			| 	---					|	---		|	---
North America	|	US			|	Southern California |	1.9GB 	|	https://mega.nz/#!6hNzBJSR!7oUsURTjZKvrwMhiKQb7Wy_PLB4a-PTZXdhIDSk0AaQ
North America 	|	US 			| 	District of Columbia| 	35MB  	| 	https://drive.google.com/open?id=0B-GwhRSdJBq8b0JKSzFEZnljdkk


## License

Written by Andreas Schwarz (http://github.com/flyandi/mazda-enhanced-compass)
Copyright (c) 2015. All rights reserved.
 
WARNING: The installation of this application requires modifications to your Mazda Connect system.
If you don't feel comfortable performing these changes, please do not attempt to install this. You might
be ending up with an unusuable system that requires reset by your Dealer. You were warned!

This program is free software: you can redistribute it and/or modify it under the terms of the 
GNU General Public License as published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even 
the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
License for more details.
 
You should have received a copy of the GNU General Public License along with this program. 
If not, see http://www.gnu.org/licenses/

