/**
 * Created by Mahboob.M on 1/22/16.
 */

LWMA = function (data, options, indicators) {

    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];

    /* LWMA :
    LWMA = SUM(Close(i)*i, N)/SUM(i, N)
    Where: 
    SUM(i, N) — is the total sum of weight coefficients.*/

    for (var index = 0; index < data.length; index++) {
        if (index >= (this.options.period - 1)) {
            var sum = 0.0;
            var sumI = 0.0;
            for (var i = this.options.period - 1; i >= 0; i--) {
                sum += indicators.getIndicatorOrPriceValue(data[index - i], this.options.appliedTo) * (index - i);
                sumI += index - i;
            }
            var lwma = toFixed(sum / sumI, 4);
            this.indicatorData.push({ time: data[index].time, value: lwma });
        } else {
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
        }
        this.priceData.push(data[index]);
    }
};

LWMA.prototype = Object.create(IndicatorBase.prototype);
LWMA.prototype.constructor = LWMA;

LWMA.prototype.addPoint = function (data) {
    console.log('Adding LWMA data point : ', data);
    this.priceData.push(data);
    var sum = 0.0;
    var sumI = 0.0;
    for (var i = this.options.period - 1; i >= 0; i--) {
        var index = this.priceData.length - 1;
        sum += this.indicators.getIndicatorOrPriceValue(this.priceData[index - i], this.options.appliedTo) * (index - i);
        sumI += index - i;
    }
    var lwma = toFixed(sum / sumI, 4);
    this.indicatorData.push({ time: data.time, value: lwma });
    return [{
        id: this.uniqueID,
        value: lwma
    }];
};

LWMA.prototype.update = function (data) {
    console.log('Updating LWMA data point : ', data);
    var sum = 0.0, sumI=0.0 ,index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    for (var i = this.options.period - 1; i >= 0; i--) {
        sum += this.indicators.getIndicatorOrPriceValue(this.priceData[index - i], this.options.appliedTo) * (index - i);
        sumI += index - i;
    }
    var lwma = toFixed(sum / sumI, 4);
    this.indicatorData[index].value = lwma;
    return [{
        id: this.uniqueID,
        value: lwma
    }];
};

LWMA.prototype.toString = function () {
    return 'LWMA (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
