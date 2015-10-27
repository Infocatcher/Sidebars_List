#### Sidebars List: Changelog

`+` - added<br>
`-` - deleted<br>
`x` - fixed<br>
`*` - improved<br>

##### master/HEAD
##### 0.2.3 (2015-10-27)
`x` Correctly decode URLs in tooltip for “Open … in …” menu items in Firefox 40+.<br>
`x` Fixed detection of full screen web applications in Firefox 41+ (<a href="https://github.com/Infocatcher/Sidebars_List/issues/12">#12</a>).<br>

##### 0.2.2 (2015-05-17)
`x` Fixed compatibility with Electrolysis aka e10s (multi-process mode) (<a href="https://github.com/Infocatcher/Sidebars_List/issues/8">#8</a>).<br>
`x` Hide useless second separator, if there is no third-party sidebar extensions.<br>
`*` Updated icons for “Open Tab in Sidebar” and “Open Sidebar in Tab” menu items.<br>
`*` Decode URLs in tooltip for “Open … in …” menu items (<em>extensions.sidebarslist.decodeURIs</em> preference).<br>
`+` Right-double click on sidebar splitter/resizer to set alternative width (<em>extensions.sidebarslist.sidebarWidthAlt</em> preference).<br>
`*` Simplified code around initialization.<br>
`x` Fixed compatibility with Firefox 38+ (<a href="https://github.com/Infocatcher/Sidebars_List/issues/10">#10</a>).<br>

##### 0.2.1 (2014-05-21)
`*` Improved support for built-in “Sidebars” button in Firefox 30+ (<a href="https://github.com/Infocatcher/Sidebars_List/issues/7">#7</a>).<br>
`*` Also show sidebar/page title (in addition to URL) in tooltip for “Open … in …” menu items.<br>

##### 0.2.0 (2014-03-04)
`*` Now used hardcoded splitter width limit to improve startup performance.<br>
`x` Correctly restore sidebar width limits on extension disabling/uninstalling.<br>
`+` Added ability to zoom web page in sidebar (known limitation: doesn't work for Ctrl+mouse wheel) (<a href="https://github.com/Infocatcher/Sidebars_List/issues/1">#1</a>).<br>
`*` Don't use <a href="https://developer.mozilla.org/en-US/docs/Extensions/Updating_extensions_for_Firefox_4#XPI_unpacking">internal \*.jar archive</a> anymore (this should also improve performance on Firefox 4+).<br>
`+` Added option to move tab to sidebar (hidden preferences: <em>extensions.sidebarslist.openTabInSidebarClosesTab.useMove</em> to preserve page state and <em>extensions.sidebarslist.openTabInSidebarClosesTab.rightClickToInvert</em> to invert move/open behavior using right-click) (<a href="https://github.com/Infocatcher/Sidebars_List/issues/2">#2</a>).<br>
`x` Correctly apply small splitter width on Linux (<a href="https://github.com/Infocatcher/Sidebars_List/issues/3">#3</a>).<br>
`*` Wrap built-in functions after small delay for better compatibility with other extensions (this also slightly improves startup performance).<br>
`x` Correctly detect full screen mode in Firefox 3.6 and older.<br>
`x` Correctly hide sidebar splitter, if active full screen web application (<em>extensions.sidebarslist.splitterWidthFullScreenDOM</em> preference) (<a href="https://github.com/Infocatcher/Sidebars_List/issues/4">#4</a>).<br>
`+` Added separate preference for splitter width in full screen mode (F11) (<a href="https://github.com/Infocatcher/Sidebars_List/issues/5">#5</a>).<br>
`x` Fix invalid `sidebarcommand` attribute to correctly close sidebar, if something went wrong (<a href="https://github.com/Infocatcher/Sidebars_List/issues/6">#6</a>).<br>
`*` Optimized: update splitter width and visibility only if needed.<br>
`*` Hide previous contents in collapsed sidebar before opening of another sidebar (<em>extensions.sidebarslist.collapseSidebar.clearBeforeSwitch</em> preference).<br>
`x` Correctly select first menu item, if sidebars menu was opened from keyboard (Ctrl+Shift+F4 by default) in Firefox 25+.<br>
`+` Added: middle-click on sidebar resizer to close sidebar.<br>
`x` Fixed compatibility with <a href="https://addons.mozilla.org/addon/sidebar-auto-showhide/">Sidebar Auto Show/Hide</a> extension, if checked “collapse sidebar” option.<br>

##### 0.1.1 (2013-01-03)
`-` Removed debug logs.<br>
`+` Added UI for some preferences.<br>

##### 0.1.0 (2013-01-03)
`*` Published on <a href="https://addons.mozilla.org/">AMO</a>.<br>

##### Older versions
<a title="Available only in Russian, sorry" href="https://translate.google.com/translate?sl=ru&tl=en&u=http%3A%2F%2Finfocatcher.ucoz.net%2Fext%2Ffx%2Fsidebars_list%2Fchangelog.txt">changelog.txt</a>