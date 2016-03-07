/**
 * Created by Mahboob.M on 2/9/16.
 */

CMO = function (data, options, indicators) {
    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
    /* CMO :
    diff = Pi - Pi-1,
    where Pi -the price (usually closing price) of the current period;
    Pi-1 -the price (usually closing price) of the previous period;
    If diff > 0, then cmo1i = diff, cmo2i = 0.
    If diff < 0, then cmo2i = -diff, cmo1i = 0.
    sum1 = Sum(cmo1, n) - summary value of cmo1 within n periods.
    sum2 = Sum(cmo2, n) - summary value of cmo2 within n periods.
    CMO = ((sum1-sum2)/(sum1+sum2))* 100
    */
    this.CalculateCMOValue = function (index) {
        var sumPos = 0, sumNeg = 0;
        for (var i = 0; i < this.options.period; i++) {
            sumPos += this.posData[index - i].value;
            sumNeg += this.negData[index - i].value;
        }
        return {
            sumPos: sumPos,
            sumNeg: sumNeg
        };
    };

    this.CalculatePosNegValue = function (data, index) {
        var diff = this.indicators.getIndicatorOrPriceValue(data[index], this.options.appliedTo) - this.indicators.getIndicatorOrPriceValue(data[index - 1], this.options.appliedTo);
        var pos = 0, neg = 0;
        if (diff > 0) { pos = diff };
        if (diff < 0) { neg = Math.abs(diff) };
        return {
            pos: pos,
            neg: neg
        };
    };

    this.posData = [{ time: data[0].time, close: 0 }], this.negData = [{ time: data[0].time, close: 0 }];
    for (var index = 1; index < data.length; index++) {
        var result = this.CalculatePosNegValue(data, index);
        this.posData.push({ time: data[index].time, value: result.pos });
        this.negData.push({ time: data[index].time, value: result.neg });
    };

    for (var index = 0; index < data.length; index++) {
        if (index >= (this.options.period - 1)) {
            var sum = this.CalculateCMOValue(index);
            var cmo = 0;
            if (sum.sumPos + sum.sumNeg !== 0)
                cmo = toFixed(((sum.sumPos - sum.sumNeg) / (sum.sumPos + sum.sumNeg) * 100), 4);
            this.indicatorData.push({ time: data[index].time, value: cmo });
        }
        else {
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
        };
        this.priceData.push(data[index]);
    };
};

CMO.prototype = Object.create(IndicatorBase.prototype);
CMO.prototype.constructor = CMO;

CMO.prototype.addPoint = function (data) {
    console.log('Adding CMO data point : ', data);
    this.priceData.push(data);
    var index = this.priceData.length - 1;
    var result = this.CalculatePosNegValue(this.priceData, index);
    this.posData.push({ time: data.time, value: result.pos });
    this.negData.push({ time: data.time, value: result.neg });
    var sum = this.CalculateCMOValue(index);
    var cmo = (sum.sumPos + sum.sumNeg !== 0) ? toFixed(((sum.sumPos - sum.sumNeg) / (sum.sumPos + sum.sumNeg) * 100), 4) : 0;
    this.indicatorData.push({ time: data.time, value: cmo });
    return [{
        id: this.uniqueID,
        value: cmo
    }];
};

CMO.prototype.update = function (data) {
    console.log('Updating CMO data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var result = this.CalculatePosNegValue(this.priceData, index);
    this.posData[index].value = result.pos;
    this.negData[index].value = result.neg;
    var sum = this.CalculateCMOValue(index);
    var cmo = (sum.sumPos + sum.sumNeg !== 0) ? toFixed(((sum.sumPos - sum.sumNeg) / (sum.sumPos + sum.sumNeg) * 100), 4) : 0;
    this.indicatorData[index].value = cmo;
    return [{
        id: this.uniqueID,
        value: cmo
    }];
};

CMO.prototype.toString = function () {
    return 'CMO (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
