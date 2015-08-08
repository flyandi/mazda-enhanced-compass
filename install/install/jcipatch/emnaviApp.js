/*
 Copyright 2012 by Johnson Controls
 __________________________________________________________________________

 Filename: emnaviApp.js
 __________________________________________________________________________

 Project: JCI-IHU
 Language: EN
 Author: awoodhc
 Date: 06.27.2012
 __________________________________________________________________________

 Description: IHU GUI Embedded Navigation App

 Revisions:
 v0.1 - 27-June-2012  Navigation app created
 v0.2 - (03-September-2012) Swithced to updated controls
 v0.3 - (23-Jan-2013) Key focus management and SBNs implementation
 v0.4 - (20-Aug-2013) Dictionaries updated (SW00128921)
 v0.5 - (22-Aug-2013) JP Dictionary updated (SW00129746)
 v0.6 - (28-Aug-2013) DK and HR dictionaries updated (SW00130479)
 v0.7 - (09-Sep-2013) Update GUI dictionaries for PT, LT and HR languages. (SW00131472)
 v0.8 - (11-Sep-2013) Update GUI dictionary for BG language. (SW00131778)
 v0.9 - (13-Sep-2013) Update GUI dictionary for NO, ES, DK language. (SW00132044)
 v1.0 - (17-Sep-2013) Dictionaries updated. (SW00132330)
 v1.1 - (17-Mar-2014) Beep sound output implemented (SW00144370)
 v1.2 - (07-Apr-2014) Update to support the new NNG screens titles (SW00141943)
 v1.3 - (07-May-2014) Updated Status Bar behavior for Navigation Far and Near as per [iSC0187] (SW00147819)
 v1.4 - (23-May-2014) Update to support the new NNG screens titles for "Navigation" and "Settings" stringIds (SW00149322)
 v1.5 - (11-Jun-2014) J03G: GUI Assets: Asset changes for gui emnavi (Temporary : Green Color) (SW00149885)
 v1.6 - (12-Jun-2014) GUI_EMNAVI: MY15 Graphic Asset Update and Clean Up (SW00150279)
 v1.7 - (07-Nov-2014) GUI_EMNAVI: SW00157407:  [MICWARE] Split Screen does not display USB deviceID 
 v1.8 - (26-Nov-2014) GUI_EMNAVI: SW00158463:  [MICWARE] GUI_EMNAVI.. Change variable name used in code for GUI emnavi
 v1.9 - (27-Nov-2014) GUI_EMNAVI: SW00158048:  [MICWARE] GUI_EMNAVI.. [JN-208] : "0.0" was displayed after engine start on split screen (Map + aha)
 v2.0 - (28-Nov-2014) GUI_EMNAVI: SW00158443:  PIT - FM radio split screen shows 0.0 when removing currently streaming USB
 v2.1 - (1-Dec-2014) GUI_EMNAVI: SW00157615: [JN-178] : "Unknown" was not displayed on AV-Split-View.
 v2.2 - (6-Aug-2015) Patched with Enhanced Compass functions (emnaviApp.prototype._populateCompass and emnaviApp.prototype._CurrentLocationInfoMsgHandler)
 __________________________________________________________________________

 */

log.addSrcFile("emnaviApp.js", "emnavi");

function emnaviApp(uiaId)
{
    log.debug("Constructor called.");

    // Base application functionality is provided in a common location via this call to baseApp.init().
    // See framework/js/BaseApp.js for details.
    baseApp.init(this, uiaId);
}


/*********************************
 * App Init is standard function *
 * called by framework           *
 *********************************/

/*
 * Called just after the app is instantiated by framework.
 * All variables local to this app should be declared in this function
 */
