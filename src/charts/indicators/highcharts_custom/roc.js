/**
 * Created by Mahboob.M on 1/29/16.
 */

ROC = function (data, options, indicators) {
    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
    /*
    * Formula(OHLC or Candlestick) -
    * 	ROC = [(Close - Close n periods ago) / (Close n periods ago)] * 100
    * 		n - period
    */
    for (var index = 0; index < data.length; index++) {
        if (index >= (this.options.period)) {
            var price = this.indicators.getIndicatorOrPriceValue(data[index], this.options.appliedTo);
            var nPrePrice = this.indicators.getIndicatorOrPriceValue(data[index - this.options.period], this.options.appliedTo);
            var roc = toFixed((((price - nPrePrice) / nPrePrice) * 100), 4);
            this.indicatorData.push({ time: data[index].time, value: roc });
        } else {
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
        }
        this.priceData.push(data[index]);
    }
};

ROC.prototype = Object.create(IndicatorBase.prototype);
ROC.prototype.constructor = ROC;

ROC.prototype.addPoint = function (data) {
    console.log('Adding ROC data point : ', data);
    this.priceData.push(data);
    var index = this.priceData.length - 1;
    var price = this.indicators.getIndicatorOrPriceValue(this.priceData[index], this.options.appliedTo);
    var nPrePrice = this.indicators.getIndicatorOrPriceValue(this.priceData[index - this.options.period], this.options.appliedTo);
    var roc = toFixed((((price - nPrePrice) / nPrePrice) * 100), 4);
    this.indicatorData.push({ time: data.time, value: roc });
    return [{
        id: this.uniqueID,
        value: roc
    }];
};

ROC.prototype.update = function (data) {
    console.log('Updating ROC data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var price = this.indicators.getIndicatorOrPriceValue(this.priceData[index], this.options.appliedTo);
    var nPrePrice = this.indicators.getIndicatorOrPriceValue(this.priceData[index - this.options.period], this.options.appliedTo);
    var roc = toFixed((((price - nPrePrice) / nPrePrice) * 100), 4);
    this.indicatorData[index].value = roc;
    return [{
        id: this.uniqueID,
        value: roc
    }];
};

ROC.prototype.toString = function () {
    return 'ROC (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
