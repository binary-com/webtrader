/**
 * Created by Arnab Karmakar on 1/14/16.
 */
SMA = function(data, options, indicators) {

    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];

    /*
     Daily Closing Prices: 11,12,13,14,15,16,17
     First day of 5-day SMA: (11 + 12 + 13 + 14 + 15) / 5 = 13
     Second day of 5-day SMA: (12 + 13 + 14 + 15 + 16) / 5 = 14
     Third day of 5-day SMA: (13 + 14 + 15 + 16 + 17) / 5 = 15
     Do not fill any value in smaData from 0 index to options.period-1 index
     */
    for (var index = 0; index < data.length; index++) {
        if (index >= (this.options.period - 1)) {
            var sum = 0.0;
            for (var i = this.options.period - 1; i >= 0; i--) {
                sum += indicators.getIndicatorOrPriceValue(data[index - i], this.options.appliedTo);
            }
            var sma = toFixed(sum / this.options.period, 4);
            this.indicatorData.push({ time : data[index].time, value : sma });
        } else {
            this.indicatorData.push({ time : data[index].time, value : 0.0 });
        }
        this.priceData.push(data[index]);
    }
    console.log('Last price data : ', this.priceData[this.priceData.length - 1]);

};

SMA.prototype = Object.create(IndicatorBase.prototype);
SMA.prototype.constructor = SMA;

SMA.prototype.addPoint = function(data) {
    console.log('Adding SMA data point : ', data);
    this.priceData.push(data);
    var sum = 0.0;
    for (var i = this.options.period - 1; i >= 0; i--) {
        sum += this.indicators.getIndicatorOrPriceValue(this.priceData[this.priceData.length - 1 - i], this.options.appliedTo);
    }
    var sma = toFixed(sum / this.options.period, 4);
    this.indicatorData.push({ time : data.time, value : sma });
    return [{
        id : this.uniqueID,
        value : sma
    }];
};

SMA.prototype.update = function(data) {
    console.log('Updating SMA data point : ', data);
    var sum = 0.0, index = this.priceData.length - 1;
    this.priceData[index].open  = data.open;
    this.priceData[index].high  = data.high;
    this.priceData[index].low   = data.low;
    this.priceData[index].close = data.close;
    for (var i = this.options.period - 1; i >= 0; i--) {
        sum += this.indicators.getIndicatorOrPriceValue(this.priceData[index - i], this.options.appliedTo);
    }
    var sma = toFixed(sum / this.options.period, 4);
    this.indicatorData[index].value = sma;
    return [{
        id : this.uniqueID,
        value : sma
    }];
};

SMA.prototype.toString = function() {
    return 'SMA (' + this.options.period  + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
