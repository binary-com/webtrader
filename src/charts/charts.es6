/**
 * Created by arnab on 2/11/15.
 */
import $ from 'jquery';
import chartingRequestMap from 'charts/chartingRequestMap';
import liveapi from 'websockets/binary_websockets';
import ohlc_handler from 'websockets/ohlc_handler';
import currentPrice from 'currentPriceIndicator';
import indicators from 'charts/indicators/highcharts_custom/indicators';
import moment from 'moment';
import _ from 'lodash';
import indicators_json from 'text!charts/indicators/indicators.json';
import 'highcharts-exporting';
import 'common/util';
import 'paralleljs';
import 'jquery-growl';
import $Hmw from 'common/highchartsMousewheel';
import ins from 'instruments/instruments';

const lang = local_storage.get("i18n").value.replace("_","-");
if(lang !== "en") // Load moment js locale file.
    require(['moment-locale/'+lang]); 

const indicator_values = _(JSON.parse(indicators_json)).values().value();
Highcharts.Chart.prototype.get_indicators = function() {
    const chart = this;
    const indicators = [];
    if (chart.series.length > 0) {
        indicator_values.forEach((ind) => {
            const id = ind.id;
            chart.series[0][id] && chart.series[0][id].forEach((entry) => {
                indicators.push({ id: id, name: ind.long_display_name, options: entry.options })
            });
        });
    }

    return indicators;
}

Highcharts.Chart.prototype.set_indicators = function(indicators) {
    const chart = this;
    if (chart.series && chart.series[0]) {
        indicators.forEach((ind) => {
            if (ind.options.onSeriesID) { //make sure that we are using the new onSeriesID value
                ind.options.onSeriesID = chart.series[0].options.id;
            }
            chart.series[0].addIndicator(ind.id, ind.options);
        });
    }
}

Highcharts.Chart.prototype.get_indicator_series = function() {
    const chart = this;
    const series = [];
    if (chart.series.length > 0) {
        indicator_values.forEach((ind) => {
            const id = ind.id;
            chart.series[0][id] && chart.series[0][id][0] && series.push({ id: id, series: chart.series[0][id] })
        });
    }
    return series;
}

Highcharts.Chart.prototype.set_indicator_series = function(series) {
    const chart = this;
    if (!chart.series || chart.series.length == 0) {
        return;
    }
    series.forEach((seri) => {
        chart.series[0][seri.id] = seri.series;
    });
}

Highcharts.Chart.prototype.get_overlay_count = function() {
    let overlayCount = 0;
    this.series.forEach((s, index) => {
        if (s.options.isInstrument && s.options.id.indexOf('navigator') == -1 && index != 0) {
            overlayCount++;
        }
    });
    return overlayCount;
}

$(() => {

    Highcharts.setOptions({
        global: {
            useUTC: true,
            canvasToolsURL: "https://code.highcharts.com/modules/canvas-tools.js"
        },
        lang: { thousandsSep: ',' } /* format numbers with comma (instead of space) */
    });

    // Localizing Highcharts.
    const lang = Highcharts.getOptions().lang;
    Object.keys(lang).forEach((key) => {
    if(typeof lang[key] === 'object') {
        lang[key].forEach(
            (value, index) => { lang[key][index] = value.i18n();}
        );
        return;
    }
    lang[key] = lang[key].i18n();
    });
});

indicators.initHighchartIndicators(chartingRequestMap.barsTable);

export const destroy = (options) => {
    const containerIDWithHash = options.containerIDWithHash,
        timePeriod = options.timePeriod,
        instrumentCode = options.instrumentCode;
    if (!timePeriod || !instrumentCode) return;

    //granularity will be 0 for tick timePeriod
    const key = chartingRequestMap.keyFor(instrumentCode, timePeriod);
    chartingRequestMap.unregister(key, containerIDWithHash);
}

