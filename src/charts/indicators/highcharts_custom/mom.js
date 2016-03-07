/**
 * Created by Mahboob.M on 2/2/16.
 */

MOM = function (data, options, indicators) {
    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
    /*
    * Formula(OHLC or Candlestick) -
    * 	MOM = CLOSE(i) - CLOSE(i-N)*100
    * 		n - period
    */
    for (var index = 0; index < data.length; index++) {
        if (index >= (this.options.period)) {
            var price = this.indicators.getIndicatorOrPriceValue(data[index], this.options.appliedTo);
            var nPrePrice = this.indicators.getIndicatorOrPriceValue(data[index - this.options.period], this.options.appliedTo);
            var mom = toFixed(((price - nPrePrice) * 100), 4);
            this.indicatorData.push({ time: data[index].time, value: mom });
        } else {
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
        }
        this.priceData.push(data[index]);
    }
};

MOM.prototype = Object.create(IndicatorBase.prototype);
MOM.prototype.constructor = MOM;

MOM.prototype.addPoint = function (data) {
    console.log('Adding MOM data point : ', data);
    this.priceData.push(data);
    var index = this.priceData.length - 1;
    var price = this.indicators.getIndicatorOrPriceValue(this.priceData[index], this.options.appliedTo);
    var nPrePrice = this.indicators.getIndicatorOrPriceValue(this.priceData[index - this.options.period], this.options.appliedTo);
    var mom = toFixed(((price - nPrePrice) * 100), 4);
    this.indicatorData.push({ time: data.time, value: mom });
    return [{
        id: this.uniqueID,
        value: mom
    }];
};

MOM.prototype.update = function (data) {
    console.log('Updating MOM data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var price = this.indicators.getIndicatorOrPriceValue(this.priceData[index], this.options.appliedTo);
    var nPrePrice = this.indicators.getIndicatorOrPriceValue(this.priceData[index - this.options.period], this.options.appliedTo);
    var mom = toFixed(((price - nPrePrice) * 100), 4);
    this.indicatorData[index].value = mom;
    return [{
        id: this.uniqueID,
        value: mom
    }];
};

MOM.prototype.toString = function () {
    return 'MOM (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
