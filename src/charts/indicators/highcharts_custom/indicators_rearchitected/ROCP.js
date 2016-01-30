/**
 * Created by Mahboob.M on 1/29/16.
 */

ROCP = function (data, options, indicators) {
    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
    /*
    * Formula(OHLC or Candlestick) -
    * ROCP = [(Close - Close n periods ago) / (Close n periods ago)]
    * ROCP = (Current Price / Price of n bars ago)-1.0)
    * n - period
    */
    for (var index = 0; index < data.length; index++) {
        if (index >= (this.options.period)) {
            var rocp = toFixed(((data[index].close - data[index - this.options.period].close) / data[index - this.options.period].close), 4);
            this.indicatorData.push({ time: data[index].time, value: rocp });
        } else {
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
        }
        this.priceData.push(data[index]);
    }
};

ROCP.prototype = Object.create(IndicatorBase.prototype);
ROCP.prototype.constructor = ROCP;

ROCP.prototype.addPoint = function (data) {
    console.log('Adding ROCP data point : ', data);
    this.priceData.push(data);
    var index = this.priceData.length - 1;
    var rocp = toFixed(((this.priceData[index].close - this.priceData[index - this.options.period].close) / this.priceData[index - this.options.period].close), 4);
    this.indicatorData.push({ time: data.time, value: rocp });
    return [{
        id: this.uniqueID,
        value: rocp
    }];
};

ROCP.prototype.update = function (data) {
    console.log('Updating ROCP data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var rocp = toFixed(((this.priceData[index].close - this.priceData[index - this.options.period].close) / this.priceData[index - this.options.period].close), 4);
    this.indicatorData[index].value = rocp;
    return [{
        id: this.uniqueID,
        value: rocp
    }];
};

ROCP.prototype.toString = function () {
    return 'ROCP (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
