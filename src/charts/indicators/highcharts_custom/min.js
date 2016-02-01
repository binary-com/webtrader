/**
 * Created by Mahboob.M on 1/29/16.
 */

MIN = function (data, options, indicators) {
    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
    this.CalculateMINValue = function (data, index) {
        /* MIN :
         min = min price over n, n - period*/
        var min = this.indicators.getIndicatorOrPriceValue(data[index], this.options.appliedTo);
        for (var i = 0; i < this.options.period; i++) {
            var tempValue = this.indicators.getIndicatorOrPriceValue(data[index - i], this.options.appliedTo);
            min = Math.min(min, tempValue);
        }
        return toFixed(min, 4);
    };
    for (var index = 0; index < data.length; index++) {
        if (index >= (this.options.period - 1)) {
            var min = this.CalculateMINValue(data, index);
            this.indicatorData.push({ time: data[index].time, value: min });
        } else {
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
        }
        this.priceData.push(data[index]);
    }
};

MIN.prototype = Object.create(IndicatorBase.prototype);
MIN.prototype.constructor = MIN;

MIN.prototype.addPoint = function (data) {
    console.log('Adding MIN data point : ', data);
    this.priceData.push(data);
    var min = this.CalculateMINValue(this.priceData, this.priceData.length - 1);
    this.indicatorData.push({ time: data.time, value: min });
    return [{
        id: this.uniqueID,
        value: min
    }];
};

MIN.prototype.update = function (data) {
    console.log('Updating MIN data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var min = this.CalculateMINValue(this.priceData, index);
    this.indicatorData[index].value = min;
    return [{
        id: this.uniqueID,
        value: min
    }];
};

MIN.prototype.toString = function () {
    return 'MIN (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
