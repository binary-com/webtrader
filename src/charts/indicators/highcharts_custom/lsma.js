/**
 * Created by Mahboob.M on 2/9/16.
 */

LSMA = function (data, options, indicators) {
    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
    this.CalculateLSMAValue = function (data, index) {
        /* LSMA :
         b= [nsigma(tx) - sigma(t) * sigma(x)]/[n * sigma(t) - sigm(t) * sigm(t)]
         a= (1/n sigma (x)) - (b * (1/nsigma(t)))
         lsma= b * t + a
         */
        var sumT = 0.0, sumX = 0.0, sumTX = 0.0;
        for (var i = 0; i < this.options.period; i++) {
            var price = this.indicators.getIndicatorOrPriceValue(data[index - i], this.options.appliedTo);
            sumX += price;
            sumT += index - i;
            sumTX += price * (index - i);
        };
        var b = ((this.options.period * sumTX) - (sumT * sumX)) / ((this.options.period * sumT) - (Math.pow(sumT, 2)));
        var n = 1 / this.options.period;
        var a = (n * sumX) - (b * n * sumT);
        var lsma = b * index + a;
        return toFixed(lsma, 4);
    };

    for (var index = 0; index < data.length; index++) {
        if (index >= this.options.period) {
            var lsma = this.CalculateLSMAValue(data, index);
            this.indicatorData.push({ time: data[index].time, value: lsma });
        } else {
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
        }
        this.priceData.push(data[index]);
    };
};

LSMA.prototype = Object.create(IndicatorBase.prototype);
LSMA.prototype.constructor = LSMA;

LSMA.prototype.addPoint = function (data) {
    console.log('Adding LSMA data point : ', data);
    this.priceData.push(data);
    var lsma = this.CalculateLSMAValue(this.priceData, this.priceData.length - 1);
    this.indicatorData.push({ time: data.time, value: lsma });
    return [{
        id: this.uniqueID,
        value: lsma
    }];
};

LSMA.prototype.update = function (data) {
    console.log('Updating LSMA data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var lsma = this.CalculateLSMAValue(this.priceData, index);
    this.indicatorData[index].value = lsma;
    return [{
        id: this.uniqueID,
        value: lsma
    }];
};

LSMA.prototype.toString = function () {
    return 'LSMA (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
