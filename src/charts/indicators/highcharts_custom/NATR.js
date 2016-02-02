/**
 * Created by Mahboob.M on 1/29/16.
 */

NATR = function (data, options, indicators) {

    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
    /*Calculate ATR
    NATR = ATR(n) / Close * 100
    Where: ATR(n) = Average True Range over ‘n’ periods.*/
    this.atr = new window['ATR'](data, options, indicators);

    for (var index = 0; index < data.length; index++) {
        if (index >= (this.options.period - 1)) {
            var price = indicators.getIndicatorOrPriceValue(data[index], this.options.appliedTo);
            var natr = toFixed(((this.atr.indicatorData[index].value / price) * 100), 4);
            this.indicatorData.push({ time: data[index].time, value: natr });
        } else {
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
        }
        this.priceData.push(data[index]);
    }
};

NATR.prototype = Object.create(IndicatorBase.prototype);
NATR.prototype.constructor = NATR;

NATR.prototype.addPoint = function (data) {
    console.log('Adding NATR data point : ', data);
    this.priceData.push(data);
    var index = this.priceData.length - 1;
    var atr = this.atr.addPoint(data)[0].value;
    var price = this.indicators.getIndicatorOrPriceValue(data, this.options.appliedTo);
    var natr = toFixed(((atr / price) * 100), 4);
    this.indicatorData.push({ time: data.time, value: natr });
    return [{
        id: this.uniqueID,
        value: natr
    }];
};

NATR.prototype.update = function (data) {
    console.log('Updating NATR data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var atr = this.atr.update(data)[0].value;;
    var price = this.indicators.getIndicatorOrPriceValue(data, this.options.appliedTo);
    var natr = toFixed(((atr / price) * 100), 4);
    this.indicatorData[index].value = natr;
    return [{
        id: this.uniqueID,
        value: natr
    }];
};

NATR.prototype.toString = function () {
    return 'NATR (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
