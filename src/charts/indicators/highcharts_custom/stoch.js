/**
 * Created by Mahboob.M on 2/8/16.
 */
STOCH = function(data, options, indicators) {

    options.fastDMaType = (options.fastDMaType || 'SMA').toUpperCase();
    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
    //2 unique IDs for 2 series to be rendered
    this.uniqueID = [uuid(), uuid()];

    this.calculateStochValue = function (data, index) {
      /*
      %K = (Current Close - Lowest Low)/(Highest High - Lowest Low) * 100
      %D = 3-day SMA of %K
      Lowest Low = lowest low for the look-back period
      Highest High = highest high for the look-back period
      %K is multiplied by 100 to move the decimal point two places
      */
        var lowestLow = data[index].low, hiestHigh = data[index].high;
        for (var i = 0; i < this.options.fastKPeriod; i++) {
            lowestLow = Math.min(data[index - i].low, lowestLow);
            hiestHigh = Math.max(data[index - i].high, hiestHigh);
        };
        var kValue = 0;
        if (hiestHigh - lowestLow !== 0) {
            kValue = ((this.indicators.getIndicatorOrPriceValue(data[index], this.options.appliedTo) - lowestLow) / (hiestHigh - lowestLow)) * 100;
        };

        return toFixed(kValue, 4);
    };
   
    for (var index = 0; index < data.length; index++) {
        if (index >= this.options.fastKPeriod) {
            var kValue = this.calculateStochValue(data, index);
            this.indicatorData.push({ time: data[index].time, value: kValue, close: kValue });
        }
        else {
            this.indicatorData.push({ time: data[index].time, value: 0, close: 0 });
        }

        this.priceData.push(data[index]);
    };

    this.dData = new window[options.fastDMaType](this.indicatorData, { period: this.options.fastDPeriod, maType: this.options.fastDMaType }, indicators);

};

STOCH.prototype = Object.create(IndicatorBase.prototype);
STOCH.prototype.constructor = STOCH;

STOCH.prototype.addPoint = function (data) {
    this.priceData.push(data);
    var index = this.priceData.length - 1;
    var kValue = this.calculateStochValue(this.priceData, index);
    var dValue = this.dData.addPoint({ time: data.time, close: kValue })[0].value;
    this.indicatorData.push({ time: data.time, value: kValue });
    return [{
        id: this.uniqueID[0],
        value: kValue
    }, {
        id: this.uniqueID[1],
        value: dValue
    }];
};

STOCH.prototype.update = function (data) {
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var kValue = this.calculateStochValue(this.priceData, index);
    var dValue = this.dData.update({ time: data.time, close: kValue })[0].value;
    this.indicatorData[index].value = kValue;
    return [{
        id: this.uniqueID[0],
        value: kValue
    }, {
        id: this.uniqueID[1],
        value: dValue
    }];
};

STOCH.prototype.toString = function() {
    return 'STOCH (' + this.options.fastKPeriod  + ', ' + this.options.fastDPeriod  + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};

/**
 * @param indicatorMetadata
 * @returns {*[]}
 */
STOCH.prototype.buildSeriesAndAxisConfFromData = function(indicatorMetadata) {
    //Prepare the data before sending a configuration
    var stochData = [];
    this.indicatorData.forEach(function (e) {
        stochData.push([e.time, e.value]);
    });
    var dData = [];
    this.dData.indicatorData.forEach(function (e) {
        dData.push([e.time, e.value]);
    });

    return [{
        axisConf: { // Secondary yAxis
            id: indicatorMetadata.id + '-' + this.uniqueID[0],
            title: {
                text: this.toString(),
                align: 'high',
                offset: 0,
                rotation: 0,
                y: 10,
                x: 30 + this.toString().length * 7.5
            },
            lineWidth: 2,
            plotLines: this.options.levels
          }
        },
        {
             seriesConf: {
                 id: this.uniqueID[0],
                 name: this.toString(),
                 data: stochData,
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
                name: '%D',
                data: dData,
                type: 'line',
                yAxis: indicatorMetadata.id + '-' + this.uniqueID[0],
                color: this.options.dStroke,
                lineWidth: this.options.strokeWidth,
                dashStyle: this.options.dashStyle,
                onChartIndicator: false
            }
        }
    ];
};

/**
 * This method will return all IDs that are used to identify data series configuration
 * in the buildSeriesAndAxisConfFromData method.
 * @returns {*[]}
 */
STOCH.prototype.getIDs = function() {
    return this.uniqueID;
};

/**
 * If all the unique IDs generated by this instance is same as what is passed in the parameter,
 * then we consider this instance to be same as what caller is looking for
 * @param uniqueIDArr
 * @returns {boolean}
 */
STOCH.prototype.isSameInstance = function(uniqueIDArr) {
    return _.isEqual(uniqueIDArr.sort(), this.uniqueID);
};
