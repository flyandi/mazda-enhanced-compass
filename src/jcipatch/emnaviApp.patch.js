emnaviApp.prototype._populateCompass = function () {

    // for the Map we handle it differently
    this._currentContextTemplate.compassCtrl.setLocationData(this._locationData);

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