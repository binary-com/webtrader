/**
 * Created by Mahboob.M on 1/29/16.
 */

CCI = function (data, options, indicators) {

    options.maType = (options.maType || 'SMA').toUpperCase();
    IndicatorBase.call(this, data, options, indicators);
    this.tpData = [];
    this.priceData = [];
    this.CalculateCCIValue = function (data, index) {
        /* Calculate CCI
         CCI = ( M - A ) / ( 0.015 * D )
         Where:
         M = ( H + L + C ) / 3
         H = Highest price for the period
         L = Lowest price for the period
         C = Closing price for the period
         A = n period moving average of M
         D = mean deviation of the absolute value of the difference between the mean price and the moving average of mean prices, M - A
         */

        //*mean deviation of the absolute value of the difference between the mean price and  the moving average of mean prices, M - A
        var sum = 0;
        for (var i = 0; i < this.options.period - 1; i++) {
            sum += Math.abs(this.tpMa.indicatorData[index].value - this.tpData[index - i].close);
        }
        var mDevValue = sum / this.options.period;
        //* Calculate CCI
        //* CCI = ( M - A ) / ( 0.015 * D )
        var cciValue = toFixed(((this.tpData[index].close - this.tpMa.indicatorData[index].value) / (.015 * mDevValue)), 4);
        return cciValue;
    };

    //*Calculate Mean Deviation
    //*the moving average of mean prices
    for (var index = 0; index < data.length; index++) {
        var tpValue = (data[index].high + data[index].low  + data[index].close) / 3;
        this.tpData.push({ time: data[index].time, close: tpValue });
    };
    options.appliedTo = this.indicators.CLOSE;
    this.tpMa = new window[this.options.maType](this.tpData, options, indicators);

    for (var index = 0; index < data.length; index++) {
        if (index >= (this.options.period - 1)) {
            var cci = this.CalculateCCIValue(data, index, false);
            this.indicatorData.push({ time: data[index].time, value: cci });
        } else {
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
        }
        this.priceData.push(data[index]);
    }
};




CCI.prototype = Object.create(IndicatorBase.prototype);
CCI.prototype.constructor = CCI;

CCI.prototype.addPoint = function (data) {
    console.log('Adding CCI data point : ', data);
    this.priceData.push(data);
    var index = this.priceData.length - 1;
    var tpValue = (this.priceData[index].high + this.priceData[index].low + this.priceData[index].close) / 3;
    this.tpData.push({ time: data.time, close: tpValue });
    this.tpMa.addPoint(this.tpData[index]);
    var cci = this.CalculateCCIValue(this.priceData, this.priceData.length - 1 ,false);
    this.indicatorData.push({ time: data.time, value: cci });
    return [{
        id: this.uniqueID,
        value: cci
    }];
};

CCI.prototype.update = function (data) {
    console.log('Updating CCI data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var tpValue = (this.priceData[index].high + this.priceData[index].low + this.priceData[index].close) / 3;
    this.tpData[index].close = tpValue;
    this.tpMa.update(this.tpData[index]);
    var cci = this.CalculateCCIValue(this.priceData, index, false);
    this.indicatorData[index].value = cci;
    return [{
        id: this.uniqueID,
        value: cci
    }];
};

CCI.prototype.toString = function () {
    return 'CCI (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
