/**
 * JCI Mock Environment
 * Simplifies local development
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

// (log)
var log = {

	addSrcFile: function() {},

	debug: function() {
		console.log(arguments);
	},


};


// (framework)
var framework = {

	init: function() {

		this.root = document.getElementById("mock");

		this.view = document.getElementById("view");

		this.surface = document.getElementById("surface");

	},

	registerAppLoaded: function(appName) {

		// create app
		this.app = new window[appName + 'App'];

	},

	registerCtrlLoaded: function(ctrlName) {

		this.control = new window[ctrlName](0, this.surface, ctrlName, {});
	},

	localize: {

		getLocStr: function(id, _default) {
			return _default;
		}
	},


	ready: function(callback) {

		if(this.control || this.app) {
			callback();

		} else {
			setTimeout(function() {
				this.ready(callback);
			}.bind(this), 500);
		}
		
	},

	common: {

		statusBar: {

			clock: {
				innerHTML: false,
				_update: function() {
					 var today = new Date(), h = today.getHours(), m = today.getMinutes();


					 var s = (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;

					 this.innerHTML = s;

					 return s;

				},
			}

		},

	},

	loadControl: function(appId, controlId, controlName) {

		// initialize
		var controlName = controlName || (controlId + 'Ctrl'),
			path = "apps/" + appId +"/controls/" + controlId + '/';

		// create resources
		this.loadCSS(path + 'css/' + controlName + '.css');
		this.loadJS(path + 'js/' + controlName + '.js');

	},

	loadCSS: function(filename, callback) {
		var css = document.createElement('link');
        css.rel = "stylesheet";
        css.type = "text/css";
        css.href = filename;
        css.onload = callback;
        document.body.appendChild(css);
	},

	loadJS: function(filename, callback) {
		var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = filename;
        script.onload = callback;
        document.body.appendChild(script);
	},

};

// (interval)
setInterval(function() {

	framework.common.statusBar.clock._update();

}, 500);

// (baseApp)
var baseApp = {

	init: function(app, id) {

		this.app = app;

		this.app.appInit();

	}

}


// (utility)
var utility = {



}
 


