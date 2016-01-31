/**
 * Created by Mahboob.M on 1/29/16.
 */

MAX = function (data, options, indicators) {
    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
    this.CalculateMAXValue = function (data, index) {
        /* MAX :
         max = max price over n, n - period*/
        var max = this.indicators.getIndicatorOrPriceValue(data[index], this.options.appliedTo);
        for (var i = 0; i < this.options.period; i++) {
            var tempValue = this.indicators.getIndicatorOrPriceValue(data[index - i], this.options.appliedTo);
            max = Math.max(max, tempValue);
        }
        return toFixed(max, 4);
    };
    for (var index = 0; index < data.length; index++) {
        if (index >= (this.options.period - 1)) {
            var max = this.CalculateMAXValue(data, index);
            this.indicatorData.push({ time: data[index].time, value: max });
        } else {
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
        }
        this.priceData.push(data[index]);
    }
};

MAX.prototype = Object.create(IndicatorBase.prototype);
MAX.prototype.constructor = MAX;

MAX.prototype.addPoint = function (data) {
    console.log('Adding MAX data point : ', data);
    this.priceData.push(data);
    var max = this.CalculateMAXValue(this.priceData, this.priceData.length - 1);
    this.indicatorData.push({ time: data.time, value: max });
    return [{
        id: this.uniqueID,
        value: max
    }];
};

MAX.prototype.update = function (data) {
    console.log('Updating MAX data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var max = this.CalculateMAXValue(this.priceData, index);
    this.indicatorData[index].value = max;
    return [{
        id: this.uniqueID,
        value: max
    }];
};

MAX.prototype.toString = function () {
    return 'MAX (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
