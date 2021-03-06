﻿#### Sidebars List: История изменений

`+` - добавлено<br>
`-` - удалено<br>
`x` - исправлено<br>
`*` - улучшено<br>

##### master/HEAD
`*` Улучшена совместимость с Pale Moon и Basilisk.<br>

##### 0.2.5 (2017-07-03)
`x` Исправлена совместимость с будущими версиями Firefox: прекращено использование `Date.prototype.toLocaleFormat()` в отладочных логах (<em>extensions.sidebarslist.debug</em> = true) (<a href="https://bugzilla.mozilla.org/show_bug.cgi?id=818634">bug 818634</a>).<br>
`x` Исправлена совместимость с Firefox 55+ (поддержка нового переключателя боковых панелей и команды «Переместить боковую панель вправо») (<a href="https://github.com/Infocatcher/Sidebars_List/issues/14">#14</a>).<br>
`+` Добавлен интерфейс для изменения настройки <em>extensions.sidebarslist.reloadButtonStyle</em>.<br>

##### 0.2.4 (2017-02-12)
`x` Исправлена совместимость с Electrolysis aka e10s (мультипроцессный режим) в Firefox 47+ (unsafe CPOW usage).<br>
`x` Исправлена совместимость с будущими версиями Firefox: прекращено использование Array generics вида `Array.forEach()` (<a href="https://bugzilla.mozilla.org/show_bug.cgi?id=1222547">bug 1222547</a>).<br>
`x` Исправлена инициализация боковой панели в случае медленного восстановления открытой панели при запуске (настройка <em>extensions.sidebarslist.ensureSidebarRestoredDelay</em>).<br>

##### 0.2.3 (2015-10-27)
`x` Исправлено декодирование адресов во всплывающей подсказке для пунктов меню «Открыть … в …» в Firefox 40+.<br>
`x` Исправлено определение полноэкранных веб-приложений Firefox 41+ (<a href="https://github.com/Infocatcher/Sidebars_List/issues/12">#12</a>).<br>

##### 0.2.2 (2015-05-17)
`x` Исправлена совместимость с Electrolysis aka e10s (мультипроцессный режим) (<a href="https://github.com/Infocatcher/Sidebars_List/issues/8">#8</a>).<br>
`x` Добавлено скрытие бесполезного второго разделителя, если не установлено ни одного расширения с боковыми панелями.<br>
`*` Обновлены иконки для пунктов меню «Открыть вкладку в боковой панели» и «Открыть боковую панель во вкладке».<br>
`*` Добавлено декодирование адресов во всплывающей подсказке для пунктов меню «Открыть … в …» (настройка <em>extensions.sidebarslist.decodeURIs</em>).<br>
`+` Двойной клик правой кнопкой мыши по разделителю боковой панели устанавливает альтернативную ширину (настройка <em>extensions.sidebarslist.sidebarWidthAlt</em>).<br>
`*` Упрощен код инициализации.<br>
`x` Исправлена совместимость с Firefox 38+ (<a href="https://github.com/Infocatcher/Sidebars_List/issues/10">#10</a>).<br>

##### 0.2.1 (2014-05-21)
`*` Улучшена поддержка встроенной кнопки «Боковые панели» в Firefox 30+ (<a href="https://github.com/Infocatcher/Sidebars_List/issues/7">#7</a>).<br>
`*` Добавлено отображение заголовка боковой панели/страницы (в дополнение к адресу) во всплывающей подсказке для пунктов меню «Открыть … в …».<br>

##### 0.2.0 (2014-03-04)
`*` Теперь используется фиксированное ограничение для ширины переключателя боковых панелей для улучшения производительности при запуске.<br>
`x` Добавлено восстановление ограничений ширины боковой панели при отключении/удалении расширения.<br>
`+` Добавлена возможность изменения масштаба веб-страницы в боковой панели (известное ограничение: не работает для Ctrl+вращение колесика мышки) (<a href="https://github.com/Infocatcher/Sidebars_List/issues/1">#1</a>).<br>
`*` Больше не используется упаковка во <a href="https://developer.mozilla.org/en-US/docs/Extensions/Updating_extensions_for_Firefox_4#XPI_unpacking">внутренний \*.jar архив</a> (это также должно улучшить производительность в Firefox 4+).<br>
`+` Добавлена настройка для перемещения вкладки в боковую панель (скрытые настройки: <em>extensions.sidebarslist.openTabInSidebarClosesTab.useMove</em> для сохранения состояния страницы и <em>extensions.sidebarslist.openTabInSidebarClosesTab.rightClickToInvert</em> для инвертирования открытия/перемещения по клику правой кнопкой мыши) (<a href="https://github.com/Infocatcher/Sidebars_List/issues/2">#2</a>).<br>
`x` Исправлено применение маленькой ширины переключателя боковых панелей в Linux (<a href="https://github.com/Infocatcher/Sidebars_List/issues/3">#3</a>).<br>
`*` Обертки для встроенных функций добавляются после небольшой задержки для улучшения совместимости с другими расширениями (это также должно немного улучшить производительность при запуске).<br>
`x` Исправлено определение полноэкранного режима в Firefox 3.6 и более старых версиях.<br>
`x` Добавлено скрытие переключателя боковых панелей, если активно полноэкранное веб-приложение (настройка <em>extensions.sidebarslist.splitterWidthFullScreenDOM</em>) (<a href="https://github.com/Infocatcher/Sidebars_List/issues/4">#4</a>).<br>
`+` Добавлена отдельная настройка для ширины переключателя боковых панелей в полноэкранном режиме (F11) (<a href="https://github.com/Infocatcher/Sidebars_List/issues/5">#5</a>).<br>
`x` Добавлено исправление атрибута `sidebarcommand` для корректного закрытия боковой панели, если что-то пошло не так (<a href="https://github.com/Infocatcher/Sidebars_List/issues/6">#6</a>).<br>
`*` Оптимизировано: ширина и видимость переключателя боковых панелей теперь обновляется только если это действительно требуется.<br>
`*` Добавлено скрытие предыдущего содержимого в свернутой панели перед открытием другой боковой панели (настройка <em>extensions.sidebarslist.collapseSidebar.clearBeforeSwitch</em>).<br>
`x` Исправлен автоматический выбор первого пункта, если меню боковых панелей было открыто с помощью клавиатуры (по умолчанию Ctrl+Shift+F4) в Firefox 25+.<br>
`+` Добавлено закрытие боковой панели при клике средней кнопкой мыши по ограничителю ширины.<br>
`x` Исправлена совместимость с расширением <a href="https://addons.mozilla.org/addon/sidebar-auto-showhide/">Sidebar Auto Show/Hide</a> при включенном сворачивании боковой панели.<br>

##### 0.1.1 (2013-01-03)
`-` Удален вывод отладочных сообщений в консоль ошибок.<br>
`+` Добавлен интерфейс для некоторых настроек.<br>

##### 0.1.0 (2013-01-03)
`*` Опубликовано на <a href="https://addons.mozilla.org/">AMO</a>.<br>

##### Старые версии
<a href="http://infocatcher.ucoz.net/ext/fx/sidebars_list/changelog.txt">changelog.txt</a>