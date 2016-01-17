/**
 * Created by Arnab Karmakar on 1/14/16.
 */
DEMA = function(data, options, indicators) {

    IndicatorBase.call(this, data, options, indicators);
    this.ema1 = null, this.ema2 = null;

    /*
     The Double Exponential Moving Average (DEMA) of time series 't' is:
     *      EMA1 = EMA(t,period)
     *      EMA2 = EMA(EMA1,period)
     *      DEMA = 2 * EMA1 - EMA2
     * Do not fill any value in DemaData from 0 index to options.period-1 index
     */
    this.ema1 = new EMA(data, {
        period : options.period,
        appliedTo : options.appliedTo
    }, indicators);
    var ema1Data = [];
    this.ema1.indicatorData.forEach(function(e) {
        ema1Data.push({time : e.time, close : e.value});
    });
    this.ema2 = new EMA(ema1Data, {
        period : options.period,
        appliedTo : indicators.CLOSE
    }, indicators);

    for (var index = 0; index < data.length; index++) {
        var dema1Value = this.ema1.indicatorData[index].value;
        var dema2Value = this.ema2.indicatorData[index].value;
        var dema = toFixed(2 * dema1Value - dema2Value, 4);
        this.indicatorData.push({ time : data[index].time, value : dema });
    }

};

DEMA.prototype = Object.create(IndicatorBase.prototype);
DEMA.prototype.constructor = DEMA;

DEMA.prototype.addPoint = function(data) {
    var dema1Value = this.ema1.addPoint(data)[0].value;
    var dema2Value = this.ema2.addPoint({ time : data.time, close : dema1Value})[0].value;
    var dema = toFixed(2 * dema1Value - dema2Value, 4);
    this.indicatorData.push({ time : data.time, value : dema });
    return [{
        id : this.uniqueID,
        value : dema
    }];
};

DEMA.prototype.update = function(data) {
    var index = this.indicatorData.length - 1;
    var dema1Value = this.ema1.update(data)[0].value;
    var dema2Value = this.ema2.update({ time : data.time, close : dema1Value})[0].value;
    var dema = toFixed(2 * dema1Value - dema2Value, 4);
    console.log('DEMA value : ', dema1Value, dema2Value, dema);
    this.indicatorData[index].value = dema;
    return [{
        id : this.uniqueID,
        value : dema
    }];
};

DEMA.prototype.toString = function() {
    return 'DEMA (' + this.options.period  + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
