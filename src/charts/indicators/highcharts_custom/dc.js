/**
 * Created by Mahboob.M on 2/8/16.
 */
DC = function (data, options, indicators) {

    IndicatorBase.call(this, data, options, indicators);
    this.lowData = [];
    this.areaRangeData = [];
    this.priceData = [];
    //3 unique IDs for 4 series to be rendered
    this.uniqueID = [uuid(), uuid(), uuid()];
    this.calculateDCValue = function (data, index) {
        /* It is formed by taking the highest high and the lowest low of the last n periods. The area between the high and the low is the channel for the period chosen.*/
        var highestHigh = data[index].high, lowestLow = data[index].low;
        for (var i = 0; i < this.options.period; i++) {
            if (index - i >= 0) {
                highestHigh = Math.max(data[index - i].high, highestHigh);
                lowestLow = Math.min(data[index - i].low,lowestLow);
            }
        };
        return {
            highestHigh: highestHigh,
            lowestLow: lowestLow
        };
    };
    for (var index = 0; index < data.length; index++) {
        var value = this.calculateDCValue(data, index);
        this.indicatorData.push({ time: data[index].time, value: value.highestHigh });
        this.lowData.push({ time: data[index].time, value: value.lowestLow });
        this.areaRangeData.push({ time: data[index].time, value: [value.highestHigh, value.lowestLow] });
        this.priceData.push(data[index]);
    };
};

DC.prototype = Object.create(IndicatorBase.prototype);
DC.prototype.constructor = DC;

DC.prototype.addPoint = function (data) {
    this.priceData.push(data);
    var index = this.priceData.length - 1;
    var value = this.calculateDCValue(this.priceData, index);
    this.indicatorData.push({ time: data.time, value: value.highestHigh });
    this.lowData.push({ time: data.time, value: value.lowestLow });
    this.areaRangeData.push({ time: data.time, value: [value.highestHigh, value.lowestLow] });
    return [{
        id: this.uniqueID[0],
        value: value.highestHigh
    }, {
        id: this.uniqueID[1],
        value: value.lowestLow
    }, {
        id: this.uniqueID[2],
        value: [value.highestHigh, value.lowestLow]
    }];
};

DC.prototype.update = function (data) {
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var value = this.calculateDCValue(this.priceData, index);
    this.indicatorData[index].value = value.highestHigh;
    this.lowData[index].value = value.lowestLow;
    this.areaRangeData[index].value = value.lowestLow;
    return [{
        id: this.uniqueID[0],
        value: value.highestHigh
    }, {
        id: this.uniqueID[1],
        value: value.lowestLow
    }, {
        id: this.uniqueID[2],
        value: [value.highestHigh, value.lowestLow]
    }];
};

DC.prototype.toString = function() {
    return 'DC (' + this.options.period  + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};

/**
 * @param indicatorMetadata
 * @returns {*[]}
 */
DC.prototype.buildSeriesAndAxisConfFromData = function(indicatorMetadata) {
    //Prepare the data before sending a configuration
    var highData = [];
    this.indicatorData.forEach(function(e) {
        highData.push([e.time, e.value]);
    });
    var lowData = [];
    this.lowData.forEach(function(e) {
        lowData.push([e.time, e.value]);
    });
    var rangeData = [];
    this.areaRangeData.forEach(function(e) {
        rangeData.push(_.flattenDeep([e.time, e.value]));
    });
    return [
        {
            seriesConf : {
                id: this.uniqueID[0],
                name: 'High - ' + this.toString(),
                data: highData,
                type: 'line',
                color: this.options.highStroke,
                lineWidth: this.options.strokeWidth,
                dashStyle: this.options.dashStyle,
                onChartIndicator: true
            }
        },
        {
            seriesConf : {
                id: this.uniqueID[1],
                name: 'Low - ' + this.toString(),
                data: lowData,
                type: 'line',
                color: this.options.lowStroke,
                lineWidth: this.options.strokeWidth,
                dashStyle: this.options.dashStyle,
                onChartIndicator: true
            }
        },
        {
            seriesConf: {
                id: this.uniqueID[2],
                data: rangeData,
                name: "DC Range",
                type: 'arearange',
                color: 'white',
                fillColor: 'rgba(28,28,28,0.2)',
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
DC.prototype.getIDs = function() {
    return this.uniqueID;
};

/**
 * If all the unique IDs generated by this instance is same as what is passed in the parameter,
 * then we consider this instance to be same as what caller is looking for
 * @param uniqueIDArr
 * @returns {boolean}
 */
DC.prototype.isSameInstance = function(uniqueIDArr) {
    return _.isEqual(uniqueIDArr.sort(), this.uniqueID);
};
