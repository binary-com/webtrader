/**
 * Created by Mahboob.M on 2/9/16.
 */

ULTOSC = function (data, options, indicators) {
    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
    this.BP = [], this.TR = [];
    /* ULTOSC 
    BP(Buying Pressure) = Close - Minimum(Low or Prior Close).
    TR(True Range) = Maximum(High or Prior Close)  -  Minimum(Low or Prior Close)
    Average7 = (7-period BP Sum) / (7-period TR Sum)
    Average14 = (14-period BP Sum) / (14-period TR Sum)
    Average28 = (28-period BP Sum) / (28-period TR Sum)
    UO = 100 x [(4 x Average7)+(2 x Average14)+Average28]/(4+2+1)*/
    this.CalculateAVG = function (index, period) {
        var sumBp = 0, sumTr = 0;
        for (var i = 0; i < period; i++) {
            sumBp += this.BP[index - i].value;
            sumTr += this.TR[index - i].value;
        };
        return sumBp / sumTr;
    };

    this.CalculateBRTRValue =function(data,index)
    {
        var price = this.indicators.getIndicatorOrPriceValue(data[index], this.options.appliedTo);
        var prePrice = (index - 1 >= 0) ? this.indicators.getIndicatorOrPriceValue(data[index - 1], this.options.appliedTo) : 0;
        var bp = price - Math.min(data[index].low, prePrice);
        var tr = Math.max(data[index].high, prePrice) - Math.min(data[index].low, prePrice);
        return {
            bp: bp,
            tr: tr
        };
    };

    for (var index = 0; index < data.length; index++) {
        var result = this.CalculateBRTRValue(data, index);
        this.BP.push({ time: data[index].time, value: result.bp });
        this.TR.push({ time: data[index].time, value: result.tr });
    };

    for (var index = 0; index < data.length; index++) {
        if (index >= this.options.thirdPeriod) {
            var firstAvg = this.CalculateAVG(index, this.options.firstPeriod);
            var secondAvg = this.CalculateAVG(index, this.options.secondPeriod);
            var thirdAvg = this.CalculateAVG(index, this.options.thirdPeriod);
            var ultosc = toFixed((100 * ((4 * firstAvg) + (2 * secondAvg) + thirdAvg) / 7), 4);
            this.indicatorData.push({ time: data[index].time, value: ultosc });
        }
        else {
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
        }
        this.priceData.push(data[index]);
    };
};

ULTOSC.prototype = Object.create(IndicatorBase.prototype);
ULTOSC.prototype.constructor = ULTOSC;

ULTOSC.prototype.addPoint = function (data) {
    console.log('Adding ULTOSC data point : ', data);
    this.priceData.push(data);
    var index = this.priceData.length - 1;
    var result = this.CalculateBRTRValue(this.priceData, index);
    this.BP.push({ time: data.time, value: result.bp });
    this.TR.push({ time: data.time, value: result.tr });
    var firstAvg = this.CalculateAVG(index, this.options.firstPeriod);
    var secondAvg = this.CalculateAVG(index, this.options.secondPeriod);
    var thirdAvg = this.CalculateAVG(index, this.options.thirdPeriod);
    var ultosc = toFixed((100 * ((4 * firstAvg) + (2 * secondAvg) + thirdAvg) / 7), 4);
    this.indicatorData.push({ time: data.time, value: ultosc });
    return [{
        id: this.uniqueID,
        value: ultosc
    }];
};

ULTOSC.prototype.update = function (data) {
    console.log('Updating ULTOSC data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var result = this.CalculateBRTRValue(this.priceData, index);
    this.BP[index].value = result.bp;
    this.TR[index].value = result.tr;
    var firstAvg = this.CalculateAVG(index, this.options.firstPeriod);
    var secondAvg = this.CalculateAVG(index, this.options.secondPeriod);
    var thirdAvg = this.CalculateAVG(index, this.options.thirdPeriod);
    var ultosc = toFixed((100 * ((4 * firstAvg) + (2 * secondAvg) + thirdAvg) / 7), 4);
    this.indicatorData[index].value = ultosc;
    return [{
        id: this.uniqueID,
        value: ultosc
    }];
};

ULTOSC.prototype.toString = function () {
    return 'ULTOSC (' + this.options.firstPeriod + ', ' + this.options.secondPeriod + ', ' + this.options.thirdPeriod + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
