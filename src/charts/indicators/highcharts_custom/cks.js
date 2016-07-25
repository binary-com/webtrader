/**
 * Created by Mahboob.M on 1/29/16.
 */

CKS = function (data, options, indicators) {

    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
    this.highStops = [];
    this.lowStops = [];
    this.shortStops = [];

    //2 unique IDs for 2 series to be rendered
    //long stop line (blue) and and a short stop line (red)
    this.uniqueID = [uuid(), uuid()];

    /*Calculate CKS
    first high stop = HIGHEST[p](high) - x * Average True Range[p]
    first low stop = LOWEST[p](high) + x * Average True Range[p]
    long stop= HIGHEST[q](first high stop)
    short stop= LOWEST[q](first low stop) 
    */
    this.atr = new ATR(data, options, indicators);

    this.calculateStopValue = function (data,index) {
        var higestHigh = data[index].high;
        var lowestLow = data[index].low;
        for (var i = 0; i < this.options.period; i++) {
            if (index - i > 0) {
                higestHigh = Math.max(data[index - i].high, higestHigh);
                lowestLow = Math.min(data[index - i].low, lowestLow);
            };
        }
        var highStopValue = higestHigh - (this.options.multiplier * this.atr.indicatorData[index].value);
        var lowStopValue = lowestLow + (this.options.multiplier * this.atr.indicatorData[index].value);
        return {
            highStop: highStopValue,
            lowStop: lowStopValue
        }
    };

    this.calculateCKSValue = function (index) {
        var longStop = this.highStops[index].value;
        var shortStop = this.lowStops[index].value;
        for (var i = 0; i < this.options.maxMinPeriod; i++) {
            if (index - i > 0) {
                longStop = Math.max(this.highStops[index - i].value, longStop);
                shortStop = Math.min(this.lowStops[index - i].value, shortStop);
            };
        }
        return {
            longStop: toFixed(longStop,4),
            shortStop: toFixed(shortStop,4)
        }
    };

    for (var index = 0; index < data.length; index++) {
        var stop = this.calculateStopValue(data, index);
        this.highStops.push({ time: data[index].time, value: stop.highStop });
        this.lowStops.push({ time: data[index].time, value: stop.lowStop });
    };

    for (var index = 0; index < data.length; index++) {
        if (index >= this.options.period) {
            var cks = this.calculateCKSValue(index);
            this.indicatorData.push({ time: data[index].time, value: cks.longStop });
            this.shortStops.push({ time: data[index].time, value: cks.shortStop });
        } else {
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
            this.shortStops.push({ time: data[index].time, value: 0.0 });
        }
        this.priceData.push(data[index]);
    }
};

CKS.prototype = Object.create(IndicatorBase.prototype);
CKS.prototype.constructor = CKS;

CKS.prototype.addPoint = function (data) {
    console.log('Adding CKS data point : ', data);
    this.priceData.push(data);
    var index = this.priceData.length - 1;
    var atr = this.atr.addPoint(data)[0].value;
    var stop = this.calculateStopValue(this.priceData, index);
    this.highStops.push({ time: data.time, value: stop.highStop });
    this.lowStops.push({ time: data.time, value: stop.lowStop });
    var cks = this.calculateCKSValue(index);
    this.indicatorData.push({ time: data.time, value: cks.longStop });
    this.shortStops.push({ time: data.time, value: cks.shortStop });
     return [{
        id: this.uniqueID[1],
        value: cks.longStop
        }, {
        id: this.uniqueID[0],
        value: cks.shortStop
    }];
};

CKS.prototype.update = function (data) {
    console.log('Updating CKS data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var atr = this.atr.update(data)[0].value;;
    var stop = this.calculateStopValue(this.priceData, index);
    this.highStops[index].value = stop.highStop;
    this.lowStops[index].value = stop.lowStop;
    var cks = this.calculateCKSValue(index);
    this.indicatorData[index].value = cks.longStop;
    this.shortStops[index].value = cks.shortStop;
    return [{
        id: this.uniqueID[1],
        value: cks.longStop
        }, {
        id: this.uniqueID[0],
        value: cks.shortStop
    }];
};

CKS.prototype.toString = function () {
    return 'CKS (' + this.options.period + ', ' + this.options.maxMinPeriod + ', ' + this.options.multiplier + ')';
};


/**
 * @param indicatorMetadata
 * @returns {*[]}
 */
CKS.prototype.buildSeriesAndAxisConfFromData = function (indicatorMetadata) {

    //Prepare the data before sending a configuration
    var longStopData = [];
    this.indicatorData.forEach(function (e) {
        longStopData.push([e.time, e.value]);
    });
    var  shortStopData = [];
    this.shortStops.forEach(function (e) {
        shortStopData.push([e.time, e.value]);
    });

    return [
        {
            seriesConf: {
                id: this.uniqueID[0],
                name: 'Short Stop - ' + this.toString(),
                data: shortStopData,
                type: 'line',
                color: this.options.shortStopStroke,
                lineWidth: this.options.strokeWidth,
                dashStyle: this.options.dashStyle,
                onChartIndicator: true
            }
        },
        {
            seriesConf: {
                id: this.uniqueID[1],
                name: 'Long Stop - ' + this.toString(),
                data: longStopData,
                type: 'line',
                color: this.options.longStopStroke,
                lineWidth: this.options.strokeWidth,
                dashStyle: this.options.dashStyle,
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
CKS.prototype.getIDs = function() {
    return this.uniqueID;
};

/**
 * If all the unique IDs generated by this instance is same as what is passed in the parameter,
 * then we consider this instance to be same as what caller is looking for
 * @param uniqueIDArr
 * @returns {boolean}
 */
CKS.prototype.isSameInstance = function(uniqueIDArr) {
    return _.isEqual(uniqueIDArr.sort(), this.uniqueID);
};
