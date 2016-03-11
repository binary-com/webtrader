/**
 * Created by Mahboob.M on 1/29/16.
 */

STOCHRSI = function (data, options, indicators) {
    IndicatorBase.call(this, data, options, indicators);
    this.rsi = new window['RSI'](data, options, indicators);
    this.CalculateSTOCHRSIValue = function (index) {
        /*
         * Formula -
         * rs(t) = avg-gain(n) / avg-loss(n)
         * rsi(t) = if avg-loss(n) == 0 ? 100 : 100 - (100/ (1+rs(t))
         * StochRSI = (RSI - Lowest Low RSI) / (Highest High RSI - Lowest Low RSI)
         * t - current
         * n - period
         */
        var highestHigh = this.rsi.indicatorData[index].value;
        var lowestLow = this.rsi.indicatorData[index].value;
        for (var i = 0; i < this.options.period; i++) {
            highestHigh = Math.max(highestHigh, this.rsi.indicatorData[index - i].value);
            lowestLow = Math.min(lowestLow, this.rsi.indicatorData[index - i].value);
        }
        var stochrsi = 0;
        if ((highestHigh - lowestLow) !== 0) { stochrsi = (this.rsi.indicatorData[index].value - lowestLow) / (highestHigh - lowestLow) };

        return toFixed(stochrsi, 4);
    };

    for (var index = 0; index < data.length; index++) {
        if (index >= this.options.period) {
            var stochrsi = this.CalculateSTOCHRSIValue(index);
            this.indicatorData.push({ time: data[index].time, value: stochrsi });
        } else {
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
        }
    }
};


STOCHRSI.prototype = Object.create(IndicatorBase.prototype);
STOCHRSI.prototype.constructor = STOCHRSI;

STOCHRSI.prototype.addPoint = function (data) {
    console.log('Adding STOCHRSI data point : ', data);
    this.rsi.addPoint(data);
    var stochrsi = this.CalculateSTOCHRSIValue(this.indicatorData.length - 1);
    this.indicatorData.push({ time: data.time, value: stochrsi });
    return [{
        id: this.uniqueID,
        value: stochrsi
    }];
};

STOCHRSI.prototype.update = function (data) {
    console.log('Updating STOCHRSI data point : ', data);
    var index = this.indicatorData.length - 1;
    this.rsi.update(data);
    var stochrsi = this.CalculateSTOCHRSIValue(index);
    this.indicatorData[index].value = stochrsi;
    return [{
        id: this.uniqueID,
        value: stochrsi
    }];
};

STOCHRSI.prototype.toString = function () {
    return ' STOCHRSI (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
