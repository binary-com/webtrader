/**
 * Created by Mahboob.M on 1/30/16.
 */
MACD = function (data, options, indicators) {

    options.fastMaType = (options.fastMaType || 'SMA').toUpperCase();
    options.slowMaType = (options.slowMaType || 'SMA').toUpperCase();
    options.signalMaType = (options.signalMaType || 'SMA').toUpperCase();
    IndicatorBase.call(this, data, options, indicators);
    var slowOptions = { maType: options.slowMaType, period: options.slowPeriod, appliedTo: options.appliedTo },
        fastOprions = { maType: options.fastMaType, period: options.fastPeriod, appliedTo: options.appliedTo },
        signalOptions = { maType: options.signalMaType, period: options.signalPeriod + options.slowPeriod - 1 };
    this.fastMa = new window[options.fastMaType](data, fastOprions, indicators);
    this.slowMa = new window[options.slowMaType](data, slowOptions, indicators);
    this.histogramData = [];
    //3 unique IDs for 3 series to be rendered
    //macd, signal, histogarm
    this.uniqueID = [uuid(), uuid(), uuid()];

    /*
    MACD 
    *MACD Line: (12-day EMA - 26-day EMA)
    * Signal Line: 9-day EMA of MACD Line
    * MACD Histogram: MACD Line - Signal Line
    */
    for (var index = 0; index < data.length; index++) {
        var macdValue = toFixed((this.fastMa.indicatorData[index].value - this.slowMa.indicatorData[index].value), 4);
        this.indicatorData.push({ time: data[index].time, value: macdValue ,close :macdValue});
    }
    this.signalMa = new window[options.signalMaType](this.indicatorData, signalOptions, indicators);
    this.signalData = this.signalMa.indicatorData;

    var index = 0;
    var _this = this;
    this.indicatorData.forEach(function (e) {
        var histogramValue = toFixed((e.value - _this.signalData[index].value), 4);
        _this.histogramData.push({ time: data[index].time, value: histogramValue });
        index++;
    });
};

MACD.prototype = Object.create(IndicatorBase.prototype);
MACD.prototype.constructor = MACD;

MACD.prototype.addPoint = function (data) {
    var fastMa = this.fastMa.addPoint(data)[0].value;
    var slowMa = this.slowMa.addPoint(data)[0].value;
    var macdValue = toFixed((fastMa - slowMa), 4);
    var signalMa = this.signalMa.addPoint({ time: data.time, close: macdValue })[0].value;
    var histogramValue = toFixed((macdValue - signalMa), 4);
    this.signalData = this.signalMa.indicatorData;
    this.histogramData.push({ time: data.time, value: histogramValue });
    this.indicatorData.push({ time: data.time, value: macdValue });
    return [{
        id: this.uniqueID[0],
        value: macdValue
    }, {
        id: this.uniqueID[1],
        value: signalMa
    }, {
        id: this.uniqueID[2],
        value: histogramValue
    }];
};

MACD.prototype.update = function (data) {
    var index = this.indicatorData.length - 1;
    var fastMa = this.fastMa.update(data)[0].value;
    var slowMa = this.slowMa.update(data)[0].value;
    var macdValue = toFixed((fastMa - slowMa), 4);
    var signalMa = this.signalMa.update({ time: data.time, close: macdValue })[0].value;
    var histogramValue = toFixed((macdValue - signalMa), 4);
    this.signalData = this.signalMa.indicatorData;
    this.histogramData[index].value = histogramValue;
    this.indicatorData[index].value = macdValue;
    return [{
        id: this.uniqueID[0],
        value: macdValue
    }, {
        id: this.uniqueID[1],
        value: signalMa
    }, {
        id: this.uniqueID[2],
        value: histogramValue
    }];
};

MACD.prototype.toString = function () {
    return 'MACD (' + this.options.fastPeriod + ', ' + this.options.slowPeriod + ', ' + this.options.signalPeriod + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};

/**
 * @param indicatorMetadata
 * @returns {*[]}
 */
MACD.prototype.buildSeriesAndAxisConfFromData = function (indicatorMetadata) {
    var macdData = [];
    //Prepare the data before sending a configuration
    this.indicatorData.forEach(function (e) {
        macdData.push([e.time, e.value]);
    });
    var signaldata = [];
    this.signalData.forEach(function (e) {
        signaldata.push([e.time, e.value]);
    });
    var histogramData = [];
    this.histogramData.forEach(function (e) {
        histogramData.push([e.time, e.value]);
    });

    return [{
            axisConf: { // Secondary yAxis
                id: indicatorMetadata.id + '-' + this.uniqueID[0],
                title: {
                    text: this.toString(),
                    align: 'high',
                    offset: 0,
                    rotation: 0,
                    y: 10, //Trying to show title inside the indicator chart
                    x: 30+ this.toString().length * 7.5
                },
                lineWidth: 2,
                plotLines: this.options.levels
             }
         },
         {
             seriesConf: {
                 id: this.uniqueID[2],
                 name: 'Histogram - ' + this.toString(),
                 data: histogramData,
                 type: 'column',
                 yAxis: indicatorMetadata.id + '-' + this.uniqueID[0],
                 color: this.options.stroke,
                 lineWidth: this.options.strokeWidth,
                 dashStyle: this.options.dashStyle,
                 onChartIndicator: false
             }
         },
         {
             seriesConf: {
                 id: this.uniqueID[0],
                 name: 'MACD - ' + this.toString(),
                 data: macdData,
                 type: 'line',
                 yAxis: indicatorMetadata.id + '-' + this.uniqueID[0],
                 color: this.options.stroke,
                 lineWidth: this.options.strokeWidth,
                 dashStyle: this.options.dashStyle,
                 onChartIndicator: false
             }
         },
         {
             seriesConf: {
                 id: this.uniqueID[1],
                 name: 'SIGNAL - ' + this.toString(),
                 data: signaldata,
                 type: 'line',
                 yAxis: indicatorMetadata.id + '-' + this.uniqueID[0],
                 color: this.options.stroke,
                 lineWidth: this.options.strokeWidth,
                 dashStyle: this.options.dashStyle,
                 onChartIndicator: false
             }
         }];
};

/**
 * This method will return all IDs that are used to identify data series configuration
 * in the buildSeriesAndAxisConfFromData method.
 * @returns {*[]}
 */
MACD.prototype.getIDs = function () {
    return this.uniqueID;
};

/**
 * If all the unique IDs generated by this instance is same as what is passed in the parameter,
 * then we consider this instance to be same as what caller is looking for
 * @param uniqueIDArr
 * @returns {boolean}
 */
MACD.prototype.isSameInstance = function (uniqueIDArr) {
    return _.isEqual(uniqueIDArr.sort(), this.uniqueID);
};
