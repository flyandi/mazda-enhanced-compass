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

Download the latest release here: [TBD]



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


Once this is completed, you can reboot the system or turn on and off your car. Once loaded you can go to the Navigation menu item and you will see a screen which asks for an "SD Card", e.g.

![Screen2](https://github.com/flyandi/mazda-enhanced-compass/blob/master/docs/images/sdcard.jpg)

Make sure that you have removed any original sd cards since they aren't compatible. If you leave them in, you won't see the Enhanced Compass Application.



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

