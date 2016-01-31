/**
 * Created by Mahboob.M on 1/29/16.
 */

ROCR = function (data, options, indicators) {
    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
    /*
    * Formula(OHLC or Candlestick) -
    *  ROCR = Current Price / Price of n bars ago
    * n - period
    */
    for (var index = 0; index < data.length; index++) {
        if (index >= (this.options.period)) {
            var close = data[index].close;
            var closeNPeriodAgo = data[index - this.options.period].close;
            var rocr = toFixed((close / closeNPeriodAgo), 4);
            this.indicatorData.push({ time: data[index].time, value: rocr });
        } else {
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
        }
        this.priceData.push(data[index]);
    }
};

ROCR.prototype = Object.create(IndicatorBase.prototype);
ROCR.prototype.constructor = ROCR;

ROCR.prototype.addPoint = function (data) {
    console.log('Adding ROCR data point : ', data);
    this.priceData.push(data);
    var index = this.priceData.length - 1;
    var rocr = toFixed((this.priceData[index].close / this.priceData[index - this.options.period].close), 4);
    this.indicatorData.push({ time: data.time, value: rocr });
    return [{
        id: this.uniqueID,
        value: rocr
    }];
};

ROCR.prototype.update = function (data) {
    console.log('Updating ROCR data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var rocr = toFixed((this.priceData[index].close / this.priceData[index - this.options.period].close), 4);
    this.indicatorData[index].value = rocr;
    return [{
        id: this.uniqueID,
        value: rocr
    }];
};

ROCR.prototype.toString = function () {
    return 'ROCR (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