emnaviApp.prototype.appInit = function()
{
    log.debug("emnaviApp appInit  called...");

    if (framework.debugMode)
    {
        utility.loadScript("apps/emnavi/test/emnaviAppTest.js");
    }

    this._emnaviSDCardSbn = "emnaviSDCardSbn";
    this._emnaviTurnByTurnTimedSbn = "emnaviTurnByTurnTimedSbn";
    this._emnaviTurnByTurnStateSbn = "emnaviTurnByTurnStateSbn";
    this._locationData = {
        latitude: "---",
        latUnit: "",
        longitude: "---",
        longUnit: "",
        elevation: "---",
        eleUnit: "",
        isValidInfo: 0,
        showNeedle: false,
        heading: "N"
    };

    this._sbnIconsName = "IcnTbt";
    this._sbnIconsExtention = ".png";
    this._navigationType = null;
    this._cachedMediaSource = null;
    this._cachedMetaData = {
        "Name" : null, //used for usb title and radio name
        "CommonLine" : null,
        "Track" : null,
        "Artist" : null,
        "Album" : null,
    };
    this._cachedAtSpeed = null;
    
    // preparing context stuck handeling
    this._preparingStuckTime = 3000; // 2 sec
    this._preparingStuckTimeoutId = null;


    //Context table
    //@formatter:off
    this._contextTable = {
        "AddressNotFound" : {
            "properties": {
                "keybrdInputSurface" : "JCI_OPERA_PRIMARY",
                "visibleSurfaces" : ["NNG_NAVI_ID", "NNG_NAVI_MAP1", "NNG_NAVI_MAP2", "NNG_NAVI_HMI", "NNG_NAVI_TWN"],
            },
            "sbNameId": this.uiaId,
            "sbNameIcon": "IcnSbnMap.png",
            "template" : "Dialog3Tmplt",
            // "sbNameId": this.uiaId,
            "controlProperties": {
                "Dialog3Ctrl" : {
                    "defaultSelectCallback" : this._dialogDefaultSelectCallback.bind(this),
                    "contentStyle" : "style02",
                    "fullScreen" : false,
                    "buttonCount" : 1,
                    "buttonConfig" : {
                        "button1" : {
                            buttonColor: "normal",
                            buttonBehavior : "shortPressOnly",
                            labelId: "common.Ok",
                            appData : "Global.OK",
                            disabled : false
                        },
                    }, // end of buttonConfig
                    "text1Id" : "AddressNotFound",
                } // end of properties for "ErrorCondition"
            }, // end of list of controlProperties
        }, // end of "AddressNotFound"
        "Active" : {
            "sbNameId": this.uiaId,
            "sbNameIcon": "IcnSbnMap.png",
            "template" : "EmNaviTmplt",
            "controlProperties" : {
                "NowPlayingInfoCtrl" : {
                    "visible" : null,
                    "mediaSource" : null,
                    "selectCallback" : this._nowPlayingInfoSelectCallback,
                },
            },
            "properties": {
                "keybrdInputSurface" : "NNG_NAVI_ID",
                "visibleSurfaces" :  ["NNG_NAVI_ID", "NNG_NAVI_MAP1", "NNG_NAVI_MAP2", "NNG_NAVI_HMI", "NNG_NAVI_TWN"],
            },
            "templatePath": "apps/emnavi/templates/EmNavi", //only needed for app-specific templates
            "readyFunction" : this._ActiveCtxtReady.bind(this),
            "contextInFunction" : this._ActiveCtxtInFunction.bind(this),
            "noLongerDisplayedFunction" : this._ActiveCtxtNoLongerDisplayed.bind(this)
            //EmNaviTmplt has no controls and needs no properties
        }, // end of "Active"
        "NaviPreparing" : {
            "sbNameId": this.uiaId,
            "sbNameIcon": "IcnSbnMap.png",
            "template" : "EmNaviBlackTmplt",
            "templatePath": "apps/emnavi/templates/EmNaviBlack", //only needed for app-specific templates
            //"displayedFunction" : this._preparingDisplayed.bind(this),
            "readyFunction" : this._preparingDisplayed.bind(this),
            "noLongerDisplayedFunction" : this._preparingNoLongerDisplayed.bind(this)
            //EmNaviBlackTmplt has no controls and needs no properties
        }, // end of "NaviPreparing"
        "NaviLoading" : {
            "sbNameId": this.uiaId,
            "sbNameIcon": "IcnSbnMap.png",
            "template" : "Dialog3Tmplt",
            "controlProperties": {
                "Dialog3Ctrl" : {
                    "contentStyle" : "style03",
                    "fullScreen" : false,
                    "text1Id" : "Loading",
                    "meter" : {"meterType":"indeterminate", "meterPath":"common/images/IndeterminateMeter.png"}
                } // end of properties for "Style03aDialog"
            }, // end of list of controlProperties
        }, // end of "NaviLoading"
        "Compass" : {
            "sbNameId": "Compass",
            "sbNameIcon": "IcnSbnMap.png",
            "template" : "CompassTmplt",
            "templatePath": "apps/emnavi/templates/Compass", //only needed for app-specific templates
            "controlProperties": {
                "CompassCtrl" : {
                        additionalTextId : 'NoNavigation'
                } // end of properties for "CoordinatesCtrl"
            }, // end of list of controlProperties
            "readyFunction": this._CompassContextReady.bind(this),
        } // end of "Compass"
    }; // end of this.contextTable object
    //@formatter:on

    //@formatter:off
    this._messageTable = {
        "CurrentLocationInfo": this._CurrentLocationInfoMsgHandler.bind(this),
        "TimedSbn_SDCardStatus": this._TimedSbnMsgHandler.bind(this),
        "StateSbn_NextTurn": this._StateSbnMsgHandler.bind(this),
        "EndStateSbn_NextTurn": this._EndStateSbnMsgHandler.bind(this),
        "TimedSbn_ETCNotification" : this._TimedSbn_ETCNotificationMsgHandler.bind(this),
        "SetID" : this._SetIDMsgHandler.bind(this),
        "MetaDataSource" : this._MetaDataSourceHandler.bind(this),
        "MetaDataList" : this._MetaDataListHandler.bind(this),
        "DynamicTitle" : this._DynamicTitleMsgHandler.bind(this),
        "Global.AtSpeed" :      this._SpeedHandler.bind(this), // received anywhere (even when not in focus)
        "Global.NoSpeed" :      this._SpeedHandler.bind(this), // received anywhere (even when not in focus)
    };
    //@formatter:on

    this._sbnTable = {
        "1" : "NAVAddressSearch",
        "2" : "NAVAddressSearch",
        "3" : "NAVPhoneZipSearch",
        "4" : "NAVPhoneZipSearch",
        "5" : "NAVPhoneZipSearch",
        "6" : "NAVAddressSearch",
        "7" : "NAVAddressSearch",
        "8" : "NAVAddressSearch",
        "9" : "NAVPOI",
        "10": "NAVPOI",
        "11": "NAVPOI",
        "12": "NAVPOI",
        "13": "NAVPOI",
        "14": "NAVPOI",
        "15": "NAVPOI",
        "16": "NAVPOI",
        "17": "NAVNewDestination",
        "18": "NAVHistory",
        "19": "NAVHistory",
        "20": "NAVHistory",
        "21": "NAVDragMode",
        "22": "NAVCoordinate",
        "23": "NAVCoordinate",
        "24": "NAVPointOnMap",
        "25": "NAVPOI",
        "26": "NAVMap",
        "27": "NAVRoute",
        "28": "NAVAvoidances",
        "29": "NAVAvoidances",
        "30": "NAVNavigationInfo",
        "31": "NAVRoute",
        "32": "NAVAvoidances",
        "33": "NAVAvoidances",
        "34": "NAVMap",
        "35": "NAVNavigationInfo",
        "36": "NAVMecca",
        "37": "NAVMecca",
        "38": "NAVNavigationInfo",
        "39": "NAVNavigationInfo",
        "40": "NAVNavigationInfo",
        "41": "NAVNavigationInfo",
        "42": "NAVNavigationInfo",
        "43": "NAVGasPrice",
        "44": "NAVGasPrice",
        "45": "NAVGasPrice",
        "46": "NAVWeather",
        "47": "NAVWeather",
        "48": "NAVWeather",
        "49": "NAVWeather",
        "50": "NAVWeather",
        "51": "NAVWeather",
        "52": "NAVWeather",
        "53": "NAVTraffic",
        "54": "NAVTraffic",
        "55": "NAVTraffic",
        "56": "NAVTraffic",
        "57": "NAVTraffic",
        "58": "NAVTraffic",
        "59": "NAVTraffic",
        "60": "NAVTraffic",
        "61": "NAVTraffic",
        "62": "NAVTraffic",
        "63": "NAVTraffic",
        "64": "NAVTraffic",
        "65": "NAVTraffic",
        "66": "NAVTraffic",
        "67": "NAVTraffic",
        "68": "NAVTraffic",
        "69": "NAVTraffic",
        "70": "NAVTraffic",
        "71": "NAVSettings",
        "72": "NAVSettings",
        "73": "NAVSettings",
        "74": "NAVSettings",
        "75": "NAVSettings",
        "76": "NAVSettings",
        "77": "NAVSettings",
        "78": "NAVSettings",
        "79": "NAVSettings",
        "80": "NAVSettings",
        "81": "NAVSettings",
        "82": "NAVRoute",
        "83": "NAVRoute",
        "84": "NAVRoute",
        "85": "NAVRoute",
        "86": "NAVRoute",
        "87": "NAVPOI",
        "88": "NAVTurnByTurn",
        "89": "NAVTurnByTurn",
        "90": "NAVSimulation",
        "91": "NAVTurnByTurn",
        "92": "NAVNewDestination",
        "93": "NAVVoicePrompts",
        "94": "NAVItemList",
        "95": "NAVRoute",
        "96": "NAVRoute",
        "97": "NAVAvoidances",
        "98": "NAVCitySearch",
        "99": "NAVQuickSearch",
        "100": "NAVQuickSearch",
        "101": "NAVQuickSearch",
        "102": "NAVQuickSearch",
        "103": "emnavi",
    };
    
    /* ------------------------------
     * INTERNAL PROPERTIES AND CONFIG
     * ------------------------------
     */
    this._statusBarHeight = 60;
    this._displayedImages = [];
    this._cachedSbName = null;
};



