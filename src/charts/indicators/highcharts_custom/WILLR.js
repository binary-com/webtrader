/**
 * Created by Mahboob.M on 1/29/16.
 */

WILLR = function (data, options, indicators) {
    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
    this.calculateWILLRValue = function (data, index) {
        /* WILLR :
         %R = -100 * ( ( Highest High - Close) / (Highest High - Lowest Low ) )*/
        var highestHigh = data[index].high;
        var lowestLow = data[index].close;
        for (var i = 0; i < this.options.period; i++) {
            highestHigh = Math.max(highestHigh, data[index - i].high);
            lowestLow = Math.min(lowestLow, data[index - i].low);
        }
        var price = this.indicators.getIndicatorOrPriceValue(data[index], this.options.appliedTo);
        var willr = (-100 * (highestHigh - price)) / (highestHigh - lowestLow);
        return toFixed(willr, 4);;
    };
    for (var index = 0; index < data.length; index++) {
        if (index >= this.options.period) {
            var willr = this.calculateWILLRValue(data, index);
            this.indicatorData.push({ time: data[index].time, value: willr });
        } else {
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
        }
        this.priceData.push(data[index]);
    }
};

WILLR.prototype = Object.create(IndicatorBase.prototype);
WILLR.prototype.constructor = WILLR;

WILLR.prototype.addPoint = function (data) {
    console.log('Adding WILLR data point : ', data);
    this.priceData.push(data);
    var willr = this.calculateWILLRValue(this.priceData, this.priceData.length - 1);
    this.indicatorData.push({ time: data.time, value: willr });
    return [{
        id: this.uniqueID,
        value: willr
    }];
};

WILLR.prototype.update = function (data) {
    console.log('Updating WILLR data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var willr = this.calculateWILLRValue(this.priceData, index);
    this.indicatorData[index].value = willr;
    return [{
        id: this.uniqueID,
        value: willr
    }];
};

WILLR.prototype.toString = function () {
    return 'WILLR (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
