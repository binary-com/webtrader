/**
 * Created by Arnab Karmakar on 1/28/16.
 */
define(["jquery", "windows/windows","websockets/binary_websockets","navigation/menu", "moment", "lodash", "jquery-growl", "common/util", "highstock", "highcharts-exporting", "export-csv"], function ($,windows,liveapi, menu, moment, _) {

    var downloadWin = null, markets = [];

    function findInstrumentObject(instrumentCode) {
        var foundObject = undefined;
        markets.forEach(function(value) {
            value.submarkets.forEach(function(value) {
                var a = _.find(value.instruments, function(value) {
                    return value.symbol === instrumentCode;
                });
                if (!_.isUndefined(a))
                {
                    foundObject = a;
                }
                return _.isUndefined(a);
            });
        });
        return foundObject;
    }

    function renderChart(instrument, timePeriod) {

        if ($(".downloadChart").highcharts()) {
            $(".downloadChart").highcharts().destroy();
        }
        $(".downloadChart").highcharts('StockChart', {

            chart: {
                zoomType: 'x',
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
                marginLeft: 40,  /* disable the auto size labels so the Y axes become aligned */
                //,plotBackgroundImage: 'images/binary-watermark-logo.svg'
            },

            navigator: {
                enabled : true
            },

            scrollbar: {
                liveRedraw: false
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
                text: findInstrumentObject($(".download_instruments span").data("symbol")).display_name + " (" + $(".download_timePeriod").val() + ")" //name to display
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
                    }
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
                                this.downloadCSV();
                            },
                            separator: false
                        }, {
                            text: 'Download XLS',
                            onclick: function () {
                                this.downloadXLS();
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
        var chart = $(".downloadChart").highcharts();

        chart.showLoading();
        var from = moment.utc($(".download_frmDate").val() + " " + $(".download_frmTime").val(), "DD/MM/YYYY HH:mm").unix();
        var to = moment.utc($(".download_toDate").val() + " " + $(".download_toTime").val(), "DD/MM/YYYY HH:mm").unix();
        var req = {
            "ticks_history": instrument,
            "start": from,
            "end" : to
        };
        if (!isTick(timePeriod)) {
            req.granularity = convertToTimeperiodObject(timePeriod).timeInSeconds();
            req.style = 'candles';
        }
        liveapi.send(req).then(function(data) {

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
            var endIndex = dataInHighChartsFormat.length > 100 ? totalLength - 100 : 0;
            chart.xAxis[0].range = dataInHighChartsFormat[totalLength - 1][0] - dataInHighChartsFormat[endIndex][0]; //show 30 bars

            var name = instrument;
            var insObject = findInstrumentObject(instrument);
            if (insObject) {
                name = insObject.display_name;
            }

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

        })
        .catch(function(err) {
                console.error(err);
                $.growl.error({ message: err.message });
                chart.hideLoading();
            });
    }

    function init($menuLink) {
        require(["css!download/download.css"]);
        $menuLink.click(function () {
            if (!downloadWin) {
                downloadWin = windows.createBlankWindow($('<div/>'),
                    {
                        title: 'Download/View Data',
                        width: 650,
                        minHeight:500,
                        height : 500,
                        resize : function() {
                            var chart = $(".downloadChart")
                                                .width($(this).width() + 2)
                                                .height($(this).height() - 88)
                                                .highcharts();
                            if (chart) {
                                chart.reflow();
                            }
                        }
                    });
                downloadWin.css("overflow", "hidden");
                downloadWin.dialog('open');
                require(['text!download/download.html'], function($html) {

                    $html = $($html);
                    $html.find("button, input[type=button]").button();
                    $html.find('.download_frmDate')
                        .datepicker({
                            changeMonth : true,
                            changeYear : true,
                            dateFormat : 'dd/mm/yy',
                            showButtonPanel : true,
                            minDate : moment.utc().subtract(1, "years").toDate(),
                            maxDate : moment.utc().toDate()
                        });
                    $html.find('.download_frmTime').timepicker({
                        showCloseButton : true
                    });
                    $html.find('.download_toDate')
                        .datepicker({
                            changeMonth : true,
                            changeYear : true,
                            dateFormat : 'dd/mm/yy',
                            showButtonPanel : true,
                            minDate : moment.utc().subtract(1, "years").toDate(),
                            maxDate : moment.utc().toDate()
                        });
                    $html.find('.download_toTime').timepicker({
                        showCloseButton : true
                    });
                    $html.appendTo(downloadWin);
                    $html.find("select").selectmenu({width : 'auto'});

                    liveapi
                        .cached.send({ trading_times: new Date().toISOString().slice(0, 10) })
                        .then(function (data) {
                            markets = menu.extractChartableMarkets(data);
                            /* add to instruments menu */
                            markets = menu.sortMenu(markets);
                            var rootUL = $("<ul>");
                            var defaultInstrumentCode = '';
                            var defaultInstrumentName = '';
                            markets.forEach(function(value) {
                                var mainMarket = $("<ul>");
                                value.submarkets.forEach(function(value) {
                                    var subMarket = $("<ul>");
                                    value.instruments.forEach(function(value) {
                                        var instruments = $("<li>");
                                        instruments.data('symbol', value.symbol);
                                        instruments.append(value.display_name);
                                        instruments.click(function() {
                                            $(".download_instruments span")
                                                .data("symbol", $(this).data("symbol"))
                                                .html($(this).html());
                                        });
                                        //optionGrp.append($("<option value='" + value.symbol + "'>").append(value.display_name));
                                        subMarket.append(instruments);
                                        if (_.isEmpty(defaultInstrumentCode)) {
                                            console.log(2222, value.symbol);
                                            defaultInstrumentCode = value.symbol;
                                            defaultInstrumentName = value.display_name;
                                        }
                                    });
                                    mainMarket.append($("<li>").append(value.name).append(subMarket));
                                });
                                rootUL.append($("<li>").append(value.name).append(mainMarket));
                            });
                            $(".download_instruments").append(rootUL);
                            $("#download_instrument_menu").menu().menu('refresh');

                            $(".download_instruments span").data("symbol", defaultInstrumentCode);
                            $(".download_instruments span").html(defaultInstrumentName);
                            renderChart(defaultInstrumentCode, $(".download_timePeriod").val());

                        }).catch(function(e) {
                            console.error(e);
                            $.growl.error({ message: e.message });
                        });

                    $html.find(".download_show").click(function() {
                        var from = moment.utc($(".download_frmDate").val() + " " + $(".download_frmTime").val(), "DD/MM/YYYY HH:mm").unix();
                        var to = moment.utc($(".download_toDate").val() + " " + $(".download_toTime").val(), "DD/MM/YYYY HH:mm").unix();
                        if (to < from) {
                            $.growl.error({message : 'To date is less than From date'});
                        } else {
                            renderChart($(".download_instruments span").data("symbol"), $(".download_timePeriod").val());
                        }
                    });

                    $html.find(".download_frmDate").val(moment.utc().subtract(1, "years").format("DD/MM/YYYY"));
                    $html.find(".download_toDate").val(moment.utc().format("DD/MM/YYYY"));

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