/**
 * =========================
 * CONTEXT CALLBACKS
 * =========================
 */
emnaviApp.prototype._CompassContextReady = function ()
{
    this._populateCompass();
};

// preparing

emnaviApp.prototype._preparingDisplayed = function()
{
    log.info("ENTER _preparingDisplayed, this._preparingStuckTime:" + this._preparingStuckTime);
    if (this._preparingStuckTimeoutId) /*SW00158463 modified variable name from _preparingstuckTimeoutId to _preparingStuckTimeoutId */
    {
        clearTimeout(this._preparingStuckTimeoutId);
        this._preparingStuckTimeoutId = null;
    }
    this._preparingStuckTimeoutId = setTimeout(this._preparingStuckTimedout.bind(this), this._preparingStuckTime);
};

emnaviApp.prototype._preparingStuckTimedout = function()
{
    var params = {payload:{}};
    log.info("ENTER : _preparingStuckTimedout");
    this._preparingStuckTimeoutId = null;
    
    // Check current context ID and if it still hasn't change, do recovery recursively.
    if (this._currentContext && this._currentContext.ctxtId === "NaviPreparing")
    {
        framework.sendEventToMmui(this.uiaId, "preparingStucked", params);
        this._preparingStuckTimeoutId = setTimeout(this._preparingStuckTimedout.bind(this), this._preparingStuckTime);
    }
    else {
        clearTimeout(this._preparingStuckTimeoutId);
    }
};

