/**
 * Created by apoorv on 9/06/16.
 */
define(['jquery', 'windows/windows', 'highstock', 'color-picker'], function ($, windows) {

    var chartData = [
                        [1452412800, 32.87, 33.75, 32.50, 33.28], [1452427200, 33.27, 34.45, 32.81, 34.22],
                        [1452441600, 34.23, 34.73, 33.72, 33.77], [1452456000, 34.23, 34.48, 33.73, 33.84],
                        [1452470400, 33.84, 34.42, 33.20, 33.33], [1452484800, 33.34, 33.73, 32.80, 33.55],
                        [1452499200, 32.70, 33.22, 32.56, 32.91], [1452513600, 32.89, 33.38, 32.05, 32.17],
                        [1452528000, 32.16, 32.20, 31.21, 31.54], [1452542400, 30.80, 31.87, 30.76, 31.65],
                        [1452556800, 31.66, 32.37, 30.88, 31.09], [1452571200, 31.10, 31.27, 30.38, 30.84],
                        [1452585600, 31.52, 31.84, 31.23, 31.48]
                    ],
        prevTheme = $.extend(true, {}, Highcharts.getOptions(), {}),
        win = null,
        themeConf = {};

    function createThemeObject(id, color) {
        if (!color) return;

        color = color.substring(0, color.indexOf(')') + 1); //Fixing mozilla bug
        var temp = "",  end = "";
        id.split("_").forEach(function (property, index, arr) {
            end = end + "}";
            if (index === arr.length - 1) {
                temp = temp + "{" + "\"" + property + "\"" + ":" + "\"" + color + "\"";
                return;
            }
            temp = temp + "{" + "\"" + property + "\"" + ":";
        });
        temp = temp + end;
        $.extend(themeConf, JSON.parse(temp));
    }

    function init($menuLink) {
        $menuLink.click(function () {
            if (!win) {
                require(['text!themes/custom_theme/custom_theme.html', 'css!themes/custom_theme/custom_theme.css'], function ($html) {
                    $html = $($html).i18n();
                    $html.find(".color_input_width").each(function (index, ele) {
                        var id = $(ele).attr("id").replace("theme_", ""),
                            alpha = $(ele).attr("alpha"),
                            val = getCurrentValue(id);

                        if (val) {
                            $(ele).css({background: val});
                        } else {
                            val = $(ele).css("background-color");
                            createThemeObject(id, val);
                            Highcharts.setOptions(themeConf);
                        }
                        $(ele).data("prevColor",val);
                        $(ele).colorpicker({
						    showOn: 'click',
                            position: {
                                my: "left+50 bottom+100",
                                of: "element",
                                collision: "fit"
                            },
                            part: {
                                map: {size: 128},
                                bar: {size: 128}
                            },
                            alpha: alpha? true: false,
                            colorFormat: "RGBA",
                            open: function(event, color){
                                color.colorPicker.setColor($(this).css("background-color"));
                            },
                            select: function (event, color) {
                                $(ele).css({
                                    background: color.formatted
                                }).val('');
                                createThemeObject(id, color.formatted);
                                updateChart();
                            },
                            ok: function (event, color) {
                                if(!color.formatted){
                                    return;
                                }
                                $(ele).css({
                                    background: color.formatted
                                }).val('');
                                $(ele).data("prevColor",$(ele).css("background-color"));
                                createThemeObject(id, color.formatted);
                                updateChart();
                            },
                            cancel: function (event) {
                                $(ele).css({
                                    background: $(ele).data("prevColor")
                                }).val('');
                                createThemeObject(id, $(ele).data("prevColor"));
                                updateChart();
                            }
                        });
                    });

                    win = windows.createBlankWindow($html,
                        {
                            autoOpen: false,
                            resizable: false,
                            collapsable: false,
                            minimizable: false,
                            maximizable: false,
                            closable: false,
                            closeOnEscape: false,
                            width: 650,
                            height: 515,
                            title: 'Customize chart appearance'.i18n(),
                            modal: true,
                            destroy: function () {
                                win = null;
                            },
                            buttons: {
                                Apply: function () {
                                    require(['themes/themes'], function(themes) {
                                        var $ele = $('a.theme_custom');
                                        var elementText = $ele.text();
                                        var elementClass = $ele.attr('class');
                                        themes.confirmationDialog(Highcharts.getOptions(), elementClass, elementText);
                                    });
                                },
                                Cancel: function () {
                                    $(this).dialog('close');
                                    $(this).dialog("destroy");
                                    resetTheme();
                                }
                            }
                        });

                    win.dialog('open');
                    createChart();
                });
            } else {
                win.moveToTop();
            }
        });
    }

    function getCurrentValue(id) {
        var value = prevTheme;
        id.split("_").forEach(function (obj) {
            if (value)  value = value[obj];
        });
        return value;
    }

    function resetTheme() {
        var defaultOptions = Highcharts.getOptions();
        for (var prop in defaultOptions) {
            if (typeof defaultOptions[prop] !== 'function') delete defaultOptions[prop];
        }
        Highcharts.setOptions(prevTheme);
    }

    function createChart() {
        var chartOptions = {
            chart: {
                spacingLeft: 0,
                marginLeft: 45, /* disable the auto size labels so the Y axes become aligned */
                //,plotBackgroundImage: 'images/binary-watermark-logo.svg'
                events: {
                    load: function () {
                        this.credits.element.onclick = function () {
                            window.open(
                                'http://www.binary.com',
                                '_blank'
                            );
                        }
                    }
                }
            },
            series: [{
                type: "candlestick",
                data: chartData
            }],
            navigator: {
                enabled: true,
                series: {
                    id: 'navigator'
                }
            },

            title: {
                //Show name on chart if it is accessed with affiliates = true parameter. In normal webtrader mode, we dont need this title because the dialog will have one
                text: 'Some random index'.i18n()
            },

            credits: {
                href: 'http://www.binary.com',
                text: 'Binary.com',
            },

            xAxis: {
                ordinal: false
            },

            yAxis: [{
                opposite: false,
            }],

            rangeSelector: {
                enabled: false
            },

            tooltip: {
                crosshairs: [{
                    width: 2,
                    color: 'red',
                    dashStyle: 'dash'
                }, {
                    width: 2,
                    color: 'red',
                    dashStyle: 'dash'
                }],
                enabled: true,
                enabledIndicators: true
            },
            exporting: {
                enabled: false
            }
        };
        $("#preview-chart").highcharts('StockChart', chartOptions);
    }

    function updateChart() {
        Highcharts.setOptions(themeConf);
        $("#preview-chart").highcharts().destroy();
        createChart();
    }

    return {
        init: init
    }
});
