/**
 * Created by Mahboob>M on 1/30/16.
 */
T3 = function (data, options, indicators) {

    IndicatorBase.call(this, data, options, indicators);
    this.ema1 = {}, this.ema2 = {},
    this.gd1 = [], this.gd2 = [], this.gd3 = [];
    this.priceData = [];
    /*
    //Calculate T3 data
    /*
    EMA1 = EMA(x,Period)
    EMA2 = EMA(EMA1,Period)
    GD = EMA1*(1+vFactor)) - (EMA2*vFactor)
    Where vFactor is a volume factor between 0 and 1 which determines how the moving averages responds. A value of 0 returns an EMA. A value of 1 returns DEMA. 
    Tim Tillson advised or preferred a value of 0.7.
    //T3 = GD(GD(GD(t, Period, vFactor), Period, vFactor), Period, vFactor);
    */
    CalculateGD.call(this, data,'gd1', this.gd1);
    CalculateGD.call(this, this.gd1,'gd2', this.gd2);
    CalculateGD.call(this, this.gd2,'gd3', this.gd3);

    for (var index = 0; index < data.length; index++) {
        this.indicatorData.push({ time: this.gd3[index].time, value: toFixed(this.gd3[index].close, 4) });
        this.priceData.push(data[index]);
    }
};

CalculateGD =function(data ,key, gd)
{
    this.ema1[key] = new EMA(data, {
        period: this.options.period,
        appliedTo: this.options.appliedTo
    }, this.indicators);
    var ema1Data = [];
    this.ema1[key].indicatorData.forEach(function (e) {
        ema1Data.push({ time: e.time, close: e.value });
    });
    this.ema2[key] = new EMA(ema1Data, {
        period: this.options.period,
        appliedTo: this.indicators.CLOSE
    }, this.indicators);
    var ema2Data = [];
    var index = 0;
    var vFactor=this.options.vFactor;
    this.ema2[key].indicatorData.forEach(function (e) {
        ema2Data.push({ time: e.time, close: e.value });
        var gdValue = (ema1Data[index].close * (1 + vFactor)) - (e.value * vFactor);
        gd.push({ time: e.time, close: gdValue });
        index++;
    });
}

T3.prototype = Object.create(IndicatorBase.prototype);
T3.prototype.constructor = T3;


AddT3 = function (data, index, key, gd) {
    var ema1Value = this.ema1[key].addPoint(data)[0].value;
    var ema2Value = this.ema2[key].addPoint({ time: data.time, close: ema1Value })[0].value;
    var gdValue = (ema1Value * (1 + this.options.vFactor)) - (ema2Value * this.options.vFactor);
    gd.push({ time: data.time, close: gdValue });
    return {
        time: data.time,
        close: toFixed(gdValue, 4),
    };
}

T3.prototype.addPoint = function (data) {
    this.priceData.push(data);
    var index = this.priceData.length - 1;
    var gd1Value = AddT3.call(this, data, index, 'gd1', this.gd1);
    var gd2Value = AddT3.call(this, gd1Value, index, 'gd2', this.gd2);
    var gd3Value = AddT3.call(this, gd2Value, index, 'gd3', this.gd3);
    this.indicatorData.push({ time: data.time, value: gd3Value.close });
    return [{
        id: this.uniqueID,
        value: gd3Value.close
    }];
};


UpdateT3 = function (data, index, key, gd) {
    var ema1Value = this.ema1[key].update(data)[0].value;
    var ema2Value = this.ema2[key].update({ time: data.time, close: ema1Value })[0].value;
    var gdValue = (ema1Value * (1 + this.options.vFactor)) - (ema2Value * this.options.vFactor);
    gd[index] = ({ time: data.time, close: gdValue });
    return {
        time: data.time,
        close: toFixed(gdValue, 4),
    };
}

T3.prototype.update = function (data) {
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var index = this.priceData.length - 1;
    var gd1Value = UpdateT3.call(this, data, index, 'gd1', this.gd1);
    var gd2Value = UpdateT3.call(this, gd1Value, index, 'gd2', this.gd2);
    var gd3Value = UpdateT3.call(this, gd2Value, index, 'gd3', this.gd3);
    this.indicatorData.push({ time: data.time, value: gd3Value.close });
    return [{
        id: this.uniqueID,
        value: gd3Value.close
    }];
};

T3.prototype.toString = function () {
    return 'T3 (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