emnaviApp.prototype._preparingNoLongerDisplayed = function()
{
    if (this._preparingStuckTimeoutId)
    {
        clearTimeout(this._preparingStuckTimeoutId);
        this._preparingStuckTimeoutId = null;
    }
};


/**
 * Ready Callback (Active)
 * =========================
 * @return {void}
 */
emnaviApp.prototype._ActiveCtxtReady = function()
{
    log.info("ENTER activeContextReady, mediaSource:[" + this._cachedMediaSource + "]");
    this._updateSplitScreen();
};

emnaviApp.prototype._ActiveCtxtInFunction = function() 
{
    log.info("ENTER activeContextIn, mediaSource:[" + this._cachedMediaSource + "]");
    if(this._currentContext.params && this._currentContext.params.payload && this._currentContext.params.payload.ScreenType ) 
    {
        this._contextTable.Active.controlProperties.NowPlayingInfoCtrl.visible = this._currentContext.params.payload.ScreenType == "Split" ? true : false;
    }
    this._contextTable.Active.controlProperties.NowPlayingInfoCtrl.mediaSource = this._cachedMediaSource;
};
/**
 * No Longer Displayed Callback (Active)
 * =========================
 * @return {void}
 */
emnaviApp.prototype._ActiveCtxtNoLongerDisplayed = function()
{
    log.info("Active context is no longer displayed");
};
// Dialog Control click callback
emnaviApp.prototype._dialogDefaultSelectCallback = function (dialogBtnCtrlObj, appData, params)
{
    if (this._currentContext.ctxtId == "AddressNotFound" && appData == "Global.OK")
    {
        framework.sendEventToMmui("Common", "Global.Yes");
    }
};

emnaviApp.prototype._nowPlayingInfoSelectCallback = function() 
{
    log.info('sending IntentNowPlayingScreen');
    framework.sendEventToMmui('emnavi', 'IntentNowPlayingScreen');
};

/**
 * =========================
 * MESSAGE HANDLERS
 * =========================
 */
emnaviApp.prototype._SpeedHandler = function(msg)
{
    log.info("_SpeedHandler called", msg); /*
    this._cachedAtSpeed = framework.common.getAtSpeedValue();
    
    if (this._currentContext && this._currentContextTemplate)
    {
        //nowPlayingInfoCtrl.dvdTvSetAtSpeed(this._cachedAtSpeed);
        
    } */

};

emnaviApp.prototype._DynamicTitleMsgHandler = function(msg)
{
    log.info("Dynamic title receieved: " + msg.params.payload.Title);
    if(framework._currentAppUiaId === 'emnavi')
    {
        framework.common.statusBar.setAppName(msg.params.payload.Title);
    }
};

emnaviApp.prototype._MetaDataListHandler = function(msg) 
{
    log.info("ENTER _MetaDataListHandler, for source:" + this._cachedMediaSource);
    log.info("Name : " + msg.params.payload.Name);
    log.info("CommonLine : " + msg.params.payload.CommonLine);
    log.info("Track : " + msg.params.payload.Track);
    log.info("Artist : " + msg.params.payload.Artist);
    log.info("Album : " + msg.params.payload.Album);

    this._cachedMetaData.Name = msg.params.payload.Name;
    this._cachedMetaData.CommonLine = msg.params.payload.CommonLine;
    this._cachedMetaData.Artist = msg.params.payload.Artist;
    this._cachedMetaData.Album = msg.params.payload.Album;
    this._cachedMetaData.Track = msg.params.payload.Track;


    if(this._currentContext && this._currentContextTemplate && this._currentContext.ctxtId == "Active") 
    {
        this._updateSplitScreen();
    }

};