export const generate_csv = (chart, data) => {
    const filename = data.instrumentName + ' (' + data.timePeriod + ')' + '.csv';

    let lines = [],
        dataToBeProcessTolines = [];
    const flattenData = (d) => {
        let ret = null;
        if (_.isArray(d) && d.length > 3) {
            const time = d[0];
            ret = '"' + moment.utc(time).format('YYYY-MM-DD HH:mm') + '"' + ',' + d.slice(1, d.length).join(',');
        } //OHLC case
        else if (_.isNumber(d.high)) ret = '"' + moment.utc(d.time).format('YYYY-MM-DD HH:mm') + '"' + ',' + d.open + ',' + d.high + ',' + d.low + ',' + d.close;
        else if (_.isArray(d) && d.length > 1) ret = '"' + moment.utc(d[0]).format('YYYY-MM-DD HH:mm') + '"' + ',' + d[1]; //Tick chart case
        else if (_.isObject(d) && d.title && d.text) {
            if (d instanceof FractalUpdateObject) {
                ret = '"' + moment.utc(d.x || d.time).format('YYYY-MM-DD HH:mm') + '"' + ',' + (d.isBull ? 'UP' : d.isBear ? 'DOWN' : ' ');
            } else ret = '"' + moment.utc(d.x || d.time).format('YYYY-MM-DD HH:mm') + '"' + ',' + (d.text);
        } else if (_.isNumber(d.y)) ret = '"' + moment.utc(d.x || d.time).format('YYYY-MM-DD HH:mm') + '"' + ',' + (d.y || d.close);
        else ret = d.toString(); //Unknown case
        return ret;
    };
    chart.series.forEach((series, index) => {
        if (series.options.id === 'navigator') return true;
        const newDataLines = series.options.data.map((d) => {
            return flattenData(d);
        }) || [];
        if (index == 0) {
            const ohlc = newDataLines[0].split(',').length > 2;
            if (ohlc) lines.push('Date,Time,Open,High,Low,Close');
            else lines.push('Date,Time,"' + series.options.name + '"');
            //newDataLines is incorrect - get it from lokijs
            const key = chartingRequestMap.keyFor(data.instrumentCode, data.timePeriod);
            const bars = chartingRequestMap.barsTable
                .chain()
                .find({ instrumentCdAndTp: key })
                .simplesort('time', false)
                .data();
            lines = lines.concat(bars.map((b) => {
                return ohlc ? ['"' + moment.utc(b.time).format('YYYY-MM-DD HH:mm') + '"', b.open, b.high, b.low, b.close].join(',') : ['"' + moment.utc(b.time).format('YYYY-MM-DD HH:mm:ss') + '"', b.close].join(',');
            }));
        } else {
            lines[0] += ',"' + series.options.name + '"'; //Add header
            dataToBeProcessTolines.push(newDataLines);
        }
    });

    $.growl.notice({ message: 'Downloading .csv'.i18n() });
    //merge here
    new Parallel([lines, dataToBeProcessTolines])
        .spawn((data) => {
            let l = data[0];
            const d = data[1];
            l = l.map((line, index) => {

                d.forEach((dd) => {
                    let added = false;
                    dd.forEach((nDl) => {
                        if (nDl) {
                            const temp = nDl.split(',');
                            if (line.split(',')[0] === temp[0]) {
                                line += ',' + temp.slice(1, temp.length).join(',');
                                added = true;
                                return false;
                            }
                        }
                    });
                    if (line.indexOf('Date') == -1 && !added) line += ','; //Add a gap since we did not add a value
                });
                if (index === 0) {
                    return line;
                }
                return line.split(" ").join("\",\""); //Separate date and time.
            });
            return l;
        })
        .then((data) => {
            const csv = data.join('\n'); //(is_tick ? 'Date,Tick\n' : 'Date,Open,High,Low,Close\n') + lines.join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            if (navigator.msSaveBlob) { // IE 10+
                navigator.msSaveBlob(blob, filename);
            } else {
                const link = document.createElement("a");
                if (link.download !== undefined) { /* Evergreen Browsers :) */
                    const url = URL.createObjectURL(blob);
                    link.setAttribute("href", url);
                    link.setAttribute("download", filename);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            }
        }, (error) => {
            $.growl.error({ message: 'Error downloading .csv'.i18n() });
            console.error(error);
        });

}

