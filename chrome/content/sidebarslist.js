window.sidebarsList = { // var sidebarsList = ... can't be deleted!
	prefNS: "extensions.sidebarslist.",
	prefVer: 3,

	origTitles: [],
	tbButtons: [],
	currentSb: null,
	currentSbNum: null,

	popupId: "viewSidebarMenu",

	init: function() {
		window.addEventListener("unload", this, false);

		var v = this.get("prefsVersion") || 0;
		if(v < this.prefVer)
			this.prefsMigration(v);
		this.prefSvc.addObserver(this.prefNS, this, false);

		document.insertBefore(document.createProcessingInstruction(
			"xml-stylesheet",
			'href="chrome://sidebarslist/content/sidebarslist.css" type="text/css"'
		), document.documentElement);

		this.multiSb = "MultiSidebar" in window;

		this.createSplitter();
		this.tweakSidebar();
		this.registerHotkeys();

		this.popup.addEventListener("popupshowing", this, true);

		setTimeout(function(_this) {
			_this.delayedInit();
		}, 0, this);
	},
	delayedInit: function() {
		this.addSbWrappers();
		this.ensureSidebarTweaked() || setTimeout(function(_this) {
			_this.ensureSidebarTweaked();
		}, this.get("ensureSidebarRestoredDelay"), this);
		if(this.isAustralis) {
			window.addEventListener("ViewShowing", this, false);
			window.addEventListener("ViewHiding", this, false);
			if(this.sbBtnBox)
				this.sbBtnBox.addEventListener("mouseover", this, false);
		}
	},
	destroy: function(force) {
		window.removeEventListener("unload", this, false);
		if(this.isAustralis) {
			window.removeEventListener("ViewShowing", this, false);
			window.removeEventListener("ViewHiding", this, false);
			this.destroySbBtnWatcher();
		}

		if(!force)
			this.saveCurrentURI();

		// Workaround to correctly save web panel title
		var ttl = this.getOrigTitle();
		if(ttl && ttl.id) {
			if(force)
				ttl.removeAttribute("sidebarslist_value");
			else
				ttl.setAttribute("sidebarslist_value", ttl.value);
			document.persist(ttl.id, "sidebarslist_value");
		}

		if(this.hasMutationObserver)
			this.removeAttrMutationObservers(this.origTitles);
		else
			this.setHandlers(this.origTitles, "DOMAttrModified", this, false);
		this.setHandlers(this.tbButtons, this.wheelEvent, this, false);
		this.setHandlers(this.tbButtons, "mousedown", this, false);
		this.setHandlers(this.tbButtons, "contextmenu", this, false);

		this.destroyPopup(force);
		this.destroySplitter();

		this.prefSvc.removeObserver(this.prefNS, this);
		force && this.selfDestroy();
	},
	selfDestroy: function() {
		this.restorePopup();

		this.tbButtons.forEach(this.rc);
		this.rc(this.sbSplitter);

		for(var kId in this.keys)
			this.rc(this.$("sidebarsList-key-" + kId));

		for(var child = document.documentElement; child = child.previousSibling; ) {
			if(
				child.nodeType == child.PROCESSING_INSTRUCTION_NODE
				&& child.data.substr(0, 28) == 'href="chrome://sidebarslist/'
			) {
				this.rc(child);
				break;
			}
		}

		this.removeSidebarWidthLimits(false);
		this.removeSbWrappers();
		this.setCollapsableSidebar(false);
		this.fixSidebarZoom(false);
		this.cleanupNodes();

		delete window.sidebarsList;
	},
	rc: function(node) {
		node && node.parentNode && node.parentNode.removeChild(node);
	},
	handleEvent: function(e) {
		switch(e.type) {
			case "unload":           this.destroy();              break;
			case "popupshowing":     this.popupShowingHandler(e); break;
			case "popuphidden":      this.popupHiddenHandler(e);  break;
			case "contextmenu":
			case "mousedown":        this.ensurePopupPosition(e); break;
			case "ViewShowing":      this.viewShowingHandler(e);  break;
			case "ViewHiding":       this.viewHidingHandler(e);   break;
			case "mouseover":        this.mouseOverHandler(e);    break;
			case "DOMMouseScroll": // Legacy
			case "wheel":            this.scrollList(e);          break;
			case "resize": // Legacy
			case "sizemodechange":   this.sizeModeChanged(e);     break;
			case "DOMAttrModified":  this.updTitleLegacy(e); // Legacy
		}
	},
	setHandlers: function(nodes, evtType, func, addFlag) {
		var act = addFlag ? "addEventListener" : "removeEventListener";
		nodes.forEach(function(node) {
			node[act](evtType, func, true);
		});
	},
	get hasMutationObserver() {
		delete this.hasMutationObserver;
		return this.hasMutationObserver = "MutationObserver" in window;
	},
	addAttrMutationObservers: function(nodes, func, context, options) {
		if(!options)
			options = {};
		options.attributes = true;
		function mutationsHandler(mutations) {
			mutations.forEach(func, context);
		}
		nodes.forEach(function(node) {
			var mo = node.__sidebarsList_mutationObserver = new MutationObserver(mutationsHandler);
			mo.observe(node, options);
		});
	},
	removeAttrMutationObservers: function(nodes) {
		nodes.forEach(function(node) {
			if("__sidebarsList_mutationObserver" in node) {
				node.__sidebarsList_mutationObserver.disconnect();
				delete node.__sidebarsList_mutationObserver;
			}
		});
	},
	get platformVersion() {
		var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
			.getService(Components.interfaces.nsIXULAppInfo);
		var pv = parseFloat(appInfo.platformVersion);
		if(appInfo.name == "Pale Moon" || appInfo.name == "Basilisk")
			pv = pv >= 4.1 ? 56 : 28;
		delete this.platformVersion;
		return this.platformVersion = pv;
	},
	get sizeModeChangeEvent() {
		delete this.sizeModeChangeEvent;
		return this.sizeModeChangeEvent = this.platformVersion >= 8
			? "sizemodechange"
			: "resize";
	},
	get wheelEvent() {
		delete this.wheelEvent;
		return this.wheelEvent = "WheelEvent" in window
			? "wheel"
			: "DOMMouseScroll";
	},
	get isAustralis() {
		delete this.isAustralis;
		return this.isAustralis = "CustomizableUI" in window;
	},

	get currentURL() {
		return gBrowser.currentURI.spec;
	},
	get currentTitle() {
		if("contentTitle" in gBrowser)
			return gBrowser.contentTitle;
		if(gBrowser.contentDocument)
			return gBrowser.contentDocument.title;
		return gBrowser.selectedTab.label; // Fallback
	},

	ensureSidebarTweaked: function() {
		if(!this._sidebarHeaderCreated && !this.sbHidden)
			this.tweakSidebar();
		return this._sidebarHeaderCreated;
	},
	_sidebarHeaderCreated: false,
	tweakSidebar: function(force) {
		var hidden = this.sbHidden;
		if(!force && hidden)
			return;
		this.setCollapsableSidebar();
		if(this._sidebarHeaderCreated)
			return;
		this._sidebarHeaderCreated = true;
		for(var i = 1; i <= 4; ++i) {
			this.addList(i);
			this.tweakSidebarControls(i);
			if(!this.multiSb)
				break;
		}
		this.removeSidebarWidthLimits();
		if(!hidden) {
			this.saveCurrentURI();
			setTimeout(function(_this) {
				_this.fixSidebarZoom();
			}, 0, this);
		}
	},
	sbWidthLimitsRemoved: false,
	removeSidebarWidthLimits: function(rmv) {
		if(rmv === undefined)
			rmv = this.get("removeWidthLimits");
		if(this.sbWidthLimitsRemoved == rmv)
			return;
		this.sbWidthLimitsRemoved = rmv;
		var s = this.sb.style;
		if(rmv) {
			this.sbMinWidth = s.minWidth || "";
			this.sbMaxWidth = s.maxWidth || "";
			s.setProperty("min-width", "0", "important");
			s.setProperty("max-width", "none", "important");
		}
		else {
			s.setProperty("min-width", this.sbMinWidth, "important");
			s.setProperty("max-width", this.sbMaxWidth, "important");
		}
	},

	sbZoomFixed: false,
	fixSidebarZoom: function(fix) {
		if(fix === undefined)
			fix = this.get("fixSidebarZoom");
		if(this.sbZoomFixed == fix)
			return;
		this.sbZoomFixed = fix;
		// Known issue: doesn't work for Ctrl+mouse wheel
		//this._log("fixSidebarZoom(" + fix + ")");
		var zm = "ZoomManager" in window && ZoomManager;
		if(!zm || !("setZoomForBrowser" in zm))
			return;
		if(!fix) {
			this.unwrapFunction(zm, "getZoomForBrowser");
			this.unwrapFunction(zm, "setZoomForBrowser");
			return;
		}
		this.wrapFunction(zm, "getZoomForBrowser", function(browser) {
			if(!browser || this.isWebPanelBrowser(browser) || !this.isZoomCommand())
				return false;
			var wpBrowser = this.getWebPanelBrowser();
			if(!wpBrowser)
				return false;
			var res = ZoomManager.getZoomForBrowser(wpBrowser);
			return { value: res };
		});
		this.wrapFunction(zm, "setZoomForBrowser", function(browser, zoom) {
			if(!browser || this.isWebPanelBrowser(browser) || !this.isZoomCommand())
				return false;
			var wpBrowser = this.getWebPanelBrowser();
			if(!wpBrowser)
				return false;
			var res = ZoomManager.setZoomForBrowser(wpBrowser, zoom);
			return { value: res };
		});
	},
	isWebPanelBrowser: function(browser) {
		return browser && browser.id == "web-panels-browser";
	},
	getWebPanelBrowser: function() {
		var fw = document.commandDispatcher.focusedWindow;
		if(!fw)
			return null;
		fw = fw.top;
		var dwu = Components.classes["@mozilla.org/inspector/dom-utils;1"]
			.getService(Components.interfaces.inIDOMUtils);
		var fwBrowser = dwu.getParentForNode(fw.document, true);
		if(this.isWebPanelBrowser(fwBrowser))
			return fwBrowser;
		return null;
	},
	isZoomCommand: function() {
		var stack = new Error().stack;
		//this._log("isZoomCommand()\n" + stack);
		return stack.indexOf("\nFullZoom_onLocationChange@chrome://browser/content/browser.js:") == -1;
	},

	addSbWrappers: function() {
		this.wrapFunction(window, "toggleSidebar", function(commandId, forceOpen) {
			this.handleSidebarCommand(commandId, forceOpen);
		});
		if("SidebarUI" in window) { // Firefox 38+
			this.wrapFunction(SidebarUI, "show", function(commandId) {
				this.handleSidebarCommand(commandId, true);
			});
			this.wrapFunction(SidebarUI, "hide", function() {
				this.handleSidebarCommand();
			});
		}
		this.wrapFunction(window, "openWebPanel", function(aTitle, aURI) {
			if(this.clearSidebar) {
				var last = this.lastURI;
				if(!last.isWeb) {
					this.clearBrowser(this.sb);
					this._log("openWebPanel(): clear sidebar");
				}
				else if(last.uri != aURI) {
					var wpBrowser = this.sb.contentDocument
						&& this.sb.contentDocument.getElementById("web-panels-browser");
					if(wpBrowser) {
						this.clearBrowser(wpBrowser);
						this._log("openWebPanel(): clear web panel");
					}
				}
			}
			this.saveURI(aURI, aTitle || "");
			this.setCollapsableWebPanel();
			this.fixSidebarZoom();
		});
		this.wrapFunction(window, "asyncOpenWebPanel", function() {
			this.setCollapsableWebPanel();
			this.fixSidebarZoom();
		});
	},
	removeSbWrappers: function() {
		this.unwrapFunction(window, "toggleSidebar");
		if("SidebarUI" in window) { // Firefox 38+
			this.unwrapFunction(SidebarUI, "show");
			this.unwrapFunction(SidebarUI, "hide");
		}
		this.unwrapFunction(window, "openWebPanel");
		this.unwrapFunction(window, "asyncOpenWebPanel");
	},
	handleSidebarCommand: function(commandId, forceOpen) {
		if(commandId) {
			this.tweakSidebar(true);
			if(this.clearSidebar && commandId != this.lastCommand) {
				this.clearBrowser(this.sb);
				this._log("toggleSidebar(): clear sidebar");
			}
		}
		else {
			var cmd = this.sbBox.getAttribute("sidebarcommand");
			if(!cmd || !this.$(cmd)) {
				var url = this.sb.currentURI.spec;
				this._log(
					"toggleSidebar(): sidebar broadcaster not found, "
					+ "sidebarcommand: \"" + cmd + "\", URL: " + url
				);
				if(!this.sbHidden) {
					var realCmd;
					if(url == "chrome://browser/content/web-panels.xul")
						realCmd = "viewWebPanelsSidebar";
					else {
						var mi = this.popup.getElementsByAttribute("sidebarurl", url)[0];
						realCmd = mi && mi.getAttribute("observes");
					}
					if(realCmd && this.$(realCmd)) {
						this.sbBox.setAttribute("sidebarcommand", realCmd);
						this._log("toggleSidebar(): fix sidebar broadcaster: " + realCmd);
					}
				}
			}
		}
		if(!forceOpen && (!commandId || this.sbBox.getAttribute("sidebarcommand") == commandId))
			this.saveCurrentURI(); // To save new web panel location
		// Note: Firefox is buggy itself with web panels
		if(!commandId || commandId == "viewWebPanelsSidebar")
			return;
		var mi = this.popup.getElementsByAttribute("observes", commandId)[0];
		if(mi)
			this.saveURI(mi.getAttribute("sidebarurl"));
	},
	get clearSidebar() {
		return this.sbCollapsable
			&& this.get("collapseSidebar.clearBeforeSwitch")
			&& this.sbHidden;
	},
	clearBrowser: function(br) {
		var doc = br.contentDocument;
		if(doc) {
			var root = doc.documentElement;
			if(root) {
				root.style.display = "none";
				// Fallback: we should handle unloading document, but something may went wrong
				doc.defaultView.setTimeout(function(_this) {
					root.style.display = "";
					_this._log("clearBrowser(): show contents for " + doc.documentURI + " (fallback)");
				}, 2000, this);
			}
		}
	},
	// Do some magic to restore third party wrappers from other extensions
	wrapFunction: function(obj, meth, callBefore, prefix) {
		var win = this.getGlobalForObject(obj);
		var key = "sidebarsListMod::" + (prefix || "") + meth;
		var orig, wrapped;
		var isOwn = Object.hasOwnProperty.call(obj, meth);
		if(!(key in win)) {
			orig = obj[meth];
			wrapped = obj[meth] = function sidebarsListWrapper() {
				var ret = win[key].apply(window.sidebarsList, arguments);
				if(ret)
					return typeof ret == "object" ? ret.value : undefined;
				return orig.apply(this, arguments);
			};
			if(!this.isNativeFunction(orig)) {
				// Someone may want to do eval() patch...
				var patch = function(s) {
					return s.replace(
						"{",
						'{\n'
						+ '\tvar _sblRet = window["' + key + '"].apply(top.sidebarsList || window, arguments);\n'
						+ '\tif(_sblRet) return typeof _sblRet == "object" ? _sblRet.value : undefined;\n'
					);
				};
				wrapped.toString = function() {
					return patch(orig.toString());
				};
				wrapped.toSource = function() {
					return patch(orig.toSource());
				};
			}
		}
		win[key] = callBefore;
		callBefore.__orig = orig;
		callBefore.__wrapped = wrapped;
		callBefore.__isOwn = isOwn;
	},
	unwrapFunction: function(obj, meth, prefix) {
		var win = this.getGlobalForObject(obj);
		var key = "sidebarsListMod::" + (prefix || "") + meth;
		if(!(key in win))
			return;
		var callBefore = win[key];
		if(obj[meth] != callBefore.__wrapped)
			win[key] = function() {};
		else {
			delete win[key];
			if(callBefore.__isOwn)
				obj[meth] = callBefore.__orig;
			else
				delete obj[meth];
		}
	},
	overrideProperty: function(o, p, d) {
		var od = this.getOwnPropertyDescriptor(o, p);
		this.defineProperty(o, p, d);
		return od;
	},
	restoreProperty: function(o, p, d) {
		if(d)
			this.defineProperty(o, p, d);
		else
			delete o[p];
	},
	getGlobalForObject: function(o) {
		if("getGlobalForObject" in Components.utils)
			return Components.utils.getGlobalForObject(o);
		try {
			var global = o.valueOf.call(null);
			if(global && global instanceof Components.interfaces.nsIDOMWindow)
				return global;
		}
		catch(e) {
			Components.utils.reportError(e);
		}
		return null;
	},
	isNativeFunction: function(func) {
		// Example: function alert() {[native code]}
		return /\[native code\]\s*\}$/.test(Function.toString.call(func));
	},
	getOwnPropertyDescriptor: function(o, p) {
		if(!("getOwnPropertyDescriptor" in Object)) { // Firefox < 4
			return Object.hasOwnProperty.call(o, p) && {
				value: o[p],
				get: Object.__lookupGetter__.call(o, p),
				set: Object.__lookupSetter__.call(o, p)
			} || undefined;
		}
		return Object.getOwnPropertyDescriptor(o, p);
	},
	defineProperty: function(o, p, d) {
		if(!("defineProperty" in Object)) {  // Firefox < 4
			if(!d)
				throw new TypeError("value is not a non-null object");
			d.get && Object.__defineGetter__.call(o, p, d.get);
			d.set && Object.__defineSetter__.call(o, p, d.set);
			if(!d.get)
				o[p] = d.value;
			return;
		}
		Object.defineProperty(o, p, d);
	},

	get collapseSidebar() {
		return this.get("collapseSidebar");
	},
	sbCollapsable: false,
	setCollapsableSidebar: function(collapsable) {
		//~ todo: try preserve third party wrappers
		if(collapsable == undefined)
			collapsable = this.collapseSidebar;
		if(this.sbCollapsable == collapsable)
			return;
		this.sbCollapsable = collapsable;

		//~ todo: MultiSidebar support ?
		var sbBox = this.sbBox;
		var sb = this.sb;

		if(collapsable) {
			sbBox.collapsed = sbBox.hidden;
			sbBox.hidden = false;

			this._origSBHidden = this.overrideProperty(sbBox, "hidden", {
				get: function() {
					return this.collapsed;
				},
				set: function(val) {
					this.collapsed = val;
				},
				configurable: true,
				enumerable: true
			});
			// Also override getAttribute("hidden")/setAttribute("hidden", ...) for other extensions
			// like Sidebar Auto Show/Hide https://addons.mozilla.org/addon/sidebar-auto-showhide/
			// Note: native .hidden getter/setter doesn't use our wrapped functions
			this.wrapFunction(sbBox, "getAttribute", function(attrName) {
				if(attrName == "hidden")
					return { value: sbBox.collapsed };
				return false;
			}, "sidebarBox.");
			this.wrapFunction(sbBox, "setAttribute", function(attrName, attrVal) {
				if(attrName == "hidden") {
					sbBox.collapsed = String(attrVal) == "true";
					return true;
				}
				return false;
			}, "sidebarBox.");
			this.wrapFunction(sb, "setAttribute", function(attrName, attrVal) {
				return attrName == "src" && (
					attrVal == "about:blank"
					|| attrVal == sb.getAttribute(attrName)
				);
			}, "sidebar.");
			// See toggleSidebar() function in Firefox 17+ (chrome://browser/content/browser.js)
			if(sb.docShell && "createAboutBlankContentViewer" in sb.docShell) {
				var ds = "create" in Object
					? Object.create(sb.docShell, { // Firefox >= 4
						createAboutBlankContentViewer: {
							value: function() {},
							configurable: true,
							enumerable: true
						}
					})
					: {
						__proto__: sb.docShell,
						createAboutBlankContentViewer: function() {}
					};
				this._origSBDocShell = this.overrideProperty(sb, "docShell", {
					get: function() {
						return ds;
					},
					configurable: true,
					enumerable: true
				});
			}
		}
		else {
			var hidden = sbBox.hidden;
			this.restoreProperty(sbBox, "hidden", this._origSBHidden);
			this.unwrapFunction(sbBox, "getAttribute", "sidebarBox.");
			this.unwrapFunction(sbBox, "setAttribute", "sidebarBox.");
			this.unwrapFunction(sb, "setAttribute", "sidebar.");
			if("_origSBDocShell" in this) {
				this.restoreProperty(sb, "docShell", this._origSBDocShell);
				delete this._origSBDocShell;
			}
			this._origSBHidden = null;

			sbBox.hidden = hidden;
			sbBox.collapsed = false;
			if(hidden) {
				sb.setAttribute("src", "about:blank");
				try {
					sb.docShell.createAboutBlankContentViewer(null);
				}
				catch(e) {
				}
			}
		}

		this.setCollapsableWebPanel(collapsable);
	},
	wpCanBeCollapsable: false,
	setCollapsableWebPanel: function(collapsable) {
		if(collapsable == undefined)
			collapsable = this.collapseSidebar;
		if(!collapsable && !this.wpCanBeCollapsable)
			return;
		this.wpCanBeCollapsable = collapsable;
		var sb = this.sb;
		if(
			sb.getAttribute("src") != "chrome://browser/content/web-panels.xul"
			|| !sb.docShell
			|| !sb.contentDocument
			|| !sb.webProgress
		)
			return;
		if(sb.webProgress.isLoadingDocument) { //?
			var _this = this;
			sb.addEventListener("load", function loader() {
				sb.removeEventListener(e.type, loader, false);
				_this.setCollapsableWebPanel(collapsable);
			}, false);
			return;
		}

		var cw = sb.contentWindow;
		if("sidebarsListCollapsable" in cw == collapsable)
			return;
		if(collapsable)
			cw.sidebarsListCollapsable = true;
		else
			delete cw.sidebarsListCollapsable;
		if(collapsable) {
			var wpBrowser = cw.document.getElementById("web-panels-browser");
			this.wrapFunction(cw, "loadWebPanel", function(uri) {
				return uri == wpBrowser.currentURI.spec;
			});
		}
		else {
			this.unwrapFunction(cw, "loadWebPanel");
		}
	},

	_disableChecked: false,
	setDisableChecked: function(disable) {
		if(!this.popupInitialized)
			return;

		if(disable == undefined)
			disable = this.get("disableOpened");
		if(this._disableChecked == disable)
			return;
		this._disableChecked = disable;

		var popup = this.popup;
		this.disableCheckedInPopup(popup, disable);
		if(!this.hasMutationObserver) { // Legacy
			popup[disable ? "addEventListener" : "removeEventListener"](
				"DOMAttrModified",
				this.disableCheckedLegacy,
				false
			);
			return;
		}
		if(disable) {
			this.addAttrMutationObservers(
				[popup], this.disableChecked, this,
				{ subtree: true, attributeFilter: ["checked"] }
			);
		}
		else {
			this.removeAttrMutationObservers([popup]);
		}
	},
	disableCheckedInPopup: function(popup, disable) {
		var attr = disable ? "checked" : "sidebarslist_disabled";
		Array.prototype.slice.call(popup.getElementsByAttribute(attr, "true"))
			.forEach(function(node) {
				this.disableNode(node, disable);
			}, this);
	},
	get windowState() {
		// Note: we have STATE_NORMAL for fullscreen state in Firefox <= 3.6
		// and we don't have window.STATE_FULLSCREEN in Firefox <= 3.5
		return window.fullScreen ? window.STATE_FULLSCREEN || 4 : window.windowState;
	},
	maxSplitterWidth: 128,
	setSplitterWidth: function(byPrefChange) {
		var state = this._lastWindowState = this.windowState;
		if(state == window.STATE_MINIMIZED)
			return;
		var prefName = "splitterWidth";
		if(state == window.STATE_MAXIMIZED)
			prefName += "MaximizedWindow";
		else if(state == (window.STATE_FULLSCREEN || 4)) {
			var isDFS = this.isDOMFullScreen;
			prefName += isDFS ? "FullScreenDOM" : "FullScreen";
			if(!isDFS && this.platformVersion >= 41) {
				// Wait for document.mozFullScreen setup...
				setTimeout(function(_this) {
					if(_this.isDOMFullScreen) {
						_this._log("setSplitterWidth(): Used hack to detect DOM fullscreen");
						_this.setSplitterWidth();
					}
				}, 0, this);
			}
		}
		var w = this.get(prefName) || 0;

		var _w = Math.max(0, Math.min(this.maxSplitterWidth, w));
		if(_w != w) {
			w = _w;
			this.set(prefName, w);
			return; // => prefsChanged()
		}

		var spl = this.sbSplitter;
		var win = spl.ownerDocument.defaultView;
		var stl = spl.style;
		var setProp = function(p, v) {
			stl.setProperty(p, v, "important");
		};

		if(w <= 0) { // "width: 0" may not work on Linux with "-moz-appearance: splitter"
			if(stl.visibility == "collapse")
				return;
			this._log("setSplitterWidth(): hide splitter (" + prefName + ")");
			setProp("visibility", "collapse");
			return;
		}
		if(stl.width == w + "px" && stl.visibility != "collapse")
			return;

		this._log("setSplitterWidth(): update splitter width: " + w + "px (" + prefName + ")");
		if(spl.hasAttribute("style"))
			spl.removeAttribute("style");
		setProp("width",     w + "px");
		setProp("max-width", w + "px");

		var cs = win.getComputedStyle(spl, null);
		// Note: there is weird bug with
		// Warning: ReferenceError: reference to undefined property cs.borderLeftWidth
		var borderLeft  = parseFloat(cs.borderLeftWidth || 0);
		var borderRight = parseFloat(cs.borderRightWidth);
		if(w < borderLeft + borderRight) {
			borderLeft  = Math.floor(w/2);
			borderRight = w - borderLeft;
			setProp("border-left-width",  borderLeft  + "px");
			setProp("border-right-width", borderRight + "px");
		}

		var realW = parseFloat(cs.width);
		if(realW > w) {
			var dw = Math.round(realW - w);
			var dwl = Math.floor(dw/2);
			var dwr = dw - dwl;
			var marginLeft  = parseFloat(cs.marginLeft)  - dwl;
			var marginRight = parseFloat(cs.marginRight) - dwr;
			setProp("margin-left",  marginLeft  + "px");
			setProp("margin-right", marginRight + "px");
		}

		if(byPrefChange && "TreeStyleTabService" in window) try {
			// Workaround for https://github.com/piroor/treestyletab/issues/546#issuecomment-32224492
			var {TreeStyleTabConstants} = Components.utils.import("resource://treestyletab-modules/constants.js", {});
			gBrowser.treeStyleTab.updateFloatingTabbar(TreeStyleTabConstants.kTABBAR_UPDATE_BY_APPEARANCE_CHANGE);
			this._log("setSplitterWidth(): force update Tree Style Tab");
		}
		catch(e) {
			Components.utils.reportError(e);
		}
	},
	get isDOMFullScreen() {
		return document.fullScreen || document.mozFullScreen
			|| "fullscreenElement" in document && !!document.fullscreenElement;
	},
	sizeModeChanged: function(e) {
		if(this.windowState != this._lastWindowState)
			this.setSplitterWidth();
	},
	prefsChanged: function(pName, pVal) {
		switch(pName) {
			case "disableOpened":                this.setDisableChecked();         break;
			case "splitterWidth":
			case "splitterWidthMaximizedWindow":
			case "splitterWidthFullScreen":
			case "splitterWidthFullScreenDOM":   this.setSplitterWidth(true);      break;
			case "collapseSidebar":              this.setCollapsableSidebar(pVal); break;
			case "reloadButtonStyle":            this.updateControlsStyle();       break;
			case "removeWidthLimits":            this.removeSidebarWidthLimits();  break;
			case "fixSidebarZoom":               this.fixSidebarZoom();            break;
			case "openTabInSidebarClosesTab":    this.setMoveLabel();
		}
	},

	$: function(id) {
		return document.getElementById(id);
	},
	get popup() {
		delete this.popup;
		return this.popup = this.$(this.popupId);
	},
	get popupset() {
		delete this.popupset;
		return this.popupset = this.$("mainPopupSet");
	},
	getOrigTitle: function(n) {
		return this.$("sidebar" + (n > 1 ? "-" + n : "") + "-title");
	},
	get sb() {
		delete this.sb;
		return this.sb = this.$("sidebar");
	},
	getSb: function(n) {
		return n > 1 ? this.$("sidebar-" + n) : this.sb;
	},
	get sbBox() {
		delete this.sbBox;
		return this.sbBox = this.$("sidebar-box");
	},
	getSbBox: function(n) {
		return n > 1 ? this.$("sidebar-" + n + "-box") : this.sbBox;
	},
	get sbHidden() { // Note: like !SidebarUI.isOpen in Firefox 38+
		return this.sbBox.hidden;
	},
	get sbBtnBox() {
		// Note: button inside #PanelUI-button isn't available on window startup
		var btn = this.$("sidebar-button") || this.$("PanelUI-popup");
		if(!btn)
			return null;
		delete this.sbBtnBox;
		return this.sbBtnBox = btn;
	},

	addList: function(multiNum) {
		var isMulti = multiNum > 1;
		var multiId = isMulti ? "-" + multiNum : "";

		var tbb = document.createElement("toolbarbutton");
		this.tbButtons.push(tbb);
		tbb.id = "sidebarsList-sidebar-title" + multiId;
		tbb.className = "sidebarsList-sidebar-title";
		tbb.setAttribute("type", "menu");
		tbb.setAttribute("flex", "1");
		tbb.setAttribute("context", this.popupId);

		var closeCmd = isMulti
			? "MultiSidebar.closeSidebarByPosition(" + multiNum + ");"
			: "sidebarsList.sidebar.hide();";
		tbb.setAttribute("onclick", "if(event.button == 1 && event.target == this) " + closeCmd);

		tbb.addEventListener("mousedown", this, true);
		tbb.addEventListener("contextmenu", this, true);
		tbb.addEventListener(this.wheelEvent, this, true);

		var ttl = this.getOrigTitle(multiNum);
		this.origTitles.push(ttl);
		this.property(ttl, "className", (ttl.className + " " + "sidebarsList-originalTitle").replace(/^\s+/, ""));
		this.property(ttl, "__sidebarsList_tbb", tbb);
		var val = ttl.value;
		if(!val) {
			val = ttl.getAttribute("sidebarslist_value");
			this._log("Will use saved sidebar title:\n" + val);
		}
		tbb.setAttribute("label", val);

		document.persist(ttl.id, "value"); // Firefox bug: title of web panel isn't restored
		// Firefox bug: restored title of web panel may disappears...
		// Cen be reproduced in Firefox 10.0.11
		val && setTimeout(function(_this) {
			if(ttl.value)
				return;
			_this._log("Sidebar title disappears, restore:\n" + val);
			ttl.value = val;
		}, 0, this);

		tbb.__sidebarsList_multiNum = multiNum;
		if(this.hasMutationObserver)
			this.addAttrMutationObservers([ttl], this.updTitle, this, { attributeFilter: ["value"] });
		else
			ttl.addEventListener("DOMAttrModified", this, true);

		var header = ttl.parentNode;
		if(header.id == "sidebar-switcher-target") { // Firefox 55+
			header.parentNode.insertBefore(tbb, header.nextSibling);
			this.attribute(header, "flex", "0");
		}
		else {
			header.insertBefore(tbb, ttl);
		}
	},
	popupInitialized: false,
	initPopup: function() {
		if(this.popupInitialized)
			return;
		this.popupInitialized = true;
		this._log("initPopup()");
		var popup = this.popup;

		this.destroySbBtnWatcher();
		popup.addEventListener("popuphidden", this, true);
		popup.addEventListener(this.wheelEvent, this, true);

		var df = document.createDocumentFragment();

		var spl = this.spl = document.createElement("menuseparator");
		spl.id = "sidebarsList-contextSeparator";
		df.appendChild(spl);

		var c2sb = this.c2sb = document.createElement("menuitem");
		c2sb.id = "sidebarsList-contentToSidebar";
		c2sb.className = "menuitem-iconic sidebarsList-contentToSidebar";
		c2sb.setAttribute("oncommand", "sidebarsList.contentToSidebar(event);");
		c2sb.setAttribute("onclick", "sidebarsList.contentToSidebar(event);");
		c2sb.setAttribute("key", "sidebarsList-key-contentToSidebar");
		this.setMoveLabel();
		df.appendChild(c2sb);

		var sb2c = this.sb2c = document.createElement("menuitem");
		sb2c.id = "sidebarsList-sidebarToContent";
		sb2c.className = "menuitem-iconic sidebarsList-sidebarToContent";
		sb2c.setAttribute("label", this.getLocalized("sidebarToContent"));
		sb2c.setAttribute("accesskey", this.getLocalized("sidebarToContentAccessKey"));
		sb2c.setAttribute("oncommand", "sidebarsList.sidebarToContent(event);");
		sb2c.setAttribute("onclick", "sidebarsList.sidebarToContent(event);");
		sb2c.setAttribute("key", "sidebarsList-key-sidebarToContent");
		df.appendChild(sb2c);

		popup.appendChild(df);

		this.setDisableChecked();
	},
	mouseOverHandler: function(e) {
		this.destroySbBtnWatcher();
		setTimeout(function(_this) { // Pseudo async
			_this._log(e.type + " on #" + _this.sbBtnBox.id + " => initPopup()");
			_this.initPopup();
		}, 0, this);
	},
	destroySbBtnWatcher: function() {
		this.sbBtnBox && this.sbBtnBox.removeEventListener("mouseover", this, false);
	},
	setMoveLabel: function() {
		var mi = this.c2sb;
		if(!mi) // Preference changed, but menu item not yet created
			return;
		var move = this.get("openTabInSidebarClosesTab") ? "Move" : "";
		mi.setAttribute("label", this.getLocalized("contentToSidebar" + move));
		mi.setAttribute("accesskey", this.getLocalized("contentToSidebar" + move + "AccessKey"));
	},
	destroyPopup: function(force) {
		var popup = this.popup;
		popup.removeEventListener("popupshowing", this, true);
		if(!this.popupInitialized)
			return;
		this.popupInitialized = false;

		popup.removeEventListener("popuphidden", this, true);
		popup.removeEventListener(this.wheelEvent, this, true);
		this.setDisableChecked(false);

		if(!force)
			return;
		Array.prototype.forEach.call(
			popup.getElementsByTagName("*"),
			function(node) {
				if(node.hasAttribute("sidebarslist_disabled"))
					this.disableNode(node, false);
				Array.prototype.slice.call(node.attributes).forEach(function(attr) {
					var name = attr.name || "";
					if(name.substr(0, 13) == "sidebarslist_" && name != "sidebarslist_allowContext")
						node.removeAttribute(name);
				});
			},
			this
		);
		this.rc(this.spl);
		this.rc(this.c2sb);
		this.rc(this.sb2c);
	},
	popupShowingHandler: function(e) {
		if(e && e.target != e.currentTarget)
			return;
		this._popupOpen = true; //~ todo: use popup.state (Firefox 3.0+) ?
		this.initPopup();
		this.initContext();
		this.highlightFeatures(this.popup);

		var sep = this.spl.previousSibling;
		if(
			sep
			&& sep.localName == "menuseparator"
			&& sep.classList && sep.classList.contains("social-provider-menu")
		) {
			var pn = e.currentTarget.parentNode;
			var _this = this;
			pn.addEventListener(e.type, function hideSep(e) {
				pn.removeEventListener(e.type, hideSep, false);
				if(!sep.hidden) {
					sep.hidden = true;
					_this._log("Force hide menuseparator.social-provider-menu");
				}
			}, false);
		}
	},
	_restorePopupTimer: 0,
	popupHiddenHandler: function(e) {
		if(e && e.target != e.currentTarget)
			return;
		this._popupOpen = false;
		this.destroyContext();

		clearTimeout(this._restorePopupTimer);
		this._restorePopupTimer = setTimeout(function(_this) {
			if(!_this._popupOpen)
				_this.restorePopup();
		}, 50, this);
	},
	ensurePopupPosition: function(e) {
		var trg = e && e.target;
		var type = e && e.type;
		if(type == "mousedown" && e.button != 0)
			return;
		if(type == "contextmenu" && trg.localName != "toolbarbutton" && trg.localName != "splitter") {
			for(; trg; trg = trg.parentNode) {
				if(trg.hasAttribute("sidebarslist_allowContext")) // Can be used in other extensions
					break;
				var context = trg.getAttribute("context");
				if(context) {
					if(context == this.popupId)
						e.preventDefault();
					break;
				}
			}
			return;
		}
		var parent;
		if(!e || type == "contextmenu") {
			parent = this.popupset;
			if(e && this.popup.parentNode != parent) {
				// Hack for Firefox 3.5 and older
				e.preventDefault();
				var evt = document.createEvent("MouseEvents");
				evt.initMouseEvent( // https://developer.mozilla.org/en/DOM/event.initMouseEvent
					e.type, e.bubbles, e.cancelable, e.view, e.detail,
					e.screenX, e.screenY, e.clientX, e.clientY,
					e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
					e.button, e.relatedTarget
				);
				setTimeout(function() {
					trg.dispatchEvent(evt);
				}, 0);
			}
		}
		else if(trg.localName == "toolbarbutton" && trg.getAttribute("open") != "true") {
			parent = trg;
			if(
				"open" in trg && !trg.open
				&& this.popup.parentNode != parent
				&& !("defaultPrevented" in e ? e.defaultPrevented : e.getPreventDefault())
			) {
				// Hack: imitate menu-like node behavior
				setTimeout(function() {
					if(!trg.open)
						trg.open = true;
				}, 0);
			}
		}
		parent && this.reposPopup(parent);
	},
	popupParent: null,
	reposPopup: function(newParent) {
		var popup = this.popup;
		var parent = popup.parentNode;
		if(parent != newParent) {
			if(!this.popupParent)
				this.popupParent = parent;
			newParent.appendChild(popup);
		}
	},
	restorePopup: function() {
		var popup = this.popup;
		var parent = this.popupParent;
		if(parent && popup.parentNode != parent)
			parent.appendChild(popup);
	},
	viewShowingHandler: function(e) {
		if(e.target.id == "PanelUI-sidebar")
			this.popupShowingHandler();
	},
	viewHidingHandler: function(e) {
		if(e.target.id == "PanelUI-sidebar")
			this.popupHiddenHandler();
	},
	get hasRightSidebar() { // Firefox 55+
		delete this.hasRightSidebar;
		return this.hasRightSidebar = "SidebarUI" in window && "reversePosition" in SidebarUI;
	},
	get isRightSidebar() {
		return this.hasRightSidebar && !this.getPref("sidebar.position_start");
	},
	createSplitter: function() {
		var sbSplitter = this.sbSplitter = document.createElement("splitter");
		sbSplitter.id = "sidebarsList-splitter";
		sbSplitter.className = "chromeclass-extrachrome";
		sbSplitter.setAttribute("onclick", "sidebarsList.smartToggleSidebar(event);");
		sbSplitter.setAttribute("onmouseup", "return false; // Forbid drag-and-drop");
		sbSplitter.setAttribute("context", this.popupId);
		sbSplitter.addEventListener("contextmenu", this, true);
		var sbBox = this.sbBox;
		sbBox.parentNode.insertBefore(sbSplitter, sbBox);
		this.setSplitterWidth();
		window.addEventListener(this.sizeModeChangeEvent, this, false);
		if(this.hasRightSidebar) {
			if(this.isRightSidebar)
				this.moveSplitterToRight();
			this.addAttrMutationObservers(
				[sbSplitter], this.updateSplitterOrdinal, this,
				{ attributeFilter: ["ordinal"] }
			);
		}
	},
	destroySplitter: function() {
		window.removeEventListener(this.sizeModeChangeEvent, this, false);
		this.sbSplitter.removeEventListener("contextmenu", this, true);
		if(this.hasRightSidebar)
			this.removeAttrMutationObservers([this.sbSplitter]);
	},
	moveSplitterToRight: function() {
		this.sbSplitter.setAttribute("ordinal", 1000);
		this._log("moveSplitterToRight()");
	},
	updateSplitterOrdinal: function(mutation) {
		var sbSplitter = mutation.target;
		if("__sidebarsList_ignore" in sbSplitter || !this.isRightSidebar)
			return;
		sbSplitter.__sidebarsList_ignore = true;
		setTimeout(function() {
			delete sbSplitter.__sidebarsList_ignore;
		}, 0);
		this._log("updateSplitterOrdinal(): ordinal changed to " + sbSplitter.getAttribute("ordinal"));
		this.moveSplitterToRight();
	},
	tweakSidebarControls: function(n) {
		if(n == 1)
			n = undefined;
		var thr = this.$("sidebar" + (n ? "-" + n : "") + "-throbber");
		this.attribute(thr, "onclick", "sidebarsList.stopOrReloadSidebar(event" + (n ? ", " + n : "") + ");");
		this.property(thr, "tooltipText", this.getLocalized("stopOrReloadSidebar"));
		this.property(thr, "className", (thr.className + " sidebarsList-reload").replace(/^\s+/, ""));
		this.attribute(thr, "sidebarslist_style", this.get("reloadButtonStyle") || "auto");

		var closeBtn = thr.parentNode.lastChild;
		if(closeBtn && closeBtn.localName == "toolbarbutton" && !n) {
			this.attribute(closeBtn, "oncommand", "sidebarsList.closeSidebar(event);");
			this.attribute(closeBtn, "onclick", "if(event.button == 1) sidebarsList.closeSidebar(event);");
		}

		if(!n || n == 2) {
			var spl = this.$("sidebar" + (n ? "-" + n : "") + "-splitter");
			this.attribute(spl, "ondblclick", "sidebarsList.sidebarResizerDblClick(event" + (n ? ", " + n : "") + ");");
			if(!n)
				this.attribute(spl, "onclick", "if(event.button == 1) sidebarsList.closeSidebar();");
		}
	},

	property: function(node, prop, val) {
		this.saveOrig(node, prop, true);
		node[prop] = val;
	},
	attribute: function(node, attr, val) {
		this.saveOrig(node, attr, false);
		node.setAttribute(attr, val);
	},
	saveOrig: function(node, name, isProp) {
		var key = isProp ? "__sidebarsList_origProps" : "__sidebarsList_origAttrs";
		var o = node[key] || null;
		if(!o) {
			node.setAttribute("sidebarslist_tweaked", "true");
			o = node[key] = {
				restore: { __proto__: null },
				remove: [],
				__proto__: null
			};
		}
		if(isProp) {
			if(name in node)
				o.restore[name] = node[name];
			else
				o.remove.push(name);
		}
		else {
			if(node.hasAttribute(name))
				o.restore[name] = node.getAttribute(name);
			else
				o.remove.push(name);
		}
	},
	restoreOrig: function(node) {
		node.removeAttribute("sidebarslist_tweaked");
		if("__sidebarsList_origProps" in node) {
			var o = node.__sidebarsList_origProps;
			delete node.__sidebarsList_origProps;
			var restore = o.restore;
			for(var name in restore)
				node[name] = restore[name];
			o.remove.forEach(function(name) {
				delete node[name];
			});
		}
		if("__sidebarsList_origAttrs" in node) {
			var o = node.__sidebarsList_origAttrs;
			delete node.__sidebarsList_origAttrs;
			var restore = o.restore;
			for(var name in restore)
				node.setAttribute(name, restore[name]);
			o.remove.forEach(function(name) {
				// removeAttribute() doesn't remove already "used" handler in Firefox 20+
				node.setAttribute(name, "");
				node.removeAttribute(name);
			});
		}
	},
	cleanupNodes: function() {
		Array.prototype.slice.call(document.getElementsByAttribute("sidebarslist_tweaked", "true"))
			.forEach(this.restoreOrig);
	},

	updateControlsStyle: function() {
		var stl = this.get("reloadButtonStyle") || "auto";
		Array.prototype.forEach.call(
			document.getElementsByAttribute("sidebarslist_style", "*"),
			function(node) {
				node.setAttribute("sidebarslist_style", stl);
			}
		);
	},
	saveURI: function(uri, title) {
		if(uri && uri != "about:blank")
			this.set("lastURI", uri + (title == undefined ? "" : "\n" + title));
	},
	saveCurrentURI: function() {
		var sb = this.sb;
		var sbUri = sb.getAttribute("src");
		if(sbUri != "chrome://browser/content/web-panels.xul")
			this.saveURI(sbUri);
		else {
			var wpBrowser = sb.contentDocument.getElementById("web-panels-browser");
			if(wpBrowser) {
				var doc = wpBrowser.contentDocument;
				var lastURI = this.lastURI;
				var title = lastURI.isWeb ? lastURI.title : doc.title; // Preserve given bookmark name
				this.saveURI(doc.documentURI, title);
				wpBrowser.setAttribute("cachedurl", doc.documentURI);
			}
		}
	},
	get lastURI() {
		var data = (this.get("lastURI") || "").split("\n", 2);
		return {
			uri: data[0],
			title: data[1] || "",
			isWeb: data.length > 1
		};
	},
	get lastCommand() {
		var last = this.lastURI;
		if(last.isWeb)
			return "viewWebPanelsSidebar";
		var mi = last.uri && this.popup.getElementsByAttribute("sidebarurl", last.uri)[0];
		return mi ? mi.getAttribute("observes") : undefined;
	},
	smartToggleSidebar: function(e) {
		if(e && (e.button == 1 || e.button == 0 && e.ctrlKey)) // middle-click || ctrl+click
			this.toggleSidebar(this.get("middleClickSidebar"));
		else if(e && e.button == 2) // right-click
			return; // show context menu
		else {
			if(this.sbHidden) {
				var last = this.lastURI;
				if(last.isWeb)
					openWebPanel(last.title, last.uri);
				else {
					var mi = this.popup.getElementsByAttribute("sidebarurl", last.uri)[0];
					if(mi && "doCommand" in mi)
						mi.doCommand();
					else
						this.toggleSidebar(this.get("middleClickSidebar"));
				}
			}
			else {
				this.sidebar.hide();
			}
		}
	},
	toggleSidebar: function(commandId) {
		var special = commandId && commandId.charAt(0);
		if(special == "#") {
			commandId.substr(1).split(/\s*,\s*#/).some(function(id) {
				var node = this.$(id);
				node && node.doCommand();
				return node;
			}, this);
			return;
		}
		if(special == ">") {
			new Function(commandId.substr(1))();
			return;
		}
		this.sidebar.toggle(commandId);
	},
	closeSidebar: function(force) {
		if(this.sbHidden)
			return;
		if(force && typeof force == "object") {
			var e = force;
			force = e.ctrlKey || e.shiftKey || e.altKey || e.metaKey
				|| "button" in e && e.button == 1;
		}
		force && this.setCollapsableSidebar(false);
		this.sidebar.hide();
		force && this.setCollapsableSidebar();
	},
	get sidebar() {
		delete this.sidebar;
		return this.sidebar = "SidebarUI" in window // Firefox 38+
			? SidebarUI
			: {
				toggle: function(commandId) {
					toggleSidebar(commandId);
				},
				show: function(commandId) {
					toggleSidebar(commandId, true);
				},
				hide: function() {
					toggleSidebar();
				}
			};
	},
	sidebarResizerDblClick: function(e, n) {
		if(e.button == 1)
			return;
		var w = this.get(e.button == 0 ? "sidebarWidthDefault" : "sidebarWidthAlt");
		this.setSidebarWidth(w, n);
	},
	setSidebarWidth: function(w, n) {
		if(w <= 0)
			return;
		var minW = 20;
		var maxW = document.documentElement.boxObject.width;
		var edge = Math.max(10, Math.min(100, Math.round(maxW*0.2)));
		maxW -= edge;
		if(maxW < minW)
			return;
		w = Math.max(minW, Math.min(maxW, w));

		var sbBox = this.getSbBox(n);
		sbBox.setAttribute("width", w);
	},
	updTitle: function(mutation) {
		//if(mutation.attributeName == "value")
		this._updTitle(mutation.target);
	},
	updTitleLegacy: function(e) {
		if(e.attrName == "value")
			this._updTitle(e.originalTarget);
	},
	_updTitle: function(lbl) {
		if("__sidebarsList_tbb" in lbl)
			lbl.__sidebarsList_tbb.setAttribute("label", lbl.value);
	},
	disableChecked: function(mutation) {
		//if(mutation.attributeName != "checked")
		//	return;
		var tar = mutation.target;
		this.disableNode(tar, tar.getAttribute("checked") == "true");
	},
	get disableCheckedLegacy() {
		var _this = this;
		delete this.disableCheckedLegacy;
		return this.disableCheckedLegacy = function() {
			return _this._disableCheckedLegacy.apply(_this, arguments);
		};
	},
	_disableCheckedLegacy: function(e) {
		if(e.attrName == "checked")
			this.disableNode(e.target, e.newValue == "true");
	},
	disableNode: function(node, dis) {
		if(
			dis && (
				!node.hasAttribute("sidebarslist_notstd")
				|| this.get("disableOpened.notStandard")
			)
		) {
			node.setAttribute("disabled", "true");
			node.setAttribute("sidebarslist_disabled", "true");
		}
		else {
			node.removeAttribute("disabled");
			node.removeAttribute("sidebarslist_disabled");
		}
	},
	_allowScroll: 0,
	scrollList: function(e) {
		var now = Date.now();
		if(now < this._allowScroll)
			return;
		this._allowScroll = now + 100;

		var curTrg = e.currentTarget;
		if(curTrg.parentNode.localName == "toolbarbutton")
			return; // Button has own wheel event listener!

		var mp = this.popup;
		var next = "deltaY" in e
			? e.deltaY > 0 // wheel
			: e.detail > 0; // DOMMouseScroll
		var chs = mp.getElementsByAttribute("checked", "true");

		var selectiveScroll = this.multiSb && curTrg.localName == "toolbarbutton";

		var curItem, newItem;
		if(selectiveScroll) {
			var sbNum = curTrg.__sidebarsList_multiNum;
			for(var i = 0, chLen = chs.length; i < chLen; ++i) {
				curItem = chs[i];
				if(this.multiSbNum(curItem) == sbNum)
					break;
			}
			if(!curItem) {
				var inv = curTrg.firstChild.getElementsByAttribute("sidebarslist_notstd", "true");
				curItem = next ? inv[inv.length - 1] : inv[0];
			}
			newItem = this.getNext(curItem, mp, next);
			while(newItem != curItem && this.multiSbNum(newItem) != this.multiSbNum(curItem))
				newItem = this.getNext(newItem, mp, next);
			if(newItem == curItem)
				return;
		}
		else {
			curItem = chs[0];
			newItem = this.getNext(curItem, mp, next);
		}
		if(this.multiSb && !selectiveScroll) {
			for(var i = chs.length - 1; i >= 0; --i) { // For MultiSidebar
				var ch = chs[i];
				if("doCommand" in ch)
					ch.doCommand();
			}
		}
		newItem.doCommand();
	},
	getNext: function _gn(mi, mp, next) {
		var nMi = next
			? mi && mi.nextSibling || mp.firstChild
			: mi && mi.previousSibling || mp.lastChild;
		while(nMi != mi && this.notStdSbItem(nMi))
			nMi = _gn.call(this, nMi, mp, next);
		return nMi;
	},
	multiSbNum: function(mi) {
		return this.getMultiPos(mi.getAttribute("observes"));
	},
	getMultiPos: function(cmd) {
		return this.getPref("extensions.multisidebar." + cmd)
			|| this.getPref("extensions.multisidebar.defaultPosition");
	},
	highlightFeatures: function(mp) {
		var multiSb = this.multiSb;
		if(multiSb) {
			var trigger = mp.parentNode.localName == "toolbarbutton"
				? mp.parentNode
				: mp.triggerNode || document.popupNode;
			if(!trigger || trigger.localName != "toolbarbutton")
				multiSb = false;
			else
				var n = trigger.__sidebarsList_multiNum;
		}
		Array.prototype.forEach.call(
			mp.getElementsByTagName("menuitem"),
			function(mi) {
				if(mi.id && mi.id.indexOf("sidebarsList-") == 0)
					return;
				if(multiSb)
					mi.setAttribute("sidebarslist_currentpos", this.multiSbNum(mi) == n);
				else
					mi.removeAttribute("sidebarslist_currentpos");
				if(this.notStdSbItem(mi))
					mi.setAttribute("sidebarslist_notstd", "true");
				else
					mi.removeAttribute("sidebarslist_notstd");
			},
			this
		);
	},
	notStdSbItem: function(mi) {
		// Fix for non-standard sidebars
		// e.g. from MR Tech Toolkit https://addons.mozilla.org/firefox/addon/421
		return !mi.hasAttribute("observes") || !mi.hasAttribute("sidebarurl");
	},
	stopOrReloadSidebar: function(e, n) {
		if(e.button == 2)
			this.stopSidebar(n);
		else
			this.reloadSidebar(e.ctrlKey || e.shiftKey || e.altKey || e.metaKey || e.button == 1, n);
	},
	reloadSidebar: function(skipCache, n) {
		var br = this.getSb(n);
		if(skipCache)
			br.reloadWithFlags(nsIWebNavigation.LOAD_FLAGS_BYPASS_PROXY | nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE);
		else
			br.reload();
	},
	stopSidebar: function(n) {
		var br = this.getSb(n);
		br.stop();
	},

	get prefSvc() {
		delete this.prefSvc;
		return this.prefSvc = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.QueryInterface(Components.interfaces.nsIPrefBranch2 || Components.interfaces.nsIPrefBranch);
	},
	prefsMigration: function(v) {
		if(v < 1) { //= Added: 2012-08-27
			var lastURI = this.getPref(this.prefNS + "lastURI") || ""; // this.get() uses cache!
			if(/^web-panel: (.+?)(?: @web-panel-title: (.*))?$/.test(lastURI))
				this.saveURI(unescape(RegExp.$1), unescape(RegExp.$2 || ""));
			else
				this.saveURI(unescape(lastURI));
		}
		if(v < 2) { //= Added: 2013-12-30
			this.set("splitterWidthFullScreen", this.get("splitterWidthMaximizedWindow"));
		}
		if(v < 3) { //= Added: 2015-01-03
			var pName = this.prefNS + "defaultSidebarWidth";
			if(this.prefSvc.prefHasUserValue(pName)) {
				this.set("sidebarWidthDefault", this.getPref(pName));
				this.prefSvc.clearUserPref(pName);
			}
		}
		this.set("prefsVersion", this.prefVer);
		setTimeout(function(_this) {
			_this.prefSvc.savePrefFile(null);
		}, 0, this);
	},
	// Preferences observer:
	observe: function(subject, topic, pName) {
		if(topic != "nsPref:changed")
			return;
		var shortName = pName.substr(this.prefNS.length);
		var val = this._prefs[shortName] = this.getPref(pName);
		this.prefsChanged(shortName, val);
	},
	_prefs: { __proto__: null }, // Prefs cache
	get: function(pName, defaultVal) {
		var cache = this._prefs;
		return pName in cache
			? cache[pName]
			: (cache[pName] = this.getPref(this.prefNS + pName, defaultVal));
	},
	set: function(pName, val) {
		return this.setPref(this.prefNS + pName, val);
	},
	getPref: function(pName, defaultVal, prefBranch) {
		var ps = prefBranch || this.prefSvc;
		switch(ps.getPrefType(pName)) {
			case ps.PREF_BOOL:   return ps.getBoolPref(pName);
			case ps.PREF_INT:    return ps.getIntPref(pName);
			case ps.PREF_STRING: return ps.getComplexValue(pName, Components.interfaces.nsISupportsString).data;
		}
		return defaultVal;
	},
	setPref: function(pName, val, prefBranch) {
		var ps = prefBranch || this.prefSvc;
		var pType = ps.getPrefType(pName);
		if(pType == ps.PREF_INVALID)
			pType = this.getValueType(val);
		switch(pType) {
			case ps.PREF_BOOL:   ps.setBoolPref(pName, val); break;
			case ps.PREF_INT:    ps.setIntPref(pName, val);  break;
			case ps.PREF_STRING:
				var ss = Components.interfaces.nsISupportsString;
				var str = Components.classes["@mozilla.org/supports-string;1"]
					.createInstance(ss);
				str.data = val;
				ps.setComplexValue(pName, ss, str);
		}
	},
	getValueType: function(val) {
		switch(typeof val) {
			case "boolean": return this.prefSvc.PREF_BOOL;
			case "number":  return this.prefSvc.PREF_INT;
		}
		return this.prefSvc.PREF_STRING;
	},

	initContext: function() {
		var mn = this.currentSbNum = this.multiNum;
		var sb = this.currentSb = this.getSb(mn);
		sb.addEventListener("load", this.setContextCommands, true);
		//gBrowser.addEventListener("load", this.setContextCommands, true);
		gBrowser.addProgressListener(this.progressListener);
		this.setContextCommands();
	},
	destroyContext: function() {
		this.currentSb.removeEventListener("load", this.setContextCommands, true);
		//gBrowser.removeEventListener("load", this.setContextCommands, true);
		gBrowser.removeProgressListener(this.progressListener);
		this.currentSb = null;
		this.currentSbNum = null;
	},
	get progressListener() {
		var dummy = function() {};
		delete this.progressListener;
		return this.progressListener = {
			context: this,
			onStateChange: dummy,
			onProgressChange: dummy,
			onLocationChange: function(webProgress, request, location) {
				this.context.setContextCommands();
			},
			onStatusChange: dummy,
			onSecurityChange: dummy
		};
	},
	get setContextCommands() {
		var _this = this;
		delete this.setContextCommands;
		return this.setContextCommands = function() {
			return _this._setContextCommands.apply(_this, arguments);
		};
	},
	_setContextCommands: function() {
		var sbData = this.getSbData();
		var tabData = {
			uri:   this.currentURL,
			title: this.currentTitle
		};
		this.setItems(this.sb2c, sbData, tabData);
		this.setItems(this.c2sb, tabData, sbData);
	},
	setItems: function(baseItem, newData, curData) {
		Array.prototype.forEach.call(
			document.getElementsByClassName(baseItem.id),
			function(it) {
				this.setItem(it, newData, curData);
			},
			this
		);
	},
	setItem: function(it, newData, curData) {
		var isBlank = this.isBlankPageURL(newData.uri);
		if(isBlank || !newData.uri || newData.uri == curData.uri)
			it.setAttribute("disabled", "true");
		else
			it.removeAttribute("disabled");
		it.tooltipText = isBlank
			? ""
			: newData.title && newData.title != newData.uri
				? newData.title + " \n" + this.decodeURI(newData.uri)
				: this.decodeURI(newData.uri);
	},
	isBlankPageURL: function(uri) {
		if("isBlankPageURL" in window)
			return isBlankPageURL(uri);
		return uri == "about:blank";
	},
	decodeURI: function(uri) {
		if(!this.get("decodeURIs"))
			return uri;
		if(uri && "losslessDecodeURI" in window) try {
			return losslessDecodeURI(makeURI(uri));
		}
		catch(e) {
			Components.utils.reportError(e);
		}
		return uri;
	},

	get multiNum() {
		var pn = this.popup.triggerNode || document.popupNode;
		return pn && pn.localName == "toolbarbutton" && "__sidebarsList_multiNum" in pn
			? pn.__sidebarsList_multiNum
			: null;
	},
	getSbURI: function(getFullData) {
		var sb = this.currentSb || this.getSb(this.multiNum);
		var sbUri = sb.getAttribute("src");
		if(sbUri == "chrome://browser/content/web-panels.xul") {
			var wpBrowser = sb.contentDocument.getElementById("web-panels-browser");
			sbUri = wpBrowser ? wpBrowser.contentDocument.documentURI : "";
		}
		if(getFullData) {
			var label = this.getOrigTitle(this.multiNum);
			var ttl = label && label.value || "";
			if(!ttl) { // No title in collapsed sidebar
				if(wpBrowser)
					ttl = this.lastURI.title;
				else {
					var mis = this.popup.getElementsByAttribute("sidebarurl", sbUri);
					if(mis.length)
						ttl = mis[0].getAttribute("label");
				}
			}
			return {
				uri: sbUri,
				title: ttl
			};
		}
		return sbUri;
	},
	getSbData: function() {
		return this.getSbURI(true);
	},

	contentToSidebar: function(e) {
		if(this.handleClickEvent(e))
			return;
		var _click = e && e.type == "click";
		var url = this.currentURL;
		var mis = this.popup.getElementsByAttribute("sidebarurl", url);
		if(mis.length) {
			var mi = mis[0];
			this.setTargetSidebar(mi.getAttribute("observes"));
			mi.doCommand();
		}
		else {
			this.setTargetSidebar("viewWebPanelsSidebar");
			openWebPanel(this.currentTitle || url, url);
		}
		var move = this.get("openTabInSidebarClosesTab");
		if(
			e && (
				_click && (
					e.button == 1
					|| e.button == 2 && this.get("openTabInSidebarClosesTab.rightClickToInvert")
				)
				|| e.ctrlKey || e.shiftKey || e.altKey || e.metaKey
			)
		)
			move = !move;
		if(move) {
			var tab = gBrowser.selectedTab;
			var removeTab = function(tab) {
				var tabs = gBrowser.visibleTabs || gBrowser.tabs;
				if(tabs.length <= 1)
					gBrowser.selectedTab = gBrowser.addTab("about:blank", { skipAnimation: true });
				gBrowser.removeTab(tab);
			};
			if(
				"_swapBrowserDocShells" in gBrowser
				&& this.get("openTabInSidebarClosesTab.useMove")
			) {
				if("_blurTab" in gBrowser) {
					gBrowser._blurTab(tab);
					tab.collapsed = true;
				}
				var sb = this.currentSb;
				(function swapBrowsers(loadEvent) {
					var wpBrowser = sb.contentDocument
						&& sb.contentDocument.getElementById("web-panels-browser");
					if(loadEvent)
						sb.removeEventListener("load", swapBrowsers, true);
					else if(!wpBrowser) {
						sb.addEventListener("load", swapBrowsers, true);
						return;
					}
					// src of #web-panels-browser not yet changed, wait
					setTimeout(function() {
						try {
							wpBrowser.stop();
							// Note: can only swap docshells between browsers in the same process
							gBrowser._swapBrowserDocShells(tab, wpBrowser);
						}
						catch(e) {
							Components.utils.reportError(e);
							wpBrowser.loadURI(url); // Fallback
						}
						removeTab(tab);
					}, 0);
				})();
			}
			else {
				removeTab(tab);
			}
		}
		if(_click && this.get("closeSidebarsMenu"))
			this.closeMenus(e ? e.target : this.popup);
	},
	setTargetSidebar: function(cmd) {
		if(!cmd || !this.multiSb)
			return;
		var origPos = this.getMultiPos(cmd);
		if(origPos == this.currentSbNum)
			return;
		var pref = "extensions.multisidebar." + cmd;
		this.setPref(pref, this.currentSbNum);
	},
	sidebarToContent: function(e) {
		if(this.handleClickEvent(e))
			return;
		var _click = e && e.type == "click";
		var _cmd   = e && e.type == "command";
		var sbUri = this.getSbURI();
		if(!sbUri)
			return;
		if(_cmd && (e.ctrlKey || e.metaKey || e.altKey) || _click) {
			var inBg = this.getPref("browser.tabs.loadInBackground");
			var tab = gBrowser.addTab(sbUri);
			if(_click && e.button == 2 ? !inBg : inBg)
				gBrowser.selectedTab = tab;
		}
		else if(_cmd && e.shiftKey) {
			window.openDialog(
				getBrowserURL(),
				"_blank",
				"chrome,all,dialog=no",
				sbUri, null, null, null, false
			);
		}
		else {
			gBrowser.loadURI(sbUri);
		}
		if(_click && this.get("closeSidebarsMenu"))
			this.closeMenus(e ? e.target : this.popup);
	},
	handleClickEvent: function(e) {
		// Use "command" event for left-click (and for keyboard) and "click" otherwise
		if(e && e.type == "click") {
			if(e.target.getAttribute("disabled") == "true")
				return true;
			var btn = e.button;
			if(btn == 0)
				return true; // ignore "click" event (and use "command")
			if(btn == 2)
				e.preventDefault(); // should stop "command" event
		}
		return false;
	},
	selectSidebar: function() {
		var popup = this.popup;
		var spl = this.sbSplitter;
		this.ensurePopupPosition();
		document.popupNode = spl;
		popup.openPopup(spl, this.isRightSidebar ? "start_before" : "end_before", false);
		// Select first menuitem
		// Unfortunately ordinal popup doesn't have nsIMenuBoxObject interface with activeChild field
		setTimeout(function() {
			keyDown();
			if(popup.firstChild.disabled)
				keyDown();
		}, 0);
		function keyDown() {
			var keyCode = KeyboardEvent.DOM_VK_DOWN;
			key("keydown",  keyCode);
			key("keypress", keyCode);
			key("keyup",    keyCode);
		}
		function key(type, code) {
			var evt = document.createEvent("KeyboardEvent");
			evt.initKeyEvent(
				type, true /*bubbles*/, true /*cancelable*/, window,
				false /*ctrlKey*/, false /*altKey*/, false /*shiftKey*/, false /*metaKey*/,
				code /*keyCode*/, 0 /*charCode*/
			);
			popup.dispatchEvent(evt);
		}
	},
	closeMenus: function(node) {
		// Based on function closeMenus() from chrome://browser/content/utilityOverlay.js
		for(; node && "localName" in node; node = node.parentNode) {
			var ln = node.localName;
			if(
				node.namespaceURI == "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
				&& (ln == "menupopup" || ln == "popup" || ln == "panel")
			)
				node.hidePopup();
		}
	},

	get stringBundle() {
		delete this.stringBundle;
		return this.stringBundle = Components.classes["@mozilla.org/intl/stringbundle;1"]
			.getService(Components.interfaces.nsIStringBundleService)
			.createBundle("chrome://sidebarslist/locale/sbl.properties");
	},
	getLocalized: function(strId) {
		try {
			return this.stringBundle.GetStringFromName(strId);
		}
		catch(e) {
			Components.utils.reportError(e);
		}
		return strId;
	},

	// Hotkeys:
	keys: {
		toggleSidebar:          "sidebarsList.smartToggleSidebar();",
		selectSidebar:          "sidebarsList.selectSidebar();",
		contentToSidebar:       "sidebarsList.contentToSidebar();",
		sidebarToContent:       "sidebarsList.sidebarToContent();",
		reloadSidebar:          "sidebarsList.reloadSidebar();",
		reloadSidebarSkipCache: "sidebarsList.reloadSidebar(true);",
		stopSidebar:            "sidebarsList.stopSidebar();",
		__proto__: null
	},
	registerHotkeys: function() {
		var keys = this.keys;
		var keyset = this.$("mainKeyset");
		var df = document.createDocumentFragment();
		for(var kId in keys) {
			var keyElt = document.createElement("key");
			keyElt.id = "sidebarsList-key-" + kId;
			keyElt.setAttribute("oncommand", keys[kId]);
			var keyStr = this.get("key." + kId);
			if(!keyStr) // Attribute key="key-node-id" is buggy, if one of key nodes isn't exist
				keyElt.setAttribute("disabled", "true");
			else {
				var tokens = keyStr.split(" ");
				var key = tokens.pop() || " ";
				var modifiers = tokens.join(",");
				keyElt.setAttribute(key.indexOf("VK_") == 0 ? "keycode" : "key", key);
				keyElt.setAttribute("modifiers", modifiers);
			}
			df.appendChild(keyElt);
		}
		keyset.appendChild(df);
	},

	_log: function(s) {
		if(!this.get("debug"))
			return;
		var cs = Components.classes["@mozilla.org/consoleservice;1"]
			.getService(Components.interfaces.nsIConsoleService);
		var ts = function() {
			var d = new Date();
			var ms = d.getMilliseconds();
			return d.toTimeString().replace(/^.*\d+:(\d+:\d+).*$/, "$1") + ":" + "000".substr(("" + ms).length) + ms + " ";
		};
		this._log = function(s) {
			if(this.get("debug"))
				cs.logStringMessage("[Sidebars List] " + ts() + s);
		};
		this._log(s);
	}
};