emnaviApp.prototype._MetaDataSourceHandler = function(msg) 
{
    log.info("MetaDataSourceHandler recieved : " + msg.params.payload.sourceType);
    this._cachedMediaSource = msg.params.payload.sourceType;
    
    if(this._currentContext && this._currentContextTemplate && this._currentContext.ctxtId == "Active") 
    {
        var nowPlayingInfoCtrl = this._currentContextTemplate.nowPlayingInfoCtrl;
        nowPlayingInfoCtrl.setEntertainmentSource(this._cachedMediaSource);
            
        this._cachedMetaData.Track =""; /*added for SW00158048 */
        this._cachedMetaData.Artist= "";
        this._cachedMetaData.Album="";
        this._cachedMetaData.CommonLine ="";
        
        nowPlayingInfoCtrl.setGenericText(""); //Whenever audio source change is received then we set the source name and clear all other info
        nowPlayingInfoCtrl.setSongName(""); // and wait for Metadatalist message from MMUI to display other info like song, artist name etc
        nowPlayingInfoCtrl.setArtistName("");
        nowPlayingInfoCtrl.setAlbumName("");
        
        if(this._cachedMediaSource == "USBAUDIO") 
        {
            if(this._cachedMetaData.Name === null || this._cachedMetaData.Name === '') 
            {
                nowPlayingInfoCtrl.setSourceTitle("USB " /* + this._cachedMetaData.Name */);
            }
            else
            {
                nowPlayingInfoCtrl.setSourceTitle("USB " + this._cachedMetaData.Name);
            }
        } 
        else if (this._cachedMediaSource == "BTAUDIO")
        {
            if(this._cachedMetaData.Name === null || this._cachedMetaData.Name === '') 
            {
                nowPlayingInfoCtrl.setSourceTitle("BT Audio " /* + this._cachedMetaData.Name */);
            }
            else
            {
                nowPlayingInfoCtrl.setSourceTitle("BT Audio - " + this._cachedMetaData.Name);
            }
        }
        else
        {
            nowPlayingInfoCtrl.setSourceTitle(this._cachedMediaSource);
        }
        if(this._cachedMediaSource == "DVD" || this._cachedMediaSource == "TV")
        {
            nowPlayingInfoCtrl.setGenericText("画面視聴時は安全");
            nowPlayingInfoCtrl.setSongName("な場所に停車し、");
            nowPlayingInfoCtrl.setArtistName("1画面設定にして");
            nowPlayingInfoCtrl.setAlbumName("ご覧下さい。");
        }
    }
    else 
    {
        /*added for SW00158048 */
        log.info("Context not active, source name will not be updated.");
        log.info("Context not active, source change received so clearing all cached data..");
        
        this._cachedMetaData.Track ="";
        this._cachedMetaData.Artist= "";
        this._cachedMetaData.Album="";
        this._cachedMetaData.CommonLine ="";
    }
};

/**
 * Message Handler (Start TimedSbn)
 * =========================
 * @param {object}
 * @return {void}
 */

emnaviApp.prototype._TimedSbnMsgHandler = function (msg)
{
    if (msg.msgId == "TimedSbn_SDCardStatus")
    {
        switch (msg.params.payload.status)
        {
            case "Inserted":
                framework.common.startTimedSbn(this.uiaId, this._emnaviSDCardSbn, "deviceConnected", {sbnStyle: "Style02", text1Id: "SDCradInserted", imagePath1: "IcnSbnSdCard.png"});
                break;
            case "Removed":
                framework.common.startTimedSbn(this.uiaId, this._emnaviSDCardSbn, "deviceRemoved", {sbnStyle: "Style02", text1Id: "SDCradRemoved", imagePath1: "IcnSbnSdCard.png"});
                break;
            case "Invalid":
                framework.common.startTimedSbn(this.uiaId, this._emnaviSDCardSbn, "errorNotification", {sbnStyle: "Style02", text1Id: "SDCardInvalid", imagePath1: "IcnSbnSdCard.png"});
                break;
        }
    }
    else
    {
        log.warn("emnavi: no sbn message recognised.");
    }
};

