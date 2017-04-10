/**
 * Created by Arnab Karmakar on 1/28/16.
 */
import $ from 'jquery';
import windows from '../windows/windows';
import liveapi from '../websockets/binary_websockets';
import menu from '../navigation/menu';
import moment from 'moment';
import _ from 'lodash';
import 'jquery-ui';
import 'jquery-growl';
import '../common/util';
import 'highstock';
import 'highcharts-exporting';
import 'css!./download.css';
import html from 'text!./download.html';

    let downloadWin = null, markets = [], timePeriods = [
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

    const WIDTH = 900, HEIGHT = 500;
    let tp; // tp is timeperiod, required for exporting in csv format.
    //Used in exportOverlay.
    const i18n_name = (local_storage.get('i18n') || { value: 'en' }).value,
        appURL = getAppURL(); // Get current app's url.
    const urlShareTemplate = appURL + '?affiliates=true&instrument={0}&timePeriod={1}&lang=' + i18n_name,
        iframeShareTemplate = '<iframe src="' + urlShareTemplate + '" width="350" height="400" style="overflow-y : hidden;" scrolling="no" />',
        twitterShareTemplate = 'https://twitter.com/share?url={0}&text={1}',
        fbShareTemplate = 'https://facebook.com/sharer/sharer.php?u={0}',
        gPlusShareTemplate = 'https://plus.google.com/share?url={0}',
        bloggerShareTemplate = 'https://www.blogger.com/blog-this.g?u={0}&n={1}',
        vkShareTemplate = 'http://vk.com/share.php?url={0}&title={1}';
    const is_rtl_language = i18n_name === 'ar';

    const renderChart = (instrumentObject, timePeriod, toDateWithTime) => {

        const $downloadChart = $(".downloadChart");
        if ($downloadChart.highcharts()) {
            $downloadChart.highcharts().destroy();
        }

        $downloadChart.highcharts('StockChart', {

            chart: {
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
                href: '#',
                text: ''
            },

            xAxis: {
                labels: {
                    formatter: function(){
                        const str = this.axis.defaultLabelFormatter.call(this);
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
                enabled: false,
                url: 'https://export.highcharts.com', // Override for mixed content error
                // Naming the File
                filename:instrumentObject.display_name.split(' ').join('_')+"("+timePeriod+")"
            },

            rangeSelector: {
                enabled: false
            }

        });
        const chart = $downloadChart.highcharts();

        chart.showLoading();
        //Disable show button
        $(".download_show").prop("disabled", true);

        const from = moment.utc(toDateWithTime, "DD/MM/YYYY HH:mm").unix();
        let to = from + 30 * 60; //By default getting 30 minutes of data (for tick charts)
        const req = {
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
            .send(req).then((data) => {

                const dataInHighChartsFormat = [];

                if (isTick(timePeriod)) {
                    data.history.times.forEach((time, index) => {
                        dataInHighChartsFormat.push([parseInt(time) * 1000, parseFloat(data.history.prices[index])]);
                    });
                } else {
                    data.candles.forEach((ohlc) => {
                        dataInHighChartsFormat.push([ohlc.epoch * 1000,
                            parseFloat(ohlc.open),
                            parseFloat(ohlc.high),
                            parseFloat(ohlc.low),
                            parseFloat(ohlc.close)]);
                    });
                }

                const totalLength = dataInHighChartsFormat.length;
                if (totalLength === 0) {
                    $.growl.error({ message: "There is no historical data available!" });
                    chart.hideLoading();
                    $(".download_show").prop("disabled", false);
                    return;
                };
                const endIndex = totalLength > 100 ? 100 : totalLength - 1;
                chart.xAxis[0].setExtremes(dataInHighChartsFormat[0][0], dataInHighChartsFormat[endIndex][0]); //show 100 bars

                const name = instrumentObject.display_name;

                const seriesConf = {
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
            .catch((err) => {
                console.error(err);
                $.growl.error({ message: err.message });
                chart.hideLoading();
                $(".download_show").prop("disabled", false);
            });
        tp = timePeriod;
        setShareURLs(instrumentObject, timePeriod);

    }

    const resizeDialog = () => {
        if(downloadWin) {
            const $dialog = downloadWin.dialog('widget');
            const chart = $(".downloadChart")
                .height($dialog.height() - 100)
                .highcharts();
            if (chart) chart.reflow();
            const shareButton = $(".download_window .share-button");
            const overlay = $(".download_window .exportOverlay");
            const positionRight = $dialog.width() - (shareButton.offset().left + shareButton.outerWidth() - $dialog.offset().left) + 1;
            overlay.css("right",positionRight + "px");
        }
    };

    export const init = ($menuLink) => {
        $menuLink.click(() => {
            if (!downloadWin) {
                downloadWin = windows.createBlankWindow($('<div class="download_window"/>'),
                    {
                        title: 'View Historical Data'.i18n(),
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
                    const $html = $(html).i18n();
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
                    $html.find('.download_fromTime').timepicker({
                            showCloseButton : true
                        }).click(function() {
                            $(this).timepicker("show");
                        });
                    $html.appendTo(downloadWin);

                    liveapi
                        .cached.send({ trading_times: new Date().toISOString().slice(0, 10) })
                        .then((data) => {
                            markets = menu.extractChartableMarkets(data);
                            /* add to instruments menu */
                            markets = menu.sortMenu(markets);
                            const rootULForInstruments = $("<ul>");
                            let defaultInstrumentObject = undefined;
                            markets.forEach((value) => {
                                const mainMarket = $("<ul>");
                                value.submarkets.forEach((value) => {
                                    const subMarket = $("<ul>");
                                    value.instruments.forEach((value) => {
                                        const instrument = $("<li>");
                                        instrument.append(value.display_name);
                                        instrument.data("instrumentObject", value);
                                        instrument.click(function() {
                                             const instrumentObject = $(this).data("instrumentObject");
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

                            const menu_options = is_rtl_language ? {position: { my: "right top", at: "left top" }} : {};
                            rootULForInstruments.menu(menu_options).toggle();

                            const $downloadInstruments = $(".download_instruments");
                            $downloadInstruments
                                .click(() => {
                                    $(".download_instruments_container > ul").toggle();
                                })
                                .blur(() => {
                                    $(".download_instruments_container > ul").hide();
                                });
                            $downloadInstruments.data("instrumentObject", defaultInstrumentObject);
                            $downloadInstruments.html(defaultInstrumentObject.display_name);
                            //Init the time period drop down
                            createTimePeriodDropDown($downloadInstruments.data("instrumentObject").delay_amount * 60, $html);

                            $(".download_show").click();

                        }).catch((e) => {
                            console.error(e);
                            $.growl.error({ message: e.message });
                        });

                    const $download_timePeriod = $(".download_timePeriod");
                    $download_timePeriod
                        .click(
                           () => $(".download_timePeriod_container > ul").toggle()
                        )
                        .blur(
                           () => $(".download_timePeriod_container > ul").hide()
                        );
                    $download_timePeriod.data("timePeriodObject", {
                        name : "1 day", code : "1d"
                    });
                    $download_timePeriod.html("1 day");
                    $(".download_fromTime").hide();

                    $html.find(".download_show").click(() => {
                        const $downloadInstruments = $(".download_instruments");
                        const $download_timePeriod = $(".download_timePeriod");
                        const instrumentObject = $downloadInstruments.data("instrumentObject");
                        const timePeriodObject = $download_timePeriod.data("timePeriodObject");
                        renderChart(instrumentObject, timePeriodObject.code,
                                        $(".download_fromDate").val() + " " + $(".download_fromTime").val());
                    });

                    $html.find(".download_fromDate").val(moment.utc().subtract(1, "years").format("DD/MM/YYYY"));

                    $html.find(".share-button").click(
                       () => $html.find(".overlay").toggle()
                    );

                    initDownloadChartOptions();

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
    const createTimePeriodDropDown = (delay_amount, $html) => {
        const $download_timePeriod = $(".download_timePeriod");
        let timePeriodValue, baseValue, isChecked = false;
        //removing any existing drop down.
        if ($download_timePeriod.find("ul").length > 0) {
            $download_timePeriod.find("ul")[0].remove();
        }
        const rootUL_timePeriod = $("<ul>");
        timePeriods.forEach((timePeriodParent) => {
            const subMenu = $("<ul>");
            timePeriodParent.timePeriods.forEach((timePeriod) => {
                const tp = $("<li>");
                timePeriodValue = convertToTimeperiodObject(timePeriod.code).timeInSeconds();
                tp.append(timePeriod.name);
                tp.data("timePeriodObject", timePeriod);
                tp.click(function() {
                    const timePeriodObject = $(this).data("timePeriodObject");
                    $(".download_timePeriod")
                        .data("timePeriodObject", timePeriodObject)
                        .html($(this).data("timePeriodObject").name);
                    $(".download_timePeriod_container > ul").toggle();
                    const isDayCandles = timePeriodObject.code === '1d';
                    const $download_fromTime = $html.find(".download_fromTime");
                    if (isDayCandles) {
                        $download_fromTime.val("00:00");
                        $download_fromTime.hide()
                    } else {
                        $download_fromTime.show();
                    }
                });
                if (!_.isUndefined($download_timePeriod.data("timePeriodObject")) && !isChecked) {
                    const obj = $download_timePeriod.data("timePeriodObject");
                    const value = convertToTimeperiodObject(obj.code).timeInSeconds();
                    if(value < delay_amount){
                        tp.click();
                        $(".download_timePeriod_container > ul").toggle();
                    }
                    isChecked = true;
                }
                subMenu.append(tp);

            });
            rootUL_timePeriod.append($("<li>").append(timePeriodParent.name).append(subMenu));
        });
        $(".download_timePeriod_container").append(rootUL_timePeriod);
        const menu_options = is_rtl_language ? {position: { my: "right top", at: "left top" }} : {};
        rootUL_timePeriod.menu(menu_options).toggle();
    }

    // This function is used to set various share urls in share button dropdown.
    const setShareURLs = (instrument, timePeriod) => {
        const fbShareLink = $(".download_table .fbShareLink"),
            twitterShareLink = $(".download_table .twitterShareLink"),
            bloggerShareLink = $(".download_table .bloggerShareLink"),
            gPlusShareLink = $(".download_table .gPlusShareLink"),
            vkShareLink = $(".download_table .vkShareLink"),
            shareLink = $(".download_table .exportChartURLShare"),
            embedCode = $(".download_table .exportChartIframeShare");
        fbShareLink.attr("href", fbShareTemplate.format(encodeURIComponent(urlShareTemplate.format(instrument.symbol, timePeriod))));
        twitterShareLink.attr("href", twitterShareTemplate.format(encodeURIComponent(urlShareTemplate.format(instrument.symbol, timePeriod)), instrument.display_name + '(' + timePeriod + ')'));
        gPlusShareLink.attr("href", gPlusShareTemplate.format(encodeURIComponent(urlShareTemplate.format(instrument.symbol, timePeriod))));
        bloggerShareLink.attr("href", bloggerShareTemplate.format(urlShareTemplate.format(instrument.symbol, timePeriod), instrument.display_name + '(' + timePeriod + ')'));
        vkShareLink.attr("href", vkShareTemplate.format(urlShareTemplate.format(instrument.symbol, timePeriod), instrument.display_name + '(' + timePeriod + ')'));
        shareLink.val(urlShareTemplate.format(instrument.symbol, timePeriod));
        embedCode.val(iframeShareTemplate.format(instrument.symbol, timePeriod));
    }

    const initDownloadChartOptions = () => {
        const png = $(".download_table #png"),
            pdf = $(".download_table #pdf"),
            csv = $(".download_table #csv"),
            svg = $(".download_table #svg");

        png.click(() => {
            const chart = $(".downloadChart").highcharts();
            chart.exportChartLocal();
        });
        pdf.click(() => {
            const chart = $(".downloadChart").highcharts();
            chart.exportChart({
                type: 'application/pdf'
            });
        });
        svg.click(() => {
            const chart = $(".downloadChart").highcharts();
            chart.exportChart({
                type: 'image/svg+xml'
            });
        });
        csv.click(() => {
            const chart = $(".downloadChart").highcharts();
            const series = chart.series[0]; //Main series
            const is_tick = isTick(tp);
            const filename = series.options.name + ' (' +  tp + ')' + '.csv';
            const lines = series.options.data.map((bar) => {
                const time = bar[0], open = bar[1];
                if(is_tick){
                    return '"' + moment.utc(time).format('YYYY-MM-DD HH:mm:ss') + '"' + ',' + /* Date */ + open; /* Price */
                }
                const high = bar[2], low = bar[3], close = bar[4];
                return '"' + moment.utc(time).format('YYYY-MM-DD HH:mm') + '"' + ',' +/* Date */
                    open + ',' + high + ',' + low + ',' + close;
            });
            const csv = (is_tick ? 'Date,Tick\n' : 'Date,Open,High,Low,Close\n') + lines.join('\n');

            download_file_in_browser(filename, 'text/csv;charset=utf-8;', csv);
        });
    }

    export default { init };
