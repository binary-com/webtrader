/**
 * Created by Arnab Karmakar on 1/28/16.
 */
define(["jquery", "windows/windows","websockets/binary_websockets","navigation/menu", "moment", "lodash", "jquery-growl", "common/util", "highstock", "highcharts-exporting"], function ($,windows,liveapi, menu, moment, _) {

    var downloadWin = null, markets = [], timePeriods = [
        {
            name : "Ticks",
            timePeriods : [{name : "1 Tick", code : "1t"}]
        },
        {
            name : "Minutes",
            timePeriods : [
                {name : "1 min", code : "1m"},
                {name : "2 mins", code : "2m"},
                {name : "3 mins", code : "3m"},
                {name : "5 mins", code : "5m"},
                {name : "10 mins", code : "10m"},
                {name : "15 min", code : "15m"},
                {name : "30 min", code : "30m"}
            ]
        },
        {
            name : "Hours",
            timePeriods : [
                {name : "1 hour", code : "1h"},
                {name : "2 hours", code : "2h"},
                {name : "4 hours", code : "4h"},
                {name : "8 hours", code : "8h"}
            ]
        },
        {
            name : "Days",
            timePeriods : [
                {name : "1 day", code : "1d"}
            ]
        }
    ];

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
                marginLeft: 40
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
                    shadow: true
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
                buttons: {
                    contextButton: {
                        menuItems: [{
                            text: 'Download PNG',
                            onclick: function () {
                                this.exportChart();
                            }
                        }, {
                            text: 'Download JPEG',
                            onclick: function () {
                                this.exportChart({
                                    type: 'image/jpeg'
                                });
                            },
                            separator: false
                        }, {
                            text: 'Download PDF',
                            onclick: function () {
                                this.exportChart({
                                    type: 'application/pdf'
                                });
                            },
                            separator: false
                        }, {
                            text: 'Download SVG',
                            onclick: function () {
                                this.exportChart({
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
                                        return '"' + moment.utc(time).format('YYYY-MM-DD HH:mm') + '"' + ',' + /* Date */ + open; /* Price */
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
                }
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

            })
            .catch(function(err) {
                console.error(err);
                $.growl.error({ message: err.message });
                chart.hideLoading();
                $(".download_show").prop("disabled", false);
            });
    }

    function init($menuLink) {
        require(["css!download/download.css"]);
        $menuLink.click(function () {
            if (!downloadWin) {
                downloadWin = windows.createBlankWindow($('<div class="download_window"/>'),
                    {
                        title: 'View Historical Data',
                        width: 700,
                        minHeight:460,
                        height : 460,
                        resize : function() {
                            var chart = $(".downloadChart")
                                                .width($(this).width())
                                                .height($(this).height() - 40)
                                                .highcharts();
                            if (chart) {
                                chart.reflow();
                            }
                        }
                    });
                downloadWin.dialog('open');
                downloadWin.closest("div.ui-dialog").css("overflow", "visible");
                require(['text!download/download.html'], function($html) {

                    $html = $($html);
                    $html.find("button, input[type=button]").button();
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
                                            $(".download_instruments")
                                                .data("instrumentObject", $(this).data("instrumentObject"))
                                                .find("span")
                                                .html($(this).data("instrumentObject").display_name);
                                            $(".download_instruments_container > ul").toggle();
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
                            $downloadInstruments.find("span").html(defaultInstrumentObject.display_name);

                            $(".download_show").click();

                        }).catch(function(e) {
                            console.error(e);
                            $.growl.error({ message: e.message });
                        });

                    //Init the time period drop down
                    var $download_timePeriod = $(".download_timePeriod");
                    var rootUL_timePeriod = $("<ul>");
                    timePeriods.forEach(function(timePeriodParent) {
                        var subMenu = $("<ul>");
                        timePeriodParent.timePeriods.forEach(function(timePeriod) {
                            var tp = $("<li>");
                            tp.append(timePeriod.name);
                            tp.data("timePeriodObject", timePeriod);
                            tp.click(function() {
                                var timePeriodObject = $(this).data("timePeriodObject");
                                $(".download_timePeriod")
                                    .data("timePeriodObject", timePeriodObject)
                                    .find("span")
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
                            subMenu.append(tp);
                        });
                        rootUL_timePeriod.append($("<li>").append(timePeriodParent.name).append(subMenu));
                    });
                    $(".download_timePeriod_container").append(rootUL_timePeriod);
                    rootUL_timePeriod.menu().toggle();
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
                    $download_timePeriod.find("span").html("1 day");
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

    return {
        init: init
    };

});
