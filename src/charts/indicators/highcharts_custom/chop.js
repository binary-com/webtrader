/**
 * Created by Mahboob.M on 2/6/16.
 */

CHOP = function (data, options, indicators) {

    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
   
    this.calculateCHOPValue = function (data, index) {
        /*Chop= 100 * LOG10( SUM(ATR(1), n) / ( MaxHi(n) - MinLo(n) ) ) / LOG10(n)
        n = User defined period length.
        LOG10(n) = base-10 LOG of n
        ATR(1) = Average True Range (Period of 1)
        SUM(ATR(1), n) = Sum of the Average True Range over past n bars 
        MaxHi(n) = The highest high over past n bars.*/
        var sumAtr = 0.0, highestHigh = data[index].high, lowestLow = data[index].low;
        for (var i = 0; i < this.options.period; i++) {
            sumAtr += this.atr.indicatorData[index - i].value;
            highestHigh = Math.max(data[index - i].high, highestHigh);
            lowestLow = Math.min(data[index - i].low, lowestLow);
        };
        var chop = 0;
        if ((highestHigh - lowestLow) !== 0) {
            chop = (100 * Math.log10(sumAtr / (highestHigh - lowestLow))) / Math.log10(this.options.period)
        };
        return toFixed(chop, 4);
    };

    this.atr = new ATR(data, { period: this.options.atrPeriod, appliedTo: this.options.appliedTo }, indicators);

    for (var index = 0; index < data.length; index++) {
        if (index >= options.period) {
            var chop = this.calculateCHOPValue(data, index);
            this.indicatorData.push({ time: data[index].time, value: chop });
        }
        else {
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
        }
        this.priceData.push(data[index]);
    };
};

CHOP.prototype = Object.create(IndicatorBase.prototype);
CHOP.prototype.constructor = CHOP;

CHOP.prototype.addPoint = function (data) {
    console.log('Adding CHOP data point : ', data);
    this.priceData.push(data);
    var index = this.priceData.length - 1;
    this.atr.addPoint(data)[0].value;
    var chop = this.calculateCHOPValue(this.priceData, index);
    this.indicatorData.push({ time: data.time, value: chop });
    return [{
        id: this.uniqueID,
        value: chop
    }];
};

CHOP.prototype.update = function (data) {
    console.log('Updating CHOP data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    this.atr.update(data)[0].value;
    var chop = this.calculateCHOPValue(this.priceData, index);
    this.indicatorData[index].value = chop;
    return [{
        id: this.uniqueID,
        value: chop
    }];
};

CHOP.prototype.toString = function () {
    return 'CHOP (' + this.options.period + ', ' + this.options.atrPeriod + ', '+ this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