/**
 * This method is the core and the starting point of highstock charts drawing
 * @param containerIDWithHash
 * @param instrumentCode
 * @param instrumentName
 * @param timePeriod
 * @param type
 * @param onload // optional onload callback
 */
export const drawChart = (containerIDWithHash, options, onload) => {
    let indicators = [];
    let overlays = [];

    if ($(containerIDWithHash).highcharts()) {
        //Just making sure that everything has been cleared out before starting a new thread
        const key = chartingRequestMap.keyFor(options.instrumentCode, options.timePeriod);
        chartingRequestMap.removeChart(key, containerIDWithHash);
        const chart = $(containerIDWithHash).highcharts();
        indicators = chart.get_indicators() || [];
        overlays = options.overlays || [];
        chart.destroy();
    }
    if (options.indicators) { /* this comes only from tracker.js & ChartTemplateManager.js */
        indicators = options.indicators || [];
        overlays = options.overlays || [];
        $(containerIDWithHash).data("overlayCount", overlays.length);
    }

    /* ignore overlays if chart type is candlestick or ohlc */
    if ((options.type === 'candlestick' || options.type === 'ohlc') && overlays.length > 0) {
        /* we should not come here, logging a warning as an alert if we somehow do */
        console.warn("Ingoring overlays because chart type is " + options.type);
        overlays = [];
    }

    //Save some data in DOM
    $(containerIDWithHash).data({
        instrumentCode: options.instrumentCode,
        instrumentName: options.instrumentName,
        timePeriod: options.timePeriod,
        type: options.type,
        delayAmount: options.delayAmount
    });

    // Create the chart
    $(containerIDWithHash).highcharts('StockChart', {

        chart: {
            events: {
                load: function(event) {

                    this.showLoading();
                    currentPrice.init();
                    liveapi.execute(() => {
                        ohlc_handler.retrieveChartDataAndRender({
                            timePeriod: options.timePeriod,
                            instrumentCode: options.instrumentCode,
                            containerIDWithHash: containerIDWithHash,
                            type: options.type,
                            instrumentName: options.instrumentName,
                            series_compare: options.series_compare,
                            delayAmount: options.delayAmount
                        }).catch((err) => {
                            const msg = 'Error getting data for %1'.i18n().replace('%1', options.instrumentName);
                            $.growl.error({ message: msg });
                            const chart = $(containerIDWithHash).highcharts();
                            chart && chart.showLoading(msg);
                            console.error(err);
                        }).then(() => {
                            const chart = $(containerIDWithHash).highcharts();
                            /* the data is loaded but is not applied yet, its on the js event loop,
                               wait till the chart data is applied and then add the indicators */
                            setTimeout(() => {
                                chart && chart.set_indicators(indicators); // put back removed indicators
                                overlays.forEach((ovlay) => {
                                    overlay(containerIDWithHash, ovlay.symbol, ovlay.displaySymbol, ovlay.delay_amount);
                                });
                            }, 0);
                        });
                    });

                    if ($.isFunction(onload)) {
                        onload();
                    }

                    if (isAffiliates() && isHideFooter()) {
                        $(this.credits.element).remove();
                        this.margin[2] = 5;
                        this.spacing[2] = 0;
                    } else {
                        this.credits.element.onclick = () => {
                            window.open(
                                'http://webtrader.binary.com',
                                '_blank'
                            );
                        }
                    }

                }
            },
            spacingLeft: 0,
            marginLeft: 45,
            /* disable the auto size labels so the Y axes become aligned */
            marginBottom: 15,
            spacingBottom: 15
        },

        navigator: {
            enabled: true,
            series: {
                id: 'navigator'
            }
        },

        plotOptions: {
            candlestick: {
                shadow: false
            },
            series: {
                events: {
                    afterAnimate: function() {
                        if (this.options.isInstrument && this.options.id !== "navigator") {
                            //this.isDirty = true;
                            //this.isDirtyData = true;

                            //Add current price indicator
                            //If we already added currentPriceLine for this series, ignore it
                            //console.log(this.options.id, this.yAxis.plotLinesAndBands);
                            this.removeCurrentPrice();
                            this.addCurrentPrice();

                            //Add mouse wheel zooming
                            $Hmw.mousewheel(containerIDWithHash);

                        }

                        this.chart.hideLoading();
                        //this.chart.redraw();
                    }
                }
            }
        },

        title: {
            text: "" //name to display
        },

        credits: {
            href: 'http://webtrader.binary.com',
            text: 'Binary.com : Webtrader',
        },

        xAxis: {
            events: {
                afterSetExtremes: function() {
                    /*console.log('This method is called every time the zoom control is changed. TODO.' +
                     'In future, I want to get more data from server if users is dragging the zoom control more.' +
                     'This will help to load data on chart forever! We can warn users if they are trying to load' +
                     'too much data!');*/
                }
            },
            labels: {
                formatter: function() {
                    const str = this.axis.defaultLabelFormatter.call(this);
                    return str.replace('.', '');
                }
            },
            ordinal: false
        },

        scrollbar: {
            liveRedraw: false
        },

        yAxis: [{
            opposite: false,
            labels: {
                formatter: function() {
                    if ($(containerIDWithHash).data("overlayIndicator")) {
                        return (this.value > 0 ? ' + ' : '') + this.value + '%';
                    } else {
                        return this.value;
                    }
                },
                align: 'center'
            }
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
            formatter: function() {
                moment.locale(lang); //Setting locale
                var s = "<i>" + moment(this.x).format("dddd, DD MMM YYYY, HH:mm:ss") + "</i><br>";
                $.each(this.points, function(i){
                    s += '<span style="color:' + this.point.color + '">\u25CF </span>';
                    if(typeof this.point.open !=="undefined") { //OHLC chart
                        s += "<b>" + this.series.name + "</b>"
                        s += "<br>" + "  Open".i18n() + ": " + this.point.open;
                        s += "<br>" + "  High".i18n() + ": " + this.point.high;
                        s += "<br>" + "  Low".i18n() + ": " + this.point.low;
                        s += "<br>" + "  Close".i18n() + ": " + this.point.close;
                    } else {
                        s += this.series.name + ": <b>" + this.point.y + "</b>";
                    }
                    s += "<br>";
                })
                return s;
            },
            enabled: true,
            enabledIndicators: true
        },

        exporting: {
            enabled: false,
            url: 'https://export.highcharts.com',
            // Naming the File
            filename: options.instrumentName.split(' ').join('_') + "(" + options.timePeriod + ")"
        }

    });
}

export const triggerReflow = (containerIDWithHash) => {
    if ($(containerIDWithHash).highcharts()) {
        $(containerIDWithHash).highcharts().reflow();
    }
}

export const refresh = function(containerIDWithHash, newTimePeriod, newChartType, indicators, overlays) {
    const instrumentCode = $(containerIDWithHash).data("instrumentCode");
    if (newTimePeriod) {
        //Unsubscribe from tickstream.
        const key = chartingRequestMap.keyFor(instrumentCode, $(containerIDWithHash).data("timePeriod"));
        chartingRequestMap.unregister(key, containerIDWithHash);
        $(containerIDWithHash).data("timePeriod", newTimePeriod);
    }
    if (newChartType) $(containerIDWithHash).data("type", newChartType);
    else newChartType = $(containerIDWithHash).data("type", newChartType);

    //Get all series details from this chart
    const chart = $(containerIDWithHash).highcharts();
    const chartObj = this;
    let loadedMarketData = [],
        series_compare = undefined;
    /* for ohlc and candlestick series_compare must NOT be percent */
    if (newChartType !== 'ohlc' && newChartType !== 'candlestick') {
        $(chart.series).each((index, series) => {
            console.log('Refreshing : ', series.options.isInstrument, series.options.name);
            if (series.options.isInstrument) {
                loadedMarketData.push(series.name);
                //There could be one valid series_compare value per chart
                series_compare = series.options.compare;
            }
        });
    }
    if (!overlays) {
        overlays = [];
        loadedMarketData.forEach((value) => {
            const marketDataObj = ins.getSpecificMarketData(value);
            if (marketDataObj.symbol != undefined && $.trim(marketDataObj.symbol) != $(containerIDWithHash).data("instrumentCode")) {
                const overlay = {
                    symbol: marketDataObj.symbol,
                    displaySymbol: value,
                    delay_amount: marketDataObj.delay_amount
                };
                overlays.push(overlay);
            }
        });
    }
    chartObj.drawChart(containerIDWithHash, {
        instrumentCode: instrumentCode,
        instrumentName: $(containerIDWithHash).data("instrumentName"),
        timePeriod: $(containerIDWithHash).data("timePeriod"),
        type: $(containerIDWithHash).data("type"),
        series_compare: series_compare,
        delayAmount: $(containerIDWithHash).data("delayAmount"),
        overlays: overlays,
        indicators: indicators
    });

}

export const addIndicator = (containerIDWithHash, options) => {
    if ($(containerIDWithHash).highcharts()) {
        const chart = $(containerIDWithHash).highcharts();
        const series = chart.series[0];
        if (series) {
            chart.addIndicator($.extend({
                id: series.options.id
            }, options));
        }
    }
}

/**
 * Function to overlay instrument on base chart
 * @param containerIDWithHash
 * @param overlayInsCode
 * @param overlayInsName
 */
export const overlay = (containerIDWithHash, overlayInsCode, overlayInsName, delayAmount) => {
    if ($(containerIDWithHash).highcharts()) {
        const chart = $(containerIDWithHash).highcharts();
        const indicator_series = chart.get_indicator_series();
        //const mainSeries_instCode     = $(containerIDWithHash).data("instrumentCode");
        //const mainSeries_instName     = $(containerIDWithHash).data("instrumentName");
        /*
            We have to first set the data to NULL and then recaculate the data and set it back
            This is needed, else highstocks throws error
         */
        const mainSeries_timePeriod = $(containerIDWithHash).data("timePeriod");
        const mainSeries_type = $(containerIDWithHash).data("type");
        chart.showLoading();
        for (let index = 0; index < chart.series.length; index++) {
            //console.log('Instrument name : ' + chart.series[index].name);
            const series = chart.series[index];
            if (series.options.isInstrument || series.options.onChartIndicator) {
                series.update({
                    compare: 'percent'
                });
            }
        }

        return new Promise((resolve, reject) => {
            liveapi.execute(() => {
                ohlc_handler.retrieveChartDataAndRender({
                    timePeriod: mainSeries_timePeriod,
                    instrumentCode: overlayInsCode,
                    containerIDWithHash: containerIDWithHash,
                    type: mainSeries_type,
                    instrumentName: overlayInsName,
                    series_compare: 'percent',
                    delayAmount: delayAmount
                }).then(() => {
                    chart && chart.set_indicator_series(indicator_series);
                    if(chart.series[0].data.length ===0){
                        console.trace();
                    }
                    resolve();
                }).catch(resolve);
            });
        });
    }
    return Promise.resolve();
}

export const changeTitle = (containerIDWithHash, newTitle) => {
    const chart = $(containerIDWithHash).highcharts();
    chart.setTitle(newTitle);
}

export default {
    drawChart,
    destroy,
    triggerReflow,
    generate_csv,
    refresh,
    addIndicator,
    overlay,
    changeTitle
}
