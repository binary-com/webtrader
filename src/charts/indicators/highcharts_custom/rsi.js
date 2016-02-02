/**
 * Created by Mahboob.M on 1/29/16.
 */

RSI = function (data, options, indicators) {
    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
    this.CalculateRSIValue = function (data, index) {
        /*
         * Formula -
         * 	rs(t) = avg-gain(n) / avg-loss(n)
         *  rsi(t) = if avg-loss(n) == 0 ? 100 : 100 - (100/ (1+rs(t))
         * 		t - current
         * 		n - period
         */
        var avgGain = 0, avgLoss = 0;
        //Calculate RS - start
        for (var i = 0 ; i < this.options.period; i++) {
            var price1 = this.indicators.getIndicatorOrPriceValue(data[index - (i + 1)], this.options.appliedTo);
            var price2 = this.indicators.getIndicatorOrPriceValue(data[index - i], this.options.appliedTo);
            if (price2 > price1) avgGain += price2 - price1;
            if (price2 < price1) avgLoss += price1 - price2;
        }
        avgGain /= this.options.period;
        avgLoss /= this.options.period;
        var rs = avgGain / avgLoss;
        //Calculate RS - end

        return toFixed((avgLoss == 0 ? 100 : (100 - (100 / (1 + rs)))),4);
    };
    for (var index = 0; index < data.length; index++) {
        if (index >= this.options.period) {
            var rsi = this.CalculateRSIValue( data, index);
            this.indicatorData.push({ time: data[index].time, value: rsi });
        } else {
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
        }
        this.priceData.push(data[index]);
    }
};


RSI.prototype = Object.create(IndicatorBase.prototype);
RSI.prototype.constructor = RSI;

RSI.prototype.addPoint = function (data) {
    console.log('Adding RSI data point : ', data);
    this.priceData.push(data);
    var rsi = this.CalculateRSIValue( this.priceData, this.priceData.length - 1);
    this.indicatorData.push({ time: data.time, value: rsi });
    return [{
        id: this.uniqueID,
        value: rsi
    }];
};

RSI.prototype.update = function (data) {
    console.log('Updating RSI data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var rsi = this.CalculateRSIValue(this.priceData, index);
    this.indicatorData[index].value = rsi;
    return [{
        id: this.uniqueID,
        value: rsi
    }];
};

RSI.prototype.toString = function () {
    return 'RSI (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
