/**
 * Created by Mahboob.M on 3/2/16.
 */
VAR = function(data, options, indicators) {

    if (_.isUndefined(options.appliedTo)) {
        options.appliedTo = indicators.CLOSE;
    }
    IndicatorBase.call(this, data, options, indicators);
    this.sma = new SMA(data, options, indicators);
    this.priceData = [];
    this.CalculateVARValue = function (data, index) {
        /*
        * Formula -
        // variance  :
        // 	1-Calculate the average (mean) price for the number of periods or observations.
        // 	2-Determine each period's deviation (close less average price).
        // 	3-Square each period's deviation.
        // 	4-Sum the squared deviations.
        // 	5-Divide this sum by the number of observations.
        */
        var sum = 0.0;
        for (var i = this.options.period - 1; i >= 0; i--) {
            sum += Math.pow(indicators.getIndicatorOrPriceValue(data[index - i], this.options.appliedTo) - this.sma.indicatorData[index - i].value, 2)
        }
        var varValue = sum / (this.options.period - 1);
        return toFixed(varValue, 4);
    };
 
   for (var index = 0; index < data.length; index++)
    {
        if (index >= options.period) {
            var varValue = this.CalculateVARValue(data, index);
            this.indicatorData.push({
                time: data[index].time,
                value: varValue
            });
        }
        else {
            this.indicatorData.push({ time : data[index].time, value : 0.0 });
        }
        this.priceData.push(data[index]);
    }
};

VAR.prototype = Object.create(IndicatorBase.prototype);
VAR.prototype.constructor = VAR;

/**
 * @param data
 * @returns {*[]}
 */
VAR.prototype.addPoint = function(data) {
    this.priceData.push(data);
    this.sma.addPoint(data);
    var index = this.priceData.length - 1;
    var varValue = this.CalculateVARValue(this.priceData, index);
    this.indicatorData.push({
        time: data.time,
        value: varValue
    });
    return [{
        id : this.uniqueID,
        value : varValue
    }];
};

/**
 * @param data
 * @returns {*[]}
 */
VAR.prototype.update = function(data) {
    var index = this.priceData.length - 1;
    this.priceData[index].open  = data.open;
    this.priceData[index].high  = data.high;
    this.priceData[index].low   = data.low;
    this.priceData[index].close = data.close;
    this.sma.update(data);
    var varValue = this.CalculateVARValue(this.priceData, index);
    this.indicatorData[index].value = varValue;
    return [{
        id : this.uniqueID,
        value : varValue
    }];
};

/**
 * @returns {string}
 */
VAR.prototype.toString = function() {
    return 'VAR (' + this.options.period + ')';
};

//VAR.prototype.buildSeriesAndAxisConfFromData = function(indicatorMetadata) {
//    var confObjects = IndicatorBase.prototype.buildSeriesAndAxisConfFromData.call(this, indicatorMetadata);
//    confObjects.forEach(function(confObject) {
//        confObject.axisConf.title.x = 73;
//    });
//    return confObjects;
//};
