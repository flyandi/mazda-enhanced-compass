/**
 * 
 * @class This singleton provides a script tag proxy for asynchronous cross
 *        domain requests using JSONP.
 * 
 */
var Proxy = (function() {

    // Instance stores a reference to the Singleton
    var instance;

    function init() {

	// Singleton

	// Private methods and variables

	/**
	 * 
	 * A hashtable that holds references to all generated script tags. The
	 * key is the generated id for the tag.
	 * 
	 * @property
	 * @type Object
	 */
	var _tags = {};

	var callbacks = {};

	var errorCallbacks = {};

	var successfullCallbacks = {};

	function devNull() {};

	/**
	 * Counter for the generated ids of the script tags.
	 * 
	 * @type Integer
	 */
	var _idCounter = 0;

	/**
	 * The prefix that is used to generate the ids of the script tags.
	 * 
	 * @type String
	 */
	var _idPrefix = 'Proxy-';

	var _callbackPrefix = 'Proxy.callbacks.';

	var _headTag = document.getElementsByTagName('head')[0];

	function checkForTimeout(callbackId) {
	    if (successfullCallbacks[callbackId] === true)
		return;
	    errorCallbacks[callbackId]();
	};

	function removeTimeoutCheck(callbackId) {
	    callbacks[callbackId] = devNull;
	    delete (errorCallbacks[callbackId]);
	};

	/**
	 * Creates a new script tag and adds it to the header of the DOM of the
	 * current page.
	 * 
	 * @param {String}
	 *                url The url to use for the 'src' attribute of the
	 *                script tag.
	 * 
	 * @returns {String} The id of the generated tag.
	 */
	function buildScriptTag(url, id) {
	    var scriptTag = document.createElement('script');
	    scriptTag.setAttribute('type', 'text/javascript');
	    scriptTag.setAttribute('charset', 'utf-8');
	    scriptTag.setAttribute('src', url);
	    scriptTag.setAttribute('id', id);

	    return scriptTag;
	};

	/**
	 * Removes the script tag with the passed id, if exists.
	 * 
	 * @param {String}
	 *                tagId The id of the tag to be removed.
	 */
	function removeScriptTag(tagId) {
	    if (_tags[tagId]) {
		_headTag.removeChild(_tags[tagId]);
		delete _tags[tagId];
	    }
	};

	return {

	    // Public methods and variables
	    get : function(options) {

		options = options || {};

		var callback = options.callback || 'callback', tagId = _idPrefix + _idCounter++, callbackId = 'cb'
			+ _idCounter, self = this;

		var url = [ options.url, options.url.indexOf('?') > -1 ? '&' : '?', callback, '=',
			_callbackPrefix, callbackId ].join('');

		var scriptTag = buildScriptTag(url, tagId);

		var onSuccess = options.success;

		callbacks[callbackId] = function(response) {
		    self.successfullCallbacks[callbackId] = true;
		    self.removeTimeoutCheck(callbackId);
		    if (onSuccess) {
			onSuccess(response);
		    }
		};

		var onError = options.error;

		errorCallbacks[callbackId] = function() {
		    self.removeTimeoutCheck(callbackId);
		    if (onError) {
			onError({
			    error : 'timeout'
			});
		    }
		};

		_tags[tagId] = scriptTag;
		_headTag.appendChild(scriptTag);

		window.setTimeout(Class.prototype.bind.call(this, checkForTimeout, this),
			options.timeout || 10000, callbackId);
	    },
	};

    };

    return {

	// Get the Singleton instance if one exists or create one if it doesn't
	getInstance : function() {

	    if (!instance) {
		instance = init();
	    }

	    return instance;
	}

    };

})();
