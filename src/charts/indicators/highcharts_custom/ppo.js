/**
 * Created by Mahboob.M on 2/1/16.
 */
PPO = function (data, options, indicators) {

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
    //ppo, signal, histogarm
    this.uniqueID = [uuid(), uuid(), uuid()];

    /*
    PPO 
    *PPO Line: ((12-day EMA - 26-day EMA)/26-day EMA) x 100
    * Signal Line: 9-day EMA of PPO 
    * PPO Histogram: PPO Line - Signal Line
    */
    for (var index = 0; index < data.length; index++) {
        var ppoValue = 0;
        if (this.slowMa.indicatorData[index].value !== 0)
        {
            ppoValue = toFixed((((this.fastMa.indicatorData[index].value - this.slowMa.indicatorData[index].value) / this.slowMa.indicatorData[index].value) * 100), 4)
        };
        this.indicatorData.push({ time: data[index].time, value: ppoValue ,close :ppoValue});
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

PPO.prototype = Object.create(IndicatorBase.prototype);
PPO.prototype.constructor = PPO;

PPO.prototype.addPoint = function (data) {
    var fastMa = this.fastMa.addPoint(data)[0].value;
    var slowMa = this.slowMa.addPoint(data)[0].value;
    var ppoValue = 0;
    if (slowMa !== 0)
    {
        ppoValue = toFixed((((fastMa - slowMa) / slowMa) * 100), 4);
    };
    var signalMa = this.signalMa.addPoint({ time: data.time, close: ppoValue })[0].value;
    var histogramValue = toFixed((ppoValue - signalMa), 4);
    this.signalData = this.signalMa.indicatorData;
    this.histogramData.push({ time: data.time, value: histogramValue });
    this.indicatorData.push({ time: data.time, value: ppoValue });
    return [{
        id: this.uniqueID[0],
        value: ppoValue
    }, {
        id: this.uniqueID[1],
        value: signalMa
    }, {
        id: this.uniqueID[2],
        value: histogramValue
    }];
};

PPO.prototype.update = function (data) {
    var index = this.indicatorData.length - 1;
    var fastMa = this.fastMa.update(data)[0].value;
    var slowMa = this.slowMa.update(data)[0].value;
    var ppoValue = 0;
    if (slowMa !== 0)
    {
        ppoValue = toFixed((((fastMa - slowMa) / slowMa) * 100), 4);
    };
    var signalMa = this.signalMa.update({ time: data.time, close: ppoValue })[0].value;
    var histogramValue = toFixed((ppoValue - signalMa), 4);
    this.signalData = this.signalMa.indicatorData;
    this.histogramData[index].value = histogramValue;
    this.indicatorData[index].value = ppoValue;
    return [{
        id: this.uniqueID[0],
        value: ppoValue
    }, {
        id: this.uniqueID[1],
        value: signalMa
    }, {
        id: this.uniqueID[2],
        value: histogramValue
    }];
};

PPO.prototype.toString = function () {
    return 'PPO (' + this.options.fastPeriod + ', ' + this.options.slowPeriod + ', ' + this.options.signalPeriod + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};

/**
 * @param indicatorMetadata
 * @returns {*[]}
 */
PPO.prototype.buildSeriesAndAxisConfFromData = function (indicatorMetadata) {
    var ppoData = [];
    //Prepare the data before sending a configuration
    this.indicatorData.forEach(function (e) {
        ppoData.push([e.time, e.value]);
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
                 color: this.options.ppoHstgrmColor,
                 lineWidth: this.options.strokeWidth,
                 dashStyle: this.options.dashStyle,
                 onChartIndicator: false
             }
         },
         {
             seriesConf: {
                 id: this.uniqueID[0],
                 name: 'PPO - ' + this.toString(),
                 data: ppoData,
                 type: 'line',
                 yAxis: indicatorMetadata.id + '-' + this.uniqueID[0],
                 color: this.options.ppoStroke,
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
                 color: this.options.signalLineStroke,
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
PPO.prototype.getIDs = function () {
    return this.uniqueID;
};

/**
 * If all the unique IDs generated by this instance is same as what is passed in the parameter,
 * then we consider this instance to be same as what caller is looking for
 * @param uniqueIDArr
 * @returns {boolean}
 */
PPO.prototype.isSameInstance = function (uniqueIDArr) {
    return _.isEqual(uniqueIDArr.sort(), this.uniqueID);
};
