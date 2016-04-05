/**
 * Created by Arnab Karmakar on 1/16/16.
 */
BOP = function(data, options, indicators) {

    IndicatorBase.call(this, data, options, indicators);

    /*
     * Formula -
         BOP = (CL - OP) / (HI - LO)
     */
    //Calculate BOP data
    for (var index = 0; index < data.length; index++)
    {
        var closePrice = data[index].close;
        var openPrice = data[index].open;
        var highPrice = data[index].high;
        var lowPrice = data[index].low;
        var bopValue = 0;
        if ((highPrice - lowPrice) !== 0) { bopValue = (closePrice - openPrice) / (highPrice - lowPrice); };
        this.indicatorData.push({
            time: data[index].time,
            value: toFixed(bopValue, 4)
        });
    }
};

BOP.prototype = Object.create(IndicatorBase.prototype);
BOP.prototype.constructor = BOP;

/**
 * @param data
 * @returns {*[]}
 */
BOP.prototype.addPoint = function(data) {
    var closePrice = data.close;
    var openPrice = data.open;
    var highPrice = data.high;
    var lowPrice = data.low;
    var bopValue = 0;
    if ((highPrice - lowPrice) !== 0) { bopValue = (closePrice - openPrice) / (highPrice - lowPrice) };
    this.indicatorData.push({
        time : data.time,
        value : bopValue
    });
    return [{
        id : this.uniqueID,
        value : bopValue
    }];
};

/**
 * @param data
 * @returns {*[]}
 */
BOP.prototype.update = function(data) {
    var closePrice = data.close;
    var openPrice = data.open;
    var highPrice = data.high;
    var lowPrice = data.low;
    var bopValue = 0;
    if ((highPrice - lowPrice) !== 0) { bopValue = (closePrice - openPrice) / (highPrice - lowPrice) };
    this.indicatorData[this.indicatorData.length - 1].value = bopValue;
    return [{
        id : this.uniqueID,
        value : bopValue
    }];
};

/**
 * @returns {string}
 */
BOP.prototype.toString = function() {
    return ' BOP';
};

BOP.prototype.buildSeriesAndAxisConfFromData = function(indicatorMetadata) {
    var confObjects = IndicatorBase.prototype.buildSeriesAndAxisConfFromData.call(this, indicatorMetadata);
    confObjects.forEach(function(confObject) {
        confObject.seriesConf.type = 'column';
    });
    return confObjects;
};
