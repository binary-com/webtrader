/**
 * Created by Arnab Karmakar on 1/14/16.
 */
BBANDS = function(data, options, indicators) {

    options.maType = (options.maType || 'SMA').toUpperCase();
    IndicatorBase.call(this, data, options, indicators);
    this.ma = new window[options.maType](data, options, indicators);
    this.stddev = new STDDEV(data, options, indicators);
    this.indicatorData = this.ma.indicatorData;
    this.upperBandData = [];
    this.lowerBandData = [];
    this.areaRangeData = [];
    //4 unique IDs for 4 series to be rendered
    //middle, upper, lower, arearange
    this.uniqueID = [uuid(), uuid(), uuid(), uuid()];

    /*
     Bollinger Bands:
     * Middle Band = 20-day simple moving average (SMA)
     * Upper Band = 20-day SMA + (20-day standard deviation of price x 2)
     * Lower Band = 20-day SMA - (20-day standard deviation of price x 2)
     */
    for (var index = 0; index < data.length; index++) {
        var upper = toFixed(this.ma.indicatorData[index].value + this.stddev.indicatorData[index].value * options.devUp, 4);
        var lower = toFixed(this.ma.indicatorData[index].value - this.stddev.indicatorData[index].value * options.devDn, 4);
        this.upperBandData.push({ time : data[index].time, value : upper });
        this.lowerBandData.push({ time : data[index].time, value : lower });
        this.areaRangeData.push({ time : data[index].time, value : [upper, lower] });
    }

};

BBANDS.prototype = Object.create(IndicatorBase.prototype);
BBANDS.prototype.constructor = BBANDS;

BBANDS.prototype.addPoint = function(data) {
    var ma = this.ma.addPoint(data)[0].value;
    var stddev = this.stddev.addPoint(data)[0].value;
    var upper = toFixed(ma + stddev * this.options.devUp, 4);
    var lower = toFixed(ma - stddev * this.options.devDn, 4);
    this.indicatorData = this.ma.indicatorData;
    this.upperBandData.push({ time : data.time, value : upper });
    this.lowerBandData.push({ time : data.time, value : lower });
    this.areaRangeData.push({ time : data.time, value : [upper, lower] });
    return [{
        id : this.uniqueID[0],
        value : ma
    }, {
        id : this.uniqueID[1],
        value : upper
    }, {
        id : this.uniqueID[2],
        value : lower
    }, {
        id : this.uniqueID[3],
        value : [upper, lower]
    }];
};

BBANDS.prototype.update = function(data) {
    var index = this.indicatorData.length - 1;
    var ma = this.ma.update(data)[0].value;
    var stddev = this.stddev.update(data)[0].value;
    var upper = toFixed(ma + stddev * this.options.devUp, 4);
    var lower = toFixed(ma - stddev * this.options.devDn, 4);
    this.indicatorData = this.ma.indicatorData;
    this.upperBandData[index].value = upper;
    this.lowerBandData[index].value = lower;
    this.areaRangeData[index].value = [upper, lower];
    return [{
        id : this.uniqueID[0],
        value : ma
    }, {
        id : this.uniqueID[1],
        value : upper
    }, {
        id : this.uniqueID[2],
        value : lower
    }, {
        id : this.uniqueID[3],
        value : [upper, lower]
    }];
};

BBANDS.prototype.toString = function() {
    return 'BBANDS (' + this.options.period  + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ', ' + this.options.devUp + ', ' + this.options.devDn + ')';
};

/**
 * @param indicatorMetadata
 * @returns {*[]}
 */
BBANDS.prototype.buildSeriesAndAxisConfFromData = function(indicatorMetadata) {
    var middleData = [];
    //Prepare the data before sending a configuration
    this.indicatorData.forEach(function(e) {
        middleData.push([e.time, e.value]);
    });
    var upperData = [];
    this.upperBandData.forEach(function(e) {
        upperData.push([e.time, e.value]);
    });
    var lowerData = [];
    this.lowerBandData.forEach(function(e) {
        lowerData.push([e.time, e.value]);
    });
    var rangeData = [];
    this.areaRangeData.forEach(function(e) {
        rangeData.push(_.flattenDeep([e.time, e.value]));
    });
    return [
        {
            seriesConf : {
                id: this.uniqueID[0],
                name: 'Middle - ' + this.toString(),
                data: middleData,
                type: 'line',
                color: this.options.stroke,
                lineWidth: this.options.strokeWidth,
                dashStyle: this.options.dashStyle,
                onChartIndicator: true
            }
        },
        {
            seriesConf : {
                id: this.uniqueID[1],
                name: 'Upper - ' + this.toString(),
                data: upperData,
                type: 'line',
                color: this.options.stroke,
                lineWidth: this.options.strokeWidth,
                dashStyle: this.options.dashStyle,
                onChartIndicator: true
            }
        },
        {
            seriesConf : {
                id: this.uniqueID[2],
                name: 'Lower - ' + this.toString(),
                data: lowerData,
                type: 'line',
                color: this.options.stroke,
                lineWidth: this.options.strokeWidth,
                dashStyle: this.options.dashStyle,
                onChartIndicator: true
            }
        },
        {
            seriesConf: {
                id: this.uniqueID[3],
                data: rangeData,
                name: "BBANDS Range",
                type: 'arearange',
                color: 'white',
                fillColor: this.options.backgroundColor,
                connectNulls: true,
                //Following properties, states, events, dataLabels, point are needed. Otherwise higcharts-more throws error
                states: {
                    hover: {
                        enabled: false
                    }
                },
                events: {},
                dataLabels: {
                    enabled: false
                },
                point: {
                    events: {}
                },
                enableMouseTracking: false,
                onChartIndicator: true
            }
        }
    ];
};

/**
 * This method will return all IDs that are used to identify data series configuration
 * in the buildSeriesAndAxisConfFromData method.
 * @returns {*[]}
 */
BBANDS.prototype.getIDs = function() {
    return this.uniqueID;
};

/**
 * If all the unique IDs generated by this instance is same as what is passed in the parameter,
 * then we consider this instance to be same as what caller is looking for
 * @param uniqueIDArr
 * @returns {boolean}
 */
BBANDS.prototype.isSameInstance = function(uniqueIDArr) {
    return _.isEqual(uniqueIDArr.sort(), this.uniqueID);
};