emnaviApp.prototype._TimedSbn_ETCNotificationMsgHandler = function (msg)
{
    var emnaviETCNotif1 = "emnaviETCNotif1" + new Date().getTime();
    var emnaviETCNotif2 = "emnaviETCNotif2" + new Date().getTime();
    var playBeep = null;
    if (msg.params.payload.ShallPlayBeep)
    {
        playBeep = "beepAtStart";
    }
    else
    {
        playBeep = "beepNone";
    }
    if (msg.params.hasOwnProperty("payload") && msg.params.payload.hasOwnProperty("NotificationString"))
    {
        framework.common.startTimedSbn(this.uiaId, emnaviETCNotif1, "driverId", {sbnStyle: "Style01", text1: msg.params.payload.NotificationString, beepTiming: playBeep});

        if (msg.params.hasOwnProperty("payload") && msg.params.payload.hasOwnProperty("NotificationString2") && msg.params.payload.NotificationString2 !== "")
        {
            framework.common.startTimedSbn(this.uiaId, emnaviETCNotif2, "driverId", {sbnStyle: "Style01", text1: msg.params.payload.NotificationString2, beepTiming: playBeep});
        }
    }
};

emnaviApp.prototype._SetIDMsgHandler = function (msg)
{
    if (msg.params && msg.params.payload && msg.params.payload.ScreenId)
    {
        for (var i in this._sbnTable)
        {
            if  (i == msg.params.payload.ScreenId)
            {
                this._cachedSbName = this._sbnTable[i];
                break;
            }
        }
    }
    else
    {
        log.error("No msg payload for ScreenId.");
    }
    
    if(framework._currentAppUiaId === 'emnavi')
    {
        framework.common.setSbNameId(this.uiaId, this._cachedSbName);
    }
};


/**
 * Message Handler (Start StateSbn)
 * =========================
 * @param {object}
 * @return {void}
 */
emnaviApp.prototype._StateSbnMsgHandler = function (msg)
{
    if (msg.params.payload.type == "Now")
    {
        this._navigationType = "navigationNear";
    }
    else if (msg.params.payload.type == "Far")
    {
        this._navigationType = "navigationFar";
    }
    this._releaseSBNImages(msg);
    var config = this._setTurnByTurnSbnConfig(msg);
    framework.common.showStateSbn(this.uiaId, this._emnaviTurnByTurnStateSbn, this._navigationType, config);
};

/**
 * Message Handler (End StateSbn)
 * =========================
 * @param {object}
 * @return {void}
 */
emnaviApp.prototype._EndStateSbnMsgHandler = function (msg)
{
    this._releaseSBNImages(msg);
    framework.common.endStateSbn(this.uiaId, this._emnaviTurnByTurnStateSbn, this._navigationType);
};

emnaviApp.prototype._CurrentLocationInfoMsgHandler = function (msg) {
    this._locationData.isValidInfo = msg.params.payload.isValidInfo;
    this._locationData.showNeedle = msg.params.payload.showNeedle;
    this._locationData.heading = msg.params.payload.heading;

    if (msg.params.payload.isValidInfo !== 0)
    {
        this._locationData.latUnit = "N";
        if (msg.params.payload.latitude < 0)
        {
            this._locationData.latUnit = "S";
        }

        this._locationData.longUnit = "E";
        if (msg.params.payload.longitude < 0)
        {
            this._locationData.longUnit = "W";
        }

        this._locationData.eleUnit = "M";
        if (msg.params.payload.altitudeUnit != "KM")
        {
            this._locationData.eleUnit = "FT";
        }

        this._locationData.latitude = Math.round(Math.abs(msg.params.payload.latitude) * 10) / 10 + "°";
        this._locationData.longitude = Math.round(Math.abs(msg.params.payload.longitude) * 10) / 10 + "°"
        this._locationData.latlng = {
            lat: msg.params.payload.latitude,
            lng: msg.params.payload.longitude
        };
        this._locationData.elevation = msg.params.payload.altitude;
    }
    else if (msg.params.payload.isValidInfo === 0)
    {
        this._locationData.latitude = "---";
        this._locationData.latUnit = "";
        this._locationData.longitude = "---";
        this._locationData.longUnit = "";
        this._locationData.elevation = "---";
        this._locationData.eleUnit = "";
        this._locationData.latlng = false;
    }

    if (this._currentContext && this._currentContextTemplate && this._currentContext.ctxtId == "Compass")
    {
        this._populateCompass();
    }

};
/**
 * =========================
 * Helpers
 * =========================
 */
emnaviApp.prototype._populateCompass = function () {

    // for the Map we handle it differently
    this._currentContextTemplate.compassCtrl.setLocationData(this._locationData);

};

/**
 * Create SBN Config
 * =========================
 * @param {object} - source data for the config
 * @return {object} - generated config
 */
