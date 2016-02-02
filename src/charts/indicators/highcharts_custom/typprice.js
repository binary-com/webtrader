/**
 * Created by Mahboob.M on 1/28/16.
 */

TYPPRICE = function (data, options, indicators) {

    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
    for (var index = 0; index < data.length; index++) {
        var typprice = toFixed(((data[index].high + data[index].low + data[index].close) / 3), 4);
        this.indicatorData.push({ time: data[index].time, value: typprice });
        this.priceData.push(data[index]);
    }
};

TYPPRICE.prototype = Object.create(IndicatorBase.prototype);
TYPPRICE.prototype.constructor = TYPPRICE;

TYPPRICE.prototype.addPoint = function (data) {
    console.log('Adding TYPPRICE data point : ', data);
    this.priceData.push(data);
     /* TYPPRICE :
     typprice =  (High + Low + Close) / 3 */
    var typprice = toFixed(((data.high + data.low + data.close) / 3), 4);
    this.indicatorData.push({ time: data.time, value: typprice });
    return [{
        id: this.uniqueID,
        value: typprice
    }];
};

TYPPRICE.prototype.update = function (data) {
    console.log('Updating TYPPRICE data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var typprice = toFixed(((data.high + data.low + data.close) / 3), 4);
    this.indicatorData[index].value = typprice;
    return [{
        id: this.uniqueID,
        value: typprice
    }];
};

TYPPRICE.prototype.toString = function () {
    return 'TYPPRICE (' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
