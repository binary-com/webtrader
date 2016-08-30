/**
 * Created by Mahboob.M on 2/3/16.
 */

AROON = function (data, options, indicators) {
    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
    this.aroonDownData = [];

     //2 unique IDs for 2 series to be rendered
    //aroonUp and aroonDown
    this.uniqueID = [uuid(), uuid()];

    this.CalculateAROONValue = function (data, index) {
        /* AROON :
        Aroon-Up = ((25 - Days Since 25-day High)/25) x 100
        Aroon-Down = ((25 - Days Since 25-day Low)/25) x 100*/
        var max = data[index].high;
        var min = data[index].low;
        var HH = 0, LL = 0;
        for (var i = 0; i < this.options.period; i++) {
            if (data[index - i].high > max) {
                max = data[index - i].high;
                HH = i;
            }
            if (data[index - i].low < min) {
                min = data[index - i].low;
                LL = i;
            }
        };

        var aroonUp = ((this.options.period - HH) / this.options.period) * 100;
        var aroonDown = ((this.options.period - LL) / this.options.period) * 100;
        return {
            aroonUp: aroonUp,
            aroonDown: aroonDown
        };
    };

    for (var index = 0; index < data.length; index++) {
        if (index >= (this.options.period - 1)) {
            var aroon = this.CalculateAROONValue(data, index);
            this.indicatorData.push({ time: data[index].time, value: aroon.aroonUp });
            this.aroonDownData.push({ time : data[index].time, value : aroon.aroonDown });
        } else {
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
            this.aroonDownData.push({ time : data[index].time, value : 0 });
        }
        this.priceData.push(data[index]);
    }
};

AROON.prototype = Object.create(IndicatorBase.prototype);
AROON.prototype.constructor = AROON;

AROON.prototype.addPoint = function (data) {
    console.log('Adding AROON data point : ', data);
    this.priceData.push(data);
    var aroon = this.CalculateAROONValue(this.priceData, this.priceData.length - 1);
    this.indicatorData.push({ time: data.time, value: aroon.aroonUp });
    this.aroonDownData.push({ time : data.time, value : aroon.aroonDown });
    return [{
        id : this.uniqueID[0],
        value :  aroon.aroonUp
    }, {
        id : this.uniqueID[1],
        value : aroon.aroonDown
    }];
};

AROON.prototype.update = function (data) {
    console.log('Updating AROON data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var aroon = this.CalculateAROONValue(this.priceData, index);
    this.indicatorData[index].value = aroon.aroonUp;
    this.aroonDownData[index].value = aroon.aroonDown;
    return [{
        id : this.uniqueID[0],
        value :  aroon.aroonUp
    }, {
        id : this.uniqueID[1],
        value : aroon.aroonDown
    }];
};

AROON.prototype.toString = function () {
    return 'AROON (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};


/**
 * @param indicatorMetadata
 * @returns {*[]}
 */
AROON.prototype.buildSeriesAndAxisConfFromData = function (indicatorMetadata) {
    var aroonUpData = [];
    //Prepare the data before sending a configuration
    this.indicatorData.forEach(function (e) {
        aroonUpData.push([e.time, e.value]);
    });
    var aroonDownData = [];
    this.aroonDownData.forEach(function (e) {
        aroonDownData.push([e.time, e.value]);
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
                    x: 30+ this.toString().length * 7.5
                },
                lineWidth: 2,
                plotLines: this.options.levels
             }
         },
         {
             seriesConf: {
                 id: this.uniqueID[0],
                 name: 'AROONUP - ' + this.toString(),
                 data: aroonUpData,
                 type: 'line',
                 yAxis: indicatorMetadata.id + '-' + this.uniqueID[0],
                 color: this.options.aroonUpStroke,
                 lineWidth: this.options.strokeWidth,
                 dashStyle: this.options.dashStyle,
                 onChartIndicator: false
             }
         },
         {
             seriesConf: {
                 id: this.uniqueID[1],
                 name: 'AROONDOWN - ' + this.toString(),
                 data: aroonDownData,
                 type: 'line',
                 yAxis: indicatorMetadata.id + '-' + this.uniqueID[0],
                 color: this.options.aroonDownStroke,
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
AROON.prototype.getIDs = function () {
    return this.uniqueID;
};

/**
 * If all the unique IDs generated by this instance is same as what is passed in the parameter,
 * then we consider this instance to be same as what caller is looking for
 * @param uniqueIDArr
 * @returns {boolean}
 */
AROON.prototype.isSameInstance = function (uniqueIDArr) {
    return _.isEqual(uniqueIDArr.sort(), this.uniqueID);
};