emnaviApp.prototype._setTurnByTurnSbnConfig = function (msg)
{
    // return turn by turn Sbn configuration
    var hasManeuverIcon = false;
    var DirIconPath = "";
    if (msg.params.payload.diriconID !== "" && msg.params.payload.diriconID !== null && msg.params.payload.diriconID !== undefined && msg.params.payload.diriconID != 0)
    {
        hasManeuverIcon = true;
        DirIconPath = this._getDirIconPath(msg.params.payload.diriconID);
    }

    var Unit = "";
    if (msg.params.payload.unit !== "" && msg.params.payload.unit !== null && msg.params.payload.unit !== undefined)
    {
        Unit = this._getUnit(msg.params.payload.unit);
    }

    var hasManeuverDistance = false;
    var Distance = "";
    if (msg.params.payload.unit != "No_Display")
    {
        hasManeuverDistance = true;
        Distance =  msg.params.payload.distance / 10;
    }

    var LocationName = msg.params.payload.streetName;

    var SbnConfig = {
        sbnStyle: "Style05",
        hasManeuverIcon: hasManeuverIcon,
        hasManeuverDistance: hasManeuverDistance,
        imagePath1: DirIconPath,
        text1Id: Unit,
        text1SubMap: {value: Distance, spacing: ""},
        text3: LocationName
    };
    return SbnConfig;
};

/**
 * Release SBN Images
 * Any images that are no longer needed should be released
 * =========================
 * @param {object} - parsed JSON msg as received from MMUI
 * @return void
 */
emnaviApp.prototype._releaseSBNImages = function (msg)
{
    var msg = msg || {};
    var preserveImages = [];
    var removeImages = [];
    var str = '';

    // validate input
    if (!msg.params.hasOwnProperty('payload') ||
        !msg.params.payload.hasOwnProperty('streetName'))
    {
        return;
    }

    // get string
    str = msg.params.payload.streetName;

    // Replace any escaped "<" or ">" symbols with...escaped symbols
    str = str.replace(/\<\</g, "&lt;");
    str = str.replace(/\>\>/g, "&gt;");

    // match images and store them to preserveImages
    str.replace(/(?:\<)(.*?)(?:\>)/g, function(reg, match, offset, original) {
        preserveImages.push(match);
    });

    // compare preserveImages with this._displayedImages and add missing images to removeImages
    for (var i=0; i<this._displayedImages.length; i++)
    {
        var needle = this._displayedImages[i];
        if (preserveImages.indexOf(needle) == -1)
        {
            removeImages.push(needle);
        }
    }

    // send event to MMUI
    if (removeImages.length !== 0 && removeImages.length !== null && removeImages.length !== undefined)
    {
        var params = {payload:{
            count : removeImages.length,
            list : removeImages
        }};
        framework.sendEventToMmui(this.uiaId, 'RemoveRoadShieldFiles', params);
    }

    // store preserveImages to this._displayedImages
    this._displayedImages = [];
    this._displayedImages = preserveImages;
};

/**
 * =========================
 * Utilities
 * =========================
 */
emnaviApp.prototype._getDirIconPath = function (DirIconId)
{
    var imageName = this._sbnIconsName + DirIconId + this._sbnIconsExtention + '?' + new Date().getTime();
    return imageName;
};

emnaviApp.prototype._getUnit = function (unitName)
{
    var unit;
    switch (unitName)
    {
        case "No_Display":
            unit = "";
            break;
        case "Meter":
            unit = "M";
            break;
        case "Mile":
            unit = "mi";
            break;
        case "KiloMeter":
            unit = "km";
            break;
        case "Yard":
            unit = "Y";
            break;
        case "Feet":
            unit = "FT";
            break;
        default:
            unit = "";
            break;
    }
    return unit;
};

