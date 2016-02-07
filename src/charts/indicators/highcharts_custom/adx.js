/**
 * Created by Mahboob.M on 2/6/16.
 */

ADX = function (data, options, indicators) {

    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
    /*Current High - Previous High = UpMove
    Current Low - Previous Low = DownMove
    If UpMove > DownMove and UpMove > 0, then +DM = UpMove, else +DM = 0
    If DownMove > Upmove and Downmove > 0, then -DM = DownMove, else -DM = 0
    +DI = 100 times Exponential Moving Average of (+DM / Average True Range)
    -DI = 100 times Exponential Moving Average of (-DM / Average True Range)
    ADX = 100 times the Exponential Moving Average of the Absolute Value of (+DI- -DI) / (+DI + -DI).*/
    this.atr = new ATR(data, options, indicators);

    this.calculateDMValue = function (data, index) {
        var upMove = data[index].high - data[index - 1].high;
        var downMove = data[index].low - data[index - 1].low;
        var plusDm = 0, minusDM = 0;
        if (upMove > downMove && upMove > 0)
            plusDm = upMove;
        if (downMove > upMove && downMove > 0)
            minusDM = downMove;
        return {
            plusDm: plusDm,
            minusDM: minusDM
        }
    };

    this.calculateDMData = function (data) {
        var plusDMData = [{ time: data[0].time, close: 0 }], minusDMData = [{ time: data[0].time, close: 0 }];
        for (var index = 1; index < data.length; index++) {
            var Dm = this.calculateDMValue(data, index);
            if (this.atr.indicatorData[index].value === 0) {
                plusDMData.push({ time: data[0].time, close: 0 });
                minusDMData.push({ time: data[0].time, close: 0 });
            }
            else {
                plusDMData.push({ time: data[index].time, close: (Dm.plusDm / this.atr.indicatorData[index].value) });
                minusDMData.push({ time: data[index].time, close: (Dm.minusDM / this.atr.indicatorData[index].value) });
            };
        };
        return {
            plusDMData: plusDMData,
            minusDMData: minusDMData
        }
    };

    var DM = this.calculateDMData(data);
    this.PlusDI = new window[this.options.maType](DM.plusDMData, {maType:this.options.maType ,period:this.options.period}, indicators);
    this.MinusDI = new window[this.options.maType](DM.minusDMData, {maType:this.options.maType ,period:this.options.period}, indicators);

    var maData = [];
    var index = 0, _this=this;
    this.PlusDI.indicatorData.forEach(function (plusDI) {
        var minusDI = _this.MinusDI.indicatorData[index];
        if ((plusDI.value + minusDI.value) === 0) {
            maData.push({ time: plusDI.time, close: 0 });
        } else {
            maData.push({ time: plusDI.time, close: Math.abs((plusDI.value - minusDI.value) / (plusDI.value + minusDI.value)) });
        };
        _this.priceData.push(data[index]);
        index++;
    });

    this.adxdata = new window[this.options.maType](maData, { maType: this.options.maType, period: this.options.period }, indicators);
    this.indicatorData = this.adxdata.indicatorData;
};

ADX.prototype = Object.create(IndicatorBase.prototype);
ADX.prototype.constructor = ADX;

ADX.prototype.addPoint = function (data) {
    console.log('Adding ADX data point : ', data);
    this.priceData.push(data);
    var index = this.priceData.length - 1;
    var atr = this.atr.addPoint(data)[0].value;
    var DM = this.calculateDMValue(this.priceData, index);
    var plusDI = this.PlusDI.addPoint({ time: data.time, close: (atr === 0 ? 0 : DM.plusDm / atr) })[0].value;
    var minusDI = this.MinusDI.addPoint({ time: data.time, close: (atr === 0 ? 0 : DM.minusDM / atr) })[0].value;
    var adxValue = (plusDI + minusDI) === 0 ? 0 : Math.abs((plusDI - minusDI) / (plusDI + minusDI));
    var adx = this.adxdata.addPoint({ time: data.time, close: adxValue })[0].value;
    this.indicatorData = this.adxdata.indicatorData;
    return [{
        id: this.uniqueID,
        value: adx
    }];
};

ADX.prototype.update = function (data) {
    console.log('Updating ADX data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var atr = this.atr.update(data)[0].value;
    var DM = this.calculateDMValue(this.priceData, index);
    var plusDI = this.PlusDI.update({ time: data.time, close: (atr === 0 ? 0 : DM.plusDm / atr) })[0].value;
    var minusDI = this.MinusDI.update({ time: data.time, close: (atr === 0 ? 0 : DM.minusDM / atr) })[0].value;
    var adxValue = (plusDI + minusDI) === 0 ? 0 : Math.abs((plusDI - minusDI) / (plusDI + minusDI));
    var adx = this.adxdata.update({ time: data.time, close: adxValue })[0].value;
    this.indicatorData = this.adxdata.indicatorData;
    return [{
        id: this.uniqueID,
        value: adx
    }];
};

ADX.prototype.toString = function () {
    return 'ADX (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
