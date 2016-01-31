/**
 * Created by Mahboob.M on 1/22/16.
 */

KAMA = function (data, options, indicators) {

    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
    this.CalculateKAMAValue = function (data, index) {
        var fastestSC = 2 / (this.options.fastPeriod + 1);
        var slowestSC = 2 / (this.options.slowPeriod + 1);
        //Change = ABS(Close - Close (10 periods ago))
        var change = Math.abs(this.indicators.getIndicatorOrPriceValue(data[index], this.options.appliedTo)
            - this.indicators.getIndicatorOrPriceValue(this.priceData[index - this.options.period], this.options.appliedTo));
        var sum = 0.0;
        for (var i = 0; i < this.options.period; i++) {
            //Volatility = Sum10(ABS(Close - Prior Close))
            sum += Math.abs(this.indicators.getIndicatorOrPriceValue(data[index - i], this.options.appliedTo)
                - this.indicators.getIndicatorOrPriceValue(this.priceData[index - (i + 1)], this.options.appliedTo));
        }
        var er = change / sum;
        var sc = Math.pow((er * (fastestSC - slowestSC) + slowestSC), 2);
        var price = this.indicators.getIndicatorOrPriceValue(data[index], this.options.appliedTo);
        var preKama = this.indicatorData[index - 1].value;
        var kama = toFixed(preKama + sc * (price - preKama), 4);
        return kama;
    };
    /* KAMA :
    Change = ABS(Close - Close (10 periods ago))
    Volatility = Sum10(ABS(Close - Prior Close))
    ER = Change/Volatility
    fastest SC = 2/(fastest + 1);
    slowest SC = 2/(slowest + 1);
    SC = [ER x (fastest SC - slowest SC) + slowest SC]2
    Current KAMA = Prior KAMA + SC * (Price - Prior KAMA)*/
    for (var index = 0; index < data.length; index++) {
        if (index > (this.options.period - 1)) {
            var kama = this.CalculateKAMAValue(data, index);
            this.indicatorData.push({ time: data[index].time, value: kama });
        } else if (index === (this.options.period - 1)) {
            var kama = toFixed(indicators.getIndicatorOrPriceValue(data[index], this.options.appliedTo), 4);
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
        } else {
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
        }
        this.priceData.push(data[index]);
    }
};


KAMA.prototype = Object.create(IndicatorBase.prototype);
KAMA.prototype.constructor = KAMA;

KAMA.prototype.addPoint = function (data) {
    console.log('Adding KAMA data point : ', data);
    this.priceData.push(data);
    var kama = this.CalculateKAMAValue(this.priceData, this.priceData.length - 1);
    this.indicatorData.push({ time: data.time, value: kama });
    return [{
        id: this.uniqueID,
        value: kama
    }];
};

KAMA.prototype.update = function (data) {
    console.log('Updating KAMA data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var kama = this.CalculateKAMAValue(this.priceData, index);
    this.indicatorData[index].value = kama;
    return [{
        id: this.uniqueID,
        value: kama
    }];
};

KAMA.prototype.toString = function () {
    return 'KAMA (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
