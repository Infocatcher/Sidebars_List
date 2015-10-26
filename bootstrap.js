const WINDOW_LOADED = -1;
const WINDOW_CLOSED = -2;

Components.utils.import("resource://gre/modules/Services.jsm");
var rootURI;

function install(params, reason) {
	try {
		Services.strings.flushBundles(); // https://bugzilla.mozilla.org/show_bug.cgi?id=719376
	}
	catch(e) {
		Components.utils.reportError(e);
	}
}
function uninstall(params, reason) {
}
function startup(params, reason) {
	rootURI = params && params.resourceURI
		? params.resourceURI.spec
		: new Error().fileName
			.replace(/^.* -> /, "")
			.replace(/[^\/]+$/, "");

	if(parseFloat(Services.appinfo.platformVersion) < 10) {
		if(!("addBootstrappedManifestLocation" in Components.manager)) {
			Components.utils.reportError("[Sidebars List] missing Components.manager.addBootstrappedManifestLocation()");
			Services.prompt.alert(
				null,
				"Sidebars List :: Error",
				"Sidebars List doesn't work in Firefox 4.0 - 7.0 and will be disabled.\n"
					+ "See https://developer.mozilla.org/en-US/docs/XPCOM_Interface_Reference/"
					+ "nsIComponentManager#addBootstrappedManifestLocation%28%29 for details."
			);
			Components.utils.import("resource://gre/modules/AddonManager.jsm");
			AddonManager.getAddonByID(params.id, function(addon) {
				addon.userDisabled = true;
			});
			return;
		}
		Components.manager.addBootstrappedManifestLocation(params.installPath);
	}

	sbListLoader.init(reason);
}
function shutdown(params, reason) {
	if(parseFloat(Services.appinfo.platformVersion) < 10)
		Components.manager.removeBootstrappedManifestLocation(params.installPath);

	sbListLoader.destroy(reason);
}

var sbListLoader = {
	initialized: false,
	init: function(reason) {
		if(this.initialized)
			return;
		this.initialized = true;

		var ws = Services.wm.getEnumerator("navigator:browser");
		while(ws.hasMoreElements())
			this.initWindow(ws.getNext(), reason);

		Services.ww.registerNotification(this);
	},
	destroy: function(reason) {
		if(!this.initialized)
			return;
		this.initialized = false;

		var ws = Services.wm.getEnumerator("navigator:browser");
		while(ws.hasMoreElements())
			this.destroyWindow(ws.getNext(), reason);

		Services.ww.unregisterNotification(this);
	},

	observe: function(subject, topic, data) {
		if(topic == "domwindowopened")
			subject.addEventListener("load", this, false);
		//else if(topic == "domwindowclosed")
		//	this.destroyWindow(subject, WINDOW_CLOSED);
	},

	handleEvent: function(e) {
		if(e.type == "load") {
			var window = e.currentTarget;
			window.removeEventListener("load", this, false);
			this.initWindow(window, WINDOW_LOADED);
		}
	},

	defaultPrefsLoaded: false,
	initWindow: function(window, reason) {
		if(reason == WINDOW_LOADED && !this.isTargetWindow(window))
			return;
		if("sidebarsList" in window)
			return;
		Services.scriptloader.loadSubScript("chrome://sidebarslist/content/sidebarslist.js", window);
		var sbl = window.sidebarsList;
		if(!this.defaultPrefsLoaded) {
			//~ todo: add condition when https://bugzilla.mozilla.org/show_bug.cgi?id=564675 will be fixed
			this.defaultPrefsLoaded = true;
			var defaultBranch = Services.prefs.getDefaultBranch("");
			Services.scriptloader.loadSubScript(rootURI + "defaults/preferences/sblist_prefs.js", {
				pref: function(pName, val) {
					sbl.setPref(pName, val, defaultBranch);
				}
			});
		}
		sbl.init();
	},
	destroyWindow: function(window, reason) {
		window.removeEventListener("load", this, false); // Window can be closed before "load"
		if(
			reason != APP_SHUTDOWN
			&& reason != WINDOW_CLOSED
			&& "sidebarsList" in window
		)
			window.sidebarsList.destroy(true);
	},
	isTargetWindow: function(window) {
		return window.document.documentElement.getAttribute("windowtype") == "navigator:browser";
	}
};