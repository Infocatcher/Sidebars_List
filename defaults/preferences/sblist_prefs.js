pref("extensions.sidebarslist.middleClickSidebar", "viewHistorySidebar");
// You can use:
//   viewBookmarksSidebar - value of the "observes" attribute (use DOM Inspector to get it)
//   #idOfNode            - will be called document.getElementById("idOfNode").doCommand()
//   #id1, #id2, ...      - will be called doCommand() for first existing node
//   >anyJavaScriptStatement();
pref("extensions.sidebarslist.disableOpened", true);
pref("extensions.sidebarslist.disableOpened.notStandard", false);
pref("extensions.sidebarslist.splitterWidth", 8);
pref("extensions.sidebarslist.splitterWidthMaximizedWindow", 4);
pref("extensions.sidebarslist.splitterWidthFullScreen", 4); // F11
pref("extensions.sidebarslist.splitterWidthFullScreenDOM", 0); // Some web application
pref("extensions.sidebarslist.defaultSidebarWidth", 240); // Double click on splitter/resizer to set this width
pref("extensions.sidebarslist.altSidebarWidth", 480); // Right-double click on splitter/resizer to set this width
pref("extensions.sidebarslist.collapseSidebar", false); // Don't close sidebar: show the same state after reopen
pref("extensions.sidebarslist.collapseSidebar.clearBeforeSwitch", true);
// Don't show previous collapsed content, if opened another sidebar
pref("extensions.sidebarslist.removeWidthLimits", true);
pref("extensions.sidebarslist.fixSidebarZoom", true);
pref("extensions.sidebarslist.closeSidebarsMenu", true);
pref("extensions.sidebarslist.openTabInSidebarClosesTab", false);
pref("extensions.sidebarslist.openTabInSidebarClosesTab.useMove", true); // Preserve page state
pref("extensions.sidebarslist.openTabInSidebarClosesTab.rightClickToInvert", false);
pref("extensions.sidebarslist.reloadButtonStyle", "auto");
// See styles for [sidebarslist_style="..."] in chrome://sidebarslist/content/sidebarslist.css
pref("extensions.sidebarslist.decodeURIs", true);
pref("extensions.sidebarslist.lastURI", "");

// See https://developer.mozilla.org/en-US/docs/XUL/Tutorial/Keyboard_Shortcuts
// Syntax: [<modifiers> ]<key or keycode>
pref("extensions.sidebarslist.key.toggleSidebar", "VK_F4");
pref("extensions.sidebarslist.key.selectSidebar", "control shift VK_F4");
pref("extensions.sidebarslist.key.contentToSidebar", "control alt VK_LEFT");
pref("extensions.sidebarslist.key.sidebarToContent", "control alt VK_RIGHT");
pref("extensions.sidebarslist.key.reloadSidebar", "");
pref("extensions.sidebarslist.key.reloadSidebarSkipCache", "");
pref("extensions.sidebarslist.key.stopSidebar", "");

pref("extensions.sidebarslist.prefsVersion", 0);

pref("extensions.sidebarslist.debug", false);