/**
 * Created by Arnab Karmakar on 1/28/16.
 */
define(["jquery", "windows/windows","websockets/binary_websockets","navigation/menu", "moment", "lodash", "jquery-growl", "common/util", "highstock", "highcharts-exporting"], function ($,windows,liveapi, menu, moment, _) {

    var downloadWin = null, markets = [], timePeriods = [
        {
            name : 'Ticks'.i18n(),
            timePeriods : [{name : "1 Tick", code : "1t"}]
        },
        {
            name : 'Minutes'.i18n(),
            timePeriods : [
                {name : "1 min", code : "1m"},
                {name : "2 mins", code : "2m"},
                {name : "3 mins", code : "3m"},
                {name : "5 mins", code : "5m"},
                {name : "10 mins", code : "10m"},
                {name : "15 mins", code : "15m"},
                {name : "30 mins", code : "30m"}
            ]
        },
        {
            name : 'Hours'.i18n(),
            timePeriods : [
                {name : "1 hour", code : "1h"},
                {name : "2 hours", code : "2h"},
                {name : "4 hours", code : "4h"},
                {name : "8 hours", code : "8h"}
            ]
        },
        {
            name : 'Days'.i18n(),
            timePeriods : [
                {name : "1 day", code : "1d"}
            ]
        }
    ];
    var WIDTH = 900, HEIGHT = 500;

    function renderChart(instrumentObject, timePeriod, toDateWithTime) {

        var $downloadChart = $(".downloadChart");
        if ($downloadChart.highcharts()) {
            $downloadChart.highcharts().destroy();
        }

        $downloadChart.highcharts('StockChart', {

            chart: {
                events: {
                    load: function () {
                        this.credits.element.onclick = function() {
                            window.open(
                                'http://www.binary.com',
                                '_blank'
                            );
                        }
                    }
                },
                spacingLeft: 0,
                marginLeft: 45
            },

            navigator: {
                enabled : true,
                series: {
                    id: 'navigator'
                }
            },

            //This will be updated when 'Settings' button is implemented
            plotOptions: {
                candlestick: {
                    lineColor: 'black',
                    color: 'red',
                    upColor: 'green',
                    upLineColor: 'black',
                    shadow: false
                }
            },

            title: {
                //Show name on chart if it is accessed with affiliates = true parameter. In normal webtrader mode, we dont need this title because the dialog will have one
                text: instrumentObject.display_name + " (" + timePeriod + ")" //name to display
            },

            credits: {
                href: 'http://www.binary.com',
                text: 'Binary.com'
            },

            xAxis: {
                labels: {
                    formatter: function(){
                        var str = this.axis.defaultLabelFormatter.call(this);
                        return str.replace('.','');
                    }
                }
            },

            yAxis: [{
                opposite: false,
                labels: {
                    formatter: function () {
                        return this.value;
                    },
                    align:'center'
                }
            }],

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
                enabledIndicators: true,
                xDateFormat: '%A, %b %e, %Y %H:%M:%S'
            },

            exporting: {
                enabled: true,
                url: 'https://export.highcharts.com', // Override for mixed content error
                buttons: {
                    contextButton: {
                        menuItems: [{
                            text: 'Download PNG',
                            onclick: function () {
                                this.exportChartLocal();
                            }
                        }, {
                            text: 'Download SVG',
                            onclick: function () {
                                this.exportChartLocal({
                                    type: 'image/svg+xml'
                                });
                            },
                            separator: false
                        }, {
                            text: 'Download CSV',
                            onclick: function () {
                                var series = this.series[0]; //Main series
                                var is_tick = isTick(timePeriod);
                                var filename = series.options.name + ' (' +  timePeriod + ')' + '.csv';
                                var lines = series.options.data.map(function(bar){
                                    var time = bar[0], open = bar[1];
                                    if(is_tick){
                                        return '"' + moment.utc(time).format('YYYY-MM-DD HH:mm:ss') + '"' + ',' + /* Date */ + open; /* Price */
                                    }
                                    var high = bar[2], low = bar[3], close = bar[4];
                                    return '"' + moment.utc(time).format('YYYY-MM-DD HH:mm') + '"' + ',' +/* Date */
                                        open + ',' + high + ',' + low + ',' + close;
                                });
                                var csv = (is_tick ? 'Date,Tick\n' : 'Date,Open,High,Low,Close\n') + lines.join('\n');

                                var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                                if (navigator.msSaveBlob) { // IE 10+
                                    navigator.msSaveBlob(blob, filename);
                                }
                                else {
                                    var link = document.createElement("a");
                                    if (link.download !== undefined) {  /* Evergreen Browsers :) */
                                        var url = URL.createObjectURL(blob);
                                        link.setAttribute("href", url);
                                        link.setAttribute("download", filename);
                                        link.style.visibility = 'hidden';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }
                                }
                            },
                            separator: false
                        }]
                    }
                },
                // Naming the File
                filename:instrumentObject.display_name.split(' ').join('_')+"("+timePeriod+")"
            },

            rangeSelector: {
                enabled: false
            }

        });
        var chart = $downloadChart.highcharts();

        chart.showLoading();
        //Disable show button
        $(".download_show").prop("disabled", true);

        var from = moment.utc(toDateWithTime, "DD/MM/YYYY HH:mm").unix();
        var to = from + 30 * 60; //By default getting 30 minutes of data (for tick charts)
        var req = {
            "ticks_history": instrumentObject.symbol,
            "start" : from
        };
        if (!isTick(timePeriod)) {
            req.granularity = convertToTimeperiodObject(timePeriod).timeInSeconds();
            req.style = 'candles';
            to = from + req.granularity * 1000;
        }
        if (moment.utc().unix() < to) {
            to = moment.utc().unix();
        }
        req.end = to;

        console.log("View Historical data [request] ", JSON.stringify(req));
        liveapi
            .send(req).then(function(data) {

                var dataInHighChartsFormat = [];

                if (isTick(timePeriod)) {
                    data.history.times.forEach(function(time, index) {
                        dataInHighChartsFormat.push([parseInt(time) * 1000, parseFloat(data.history.prices[index])]);
                    });
                } else {
                    data.candles.forEach(function (ohlc) {
                        dataInHighChartsFormat.push([ohlc.epoch * 1000,
                            parseFloat(ohlc.open),
                            parseFloat(ohlc.high),
                            parseFloat(ohlc.low),
                            parseFloat(ohlc.close)]);
                    });
                }

                var totalLength = dataInHighChartsFormat.length;
                if (totalLength === 0) {
                    $.growl.error({ message: "There is no historical data available!" });
                    chart.hideLoading();
                    $(".download_show").prop("disabled", false);
                    return;
                };
                var endIndex = totalLength > 100 ? 100 : totalLength - 1;
                chart.xAxis[0].setExtremes(dataInHighChartsFormat[0][0], dataInHighChartsFormat[endIndex][0]); //show 100 bars

                var name = instrumentObject.display_name;

                var seriesConf = {
                    id: '_' + Date.now(),
                    name: name,
                    data: dataInHighChartsFormat,
                    type: isTick(timePeriod) ? 'line' : 'candlestick', //area, candlestick, line, areaspline, column, ohlc, scatter, dot, linedot
                    dataGrouping: {
                        enabled: false
                    },
                    states: {
                        hover: {
                            enabled: false
                        }
                    }
                };
                if (isTick(timePeriod)) {
                    seriesConf.marker = {
                        enabled: true,
                        radius: 4
                    };
                }

                chart.addSeries(seriesConf);
                chart.hideLoading();
                $(".download_show").prop("disabled", false);

                resizeDialog();

            })
            .catch(function(err) {
                console.error(err);
                $.growl.error({ message: err.message });
                chart.hideLoading();
                $(".download_show").prop("disabled", false);
            });

    }

    var resizeDialog = function() {
        console.log('resize called');
        if(downloadWin) {
            var $dialog = downloadWin.dialog('widget');
            var chart = $(".downloadChart")
                .height($dialog.height() - 100)
                .highcharts();
            if (chart) chart.reflow();
        }
    };

    function init($menuLink) {
        require(["css!download/download.css"]);
        $menuLink.click(function () {
            if (!downloadWin) {
                downloadWin = windows.createBlankWindow($('<div class="download_window"/>'),
                    {
                        title: 'View Historical Data',
                        width: WIDTH ,
                        minWidth: WIDTH ,
                        minHeight: HEIGHT ,
                        height: HEIGHT ,
                        resize : resizeDialog
                    });
                downloadWin.track({
                  module_id: 'download',
                  is_unique: true,
                  data: null
                });
                downloadWin.dialog('open');
                downloadWin.closest("div.ui-dialog").css("overflow", "visible");
                require(['text!download/download.html'], function($html) {

                    $html = $($html);
                    //$html.find("button, input[type=button]").button();
                    $html
                        .find('.download_fromDate')
                        .datepicker({
                            changeMonth : true,
                            changeYear : true,
                            dateFormat : 'dd/mm/yy',
                            showButtonPanel : true,
                            minDate : moment.utc().subtract(1, "years").toDate(),
                            maxDate : moment.utc().toDate()
                        })
                        .click(function() {
                            $(this).datepicker("show");
                        });
                    $html
                        .find('.download_fromTime').timepicker({
                            showCloseButton : true
                        })
                        .click(function() {
                            $(this).timepicker("show");
                        });
                    $html.appendTo(downloadWin);

                    liveapi
                        .cached.send({ trading_times: new Date().toISOString().slice(0, 10) })
                        .then(function (data) {
                            markets = menu.extractChartableMarkets(data);
                            /* add to instruments menu */
                            markets = menu.sortMenu(markets);
                            var rootULForInstruments = $("<ul>");
                            var defaultInstrumentObject = undefined;
                            markets.forEach(function(value) {
                                var mainMarket = $("<ul>");
                                value.submarkets.forEach(function(value) {
                                    var subMarket = $("<ul>");
                                    value.instruments.forEach(function(value) {
                                        var instrument = $("<li>");
                                        instrument.append(value.display_name);
                                        instrument.data("instrumentObject", value);
                                        instrument.click(function() {
                                             var instrumentObject = $(this).data("instrumentObject");
                                            $(".download_instruments")
                                                .data("instrumentObject",instrumentObject)
                                                .html(instrumentObject.display_name);
                                            $(".download_instruments_container > ul").toggle();
                                            // Create a new drop down everytime market is changed
                                            createTimePeriodDropDown($(this).data("instrumentObject").delay_amount * 60, $html);
                                        });
                                        if (_.isUndefined(defaultInstrumentObject)) {
                                            defaultInstrumentObject = value;
                                        }
                                        subMarket.append(instrument);
                                    });
                                    mainMarket.append($("<li>").append(value.name).append(subMarket));
                                });
                                rootULForInstruments.append($("<li>").append(value.name).append(mainMarket));
                            });
                            $(".download_instruments_container").append(rootULForInstruments);
                            rootULForInstruments.menu().toggle();

                            var $downloadInstruments = $(".download_instruments");
                            $downloadInstruments
                                .click(function() {
                                    $(".download_instruments_container > ul").toggle();
                                })
                                .blur(function () {
                                    $(".download_instruments_container > ul").hide();
                                });
                            $downloadInstruments.data("instrumentObject", defaultInstrumentObject);
                            $downloadInstruments.html(defaultInstrumentObject.display_name);
                            //Init the time period drop down
                            createTimePeriodDropDown($downloadInstruments.data("instrumentObject").delay_amount * 60, $html);

                            $(".download_show").click();

                        }).catch(function(e) {
                            console.error(e);
                            $.growl.error({ message: e.message });
                        });

                    var $download_timePeriod = $(".download_timePeriod");
                    $download_timePeriod
                        .click(function() {
                            $(".download_timePeriod_container > ul").toggle();
                        })
                        .blur(function() {
                            $(".download_timePeriod_container > ul").hide();
                        });
                    $download_timePeriod.data("timePeriodObject", {
                        name : "1 day", code : "1d"
                    });
                    $download_timePeriod.html("1 day");
                    $(".download_fromTime").hide();

                    $html.find(".download_show").click(function() {
                        var $downloadInstruments = $(".download_instruments");
                        var $download_timePeriod = $(".download_timePeriod");
                        var instrumentObject = $downloadInstruments.data("instrumentObject");
                        var timePeriodObject = $download_timePeriod.data("timePeriodObject");
                        renderChart(instrumentObject, timePeriodObject.code,
                                        $(".download_fromDate").val() + " " + $(".download_fromTime").val());
                    });

                    $html.find(".download_fromDate").val(moment.utc().subtract(1, "years").format("DD/MM/YYYY"));

                });
            }
            else {
                downloadWin.moveToTop();
            }
        });
    }

    /*
    * delay_amount is used for getting instrumentObjects delay_amount.
    * $html  contains html object of the download page.
    * $download_timePeriod is the current timePeriod object.
    * timePeriodValue contains converted value for different timePeriod objects converted into seconds.
    * baseValue contains value converted into seconds for particular timeperiod.name.
    * isChecked is a flag used to identify If current timeObject is less than delay_amount and set the next closest one.
    */
    function createTimePeriodDropDown(delay_amount, $html) {
        var $download_timePeriod = $(".download_timePeriod"),
            timePeriodValue, baseValue, isChecked = false;
        //removing any existing drop down.
        if ($download_timePeriod.find("ul").length > 0) {
            $download_timePeriod.find("ul")[0].remove();
        }
        var rootUL_timePeriod = $("<ul>");
        timePeriods.forEach(function(timePeriodParent) {
            var subMenu = $("<ul>");
            timePeriodParent.timePeriods.forEach(function(timePeriod) {
                var tp = $("<li>");
                timePeriodValue = convertToTimeperiodObject(timePeriod.code).timeInSeconds();
                tp.append(timePeriod.name);
                if (delay_amount > timePeriodValue) {
                    tp.addClass("ui-button-disabled ui-state-disabled");
                } else {
                    tp.data("timePeriodObject", timePeriod);
                    tp.click(function() {
                        var timePeriodObject = $(this).data("timePeriodObject");
                        $(".download_timePeriod")
                            .data("timePeriodObject", timePeriodObject)
                            .html($(this).data("timePeriodObject").name);
                        $(".download_timePeriod_container > ul").toggle();
                        var isDayCandles = timePeriodObject.code === '1d';
                        var $download_fromTime = $html.find(".download_fromTime");
                        if (isDayCandles) {
                            $download_fromTime.val("00:00");
                            $download_fromTime.hide()
                        } else {
                            $download_fromTime.show();
                        }
                    });
                    if (!_.isUndefined($download_timePeriod.data("timePeriodObject")) && !isChecked) {
                        var obj = $download_timePeriod.data("timePeriodObject");
                        var value = convertToTimeperiodObject(obj.code).timeInSeconds();
                        if(value < delay_amount){
                            tp.click();
                            $(".download_timePeriod_container > ul").toggle();
                        }
                        isChecked = true;
                    }
                }
                subMenu.append(tp);

            });
            rootUL_timePeriod.append($("<li>").append(timePeriodParent.name).append(subMenu));
        });
        $(".download_timePeriod_container").append(rootUL_timePeriod);
        rootUL_timePeriod.menu().toggle();
    }

    return {
        init: init
    };

});