emnaviApp.prototype._updateSplitScreen = function() {
    log.info("ENTER updateSplitScreen");

    log.info("ENTER _updateSplitScreen, for source:" + this._cachedMediaSource);
    log.info("Song/Track/Name in updateSplitScreen: " + this._cachedMetaData.Track);
    log.info("CommonLine in updateSplitScreen : " + this._cachedMetaData.CommonLine);
    log.info("Artist in updateSplitScreen : " + this._cachedMetaData.Artist);
    log.info("Album in updateSplitScreen : " + this._cachedMetaData.Album);
    
    var nowPlayingInfoCtrl = this._currentContextTemplate.nowPlayingInfoCtrl;
    
    if(this._cachedMediaSource == "BTAUDIO" && this._cachedMetaData != null) 
    {
        this._cachedMetaData.Track = this._formatMetadataString(this._cachedMetaData.Track);
        this._cachedMetaData.Artist = this._formatMetadataString(this._cachedMetaData.Artist);
        this._cachedMetaData.Album = this._formatMetadataString(this._cachedMetaData.Album);
    }
    
    if(!nowPlayingInfoCtrl) {
        log.warn("Controls not initialized, exiting");
        return -1;
    }
    nowPlayingInfoCtrl.setEntertainmentSource(this._cachedMediaSource);
    nowPlayingInfoCtrl.setSongName(this._cachedMetaData.Track);
    nowPlayingInfoCtrl.setArtistName(this._cachedMetaData.Artist);
    nowPlayingInfoCtrl.setAlbumName(this._cachedMetaData.Album);

    //strip zeros after floating point for radio
    if(this._cachedMetaData.CommonLine !== null && this._cachedMetaData.CommonLine !== undefined) 
    {
        var re = new RegExp("(\\d+\\.\\d)" + "\\d+");
        this._cachedMetaData.CommonLine = this._cachedMetaData.CommonLine.replace(re, "$1");
    }
    if(this._cachedMediaSource == "FMRADIO" && this._cachedMetaData.Name !== null && this._cachedMetaData.CommonLine !== null ) {
        var metadata = null;
        metadata = this._cachedMetaData.CommonLine;
        var freq = Number(metadata); // converting the string value of freq in integer number.
        if(freq)
        {
         metadata += " MHz ";
        }
        else
        {
         log.info("Since 0 frequency is received in FM radio so not displaying freq on UI");
         metadata = "";
        }
        
        metadata += this._cachedMetaData.Name;
        nowPlayingInfoCtrl.setGenericText(metadata);
    }
    else if(this._cachedMediaSource == "AMRADIO" && this._cachedMetaData.CommonLine !== null)
    {
        var metadata = null;
        metadata = Math.floor(this._cachedMetaData.CommonLine);
        if (metadata)
        {
            metadata += ' kHz';
        }
        else // if metadata is "0" then no need to display "0". Initializing with empty string. 
        {
            metadata = "";
        }
        nowPlayingInfoCtrl.setGenericText(metadata);
    }
    else if(this._cachedMediaSource == "CD" && this._cachedMetaData.CommonLine !== null)
    {
        var tracks = this._cachedMetaData.CommonLine.split('|');
        nowPlayingInfoCtrl.setGenericText("Track " + (tracks[0] ? tracks[0].toString() : "-") + "/" + (tracks[1] ? tracks[1].toString() : "-"));
    }
    else 
    {
        nowPlayingInfoCtrl.setGenericText(this._cachedMetaData.CommonLine);
    }

    if(this._cachedMediaSource == "USBAUDIO" ) {
        if(this._cachedMetaData.Name === null || this._cachedMetaData.Name === '') 
        {
            nowPlayingInfoCtrl.setSourceTitle("USB " /* + this._cachedMetaData.Name */);
        }
        else
        {
            nowPlayingInfoCtrl.setSourceTitle("USB" + this._cachedMetaData.Name); /* Name will be received as device ID - USB Name*/
        }
    } /* Since USB name change is received from handler*/
    else if(this._cachedMediaSource == "BTAUDIO" ) {
        if(this._cachedMetaData.Name === null||this._cachedMetaData.Name === '') 
        {
            nowPlayingInfoCtrl.setSourceTitle("BT Audio " /* + this._cachedMetaData.Name */);
        }
        else
        {
          nowPlayingInfoCtrl.setSourceTitle("BT Audio - " + this._cachedMetaData.Name);
        }
        
    }
    else {
        nowPlayingInfoCtrl.setSourceTitle(this._cachedMediaSource);
    }

    if(this._cachedMediaSource == "DVD" || this._cachedMediaSource == "TV")
    {
       nowPlayingInfoCtrl.setGenericText("画面視聴時は安全");
       nowPlayingInfoCtrl.setSongName("な場所に停車し、");
       nowPlayingInfoCtrl.setArtistName("1画面設定にして");
       nowPlayingInfoCtrl.setAlbumName("ご覧下さい。");
    }
    if (this._cachedMediaSource == "STITCHER")
    {
        if (this._cachedMetaData.Album == null || this._cachedMetaData.Album == '')
        {
            nowPlayingInfoCtrl.setAlbumName(""); 
        }
        else
        {
            nowPlayingInfoCtrl.setAlbumName(this._formatTime(this._cachedMetaData.Album)); 
        }
    }

   };
   
emnaviApp.prototype._formatMetadataString = function(inString) 
{
    var outString = inString == null || inString == "" ? "Unknown" : inString;
    return outString;
};   

emnaviApp.prototype._formatTime = function (seconds)
{
    // Validate input
    if (isNaN(seconds))
    {
        log.warn('Only numbers are accepted');
        return;
    }

    // Create Date object
    var date = new Date();
    date.setUTCHours(0);
    date.setUTCMinutes(0);
    date.setUTCSeconds(seconds);

    // Extraxt data
    var dateString = date.toUTCString();
    var lessThanAnHour = /.*00:(\d{2}:\d{2}).*/;
    var moreThanAnHour = /.*(\d{2}:\d{2}:\d{2}).*/;
    return lessThanAnHour.test(dateString) ? dateString.replace(lessThanAnHour, "$1") : dateString.replace(moreThanAnHour, "$1");
};

/**
 * =========================
 * Framework register
 * Tell framework this .js file has finished loading
 * =========================
 */
framework.registerAppLoaded("emnavi", null, true);
