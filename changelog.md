#### Sidebars List: Changelog

`+` - added<br>
`-` - deleted<br>
`x` - fixed<br>
`*` - improved<br>

##### master/HEAD
`*` Now used hardcoded splitter width limit to improve startup performance.<br>
`x` Correctly restore sidebar width limits on extension disabling/uninstalling.<br>
`+` Added ability to zoom web page in sidebar (known limitation: doesn't work for Ctrl+mouse wheel) (<a href="https://github.com/Infocatcher/Sidebars_List/issues/1">#1</a>).<br>
`*` Don't use <a href="https://developer.mozilla.org/en-US/docs/Extensions/Updating_extensions_for_Firefox_4#XPI_unpacking">internal *.jar archive</a> anymore (this should also improve performance on Firefox 4+).<br>
`+` Added option to move tab to sidebar (<a href="https://github.com/Infocatcher/Sidebars_List/issues/2">#2</a>).<br>
`x` Correctly apply small splitter width on Linux (<a href="https://github.com/Infocatcher/Sidebars_List/issues/3">#3</a>).<br>
`*` Wrap bult-in function after small delay for better compatibility with other extensions (this also slightly improves startup performance).<br>
`x` Correctly detect full screen mode in Firefox 3.6 and older.<br>
`x` Correctly hide sidebar splitter, if active full screen web application (<em>extensions.sidebarslist.splitterWidthFullScreenDOM</em> preference) (<a href="https://github.com/Infocatcher/Sidebars_List/issues/4">#4</a>).<br>
`+` Added separate preference for splitter width in full screen mode (F11) (<a href="https://github.com/Infocatcher/Sidebars_List/issues/5">#5</a>).<br>

##### 0.1.1 (2013-01-03)
`-` Removed debug logs.<br>
`+` Added UI for some preferences.<br>

##### 0.1.0 (2013-01-03)
`*` Published on <a href="https://addons.mozilla.org/">AMO</a>.<br>

##### Older versions
<a title="Available only in Russian, sorry" href="https://translate.google.com/translate?sl=ru&tl=en&u=http%3A%2F%2Finfocatcher.ucoz.net%2Fext%2Ffx%2Fsidebars_list%2Fchangelog.txt">changelog.txt</a>