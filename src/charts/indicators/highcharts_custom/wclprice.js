/**
 * Created by Mahboob.M on 1/28/16.
 */

WCLPRICE = function (data, options, indicators) {

    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];

    /* WCLPRICE :
    ((Close * 2)+High + Low) / 4*/
    for (var index = 0; index < data.length; index++) {
        var wclprice = toFixed(((data[index].close * 2) + data[index].high + data[index].low) / 4, 4);
        this.indicatorData.push({ time: data[index].time, value: wclprice });
        this.priceData.push(data[index]);
    }
};

WCLPRICE.prototype = Object.create(IndicatorBase.prototype);
WCLPRICE.prototype.constructor = WCLPRICE;

WCLPRICE.prototype.addPoint = function (data) {
    console.log('Adding WCLPRICE data point : ', data);
    this.priceData.push(data);
    var wclprice = toFixed(((data.close * 2) + data.high + data.low) / 4, 4)
    this.indicatorData.push({ time: data.time, value: wclprice });
    return [{
        id: this.uniqueID,
        value: wclprice
    }];
};

WCLPRICE.prototype.update = function (data) {
    console.log('Updating WCLPRICE data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var wclprice = toFixed(((data.close * 2) + data.high + data.low) / 4, 4)
    this.indicatorData[index].value = wclprice;
    return [{
        id: this.uniqueID,
        value: wclprice
    }];
};

WCLPRICE.prototype.toString = function () {
    return 'WCLPRICE (' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
