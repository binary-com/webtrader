/**
 * Created by Arnab Karmakar on 1/14/16.
 */
TEMA = function(data, options, indicators) {

    IndicatorBase.call(this, data, options, indicators);
    this.ema1 = null, this.ema2 = null, this.ema3 = null;

    /*
     The Triple Exponential Moving Average (TEMA) of time series 't' is:
     *      EMA1 = EMA(t,period)
     *      EMA2 = EMA(EMA1,period)
     *      EMA3 = EMA(EMA2,period))
     *      TEMA = 3*EMA1 - 3*EMA2 + EMA3
     * Do not fill any value in temaData from 0 index to options.period-1 index
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
    var ema2Data = [];
    this.ema2.indicatorData.forEach(function(e) {
        ema2Data.push({time : e.time, close : e.value});
    });
    this.ema3 = new EMA(ema2Data, {
        period : options.period,
        appliedTo : indicators.CLOSE
    }, indicators);

    for (var index = 0; index < data.length; index++) {
        var tema1Value = this.ema1.indicatorData[index].value;
        var tema2Value = this.ema2.indicatorData[index].value;
        var tema3Value = this.ema3.indicatorData[index].value;
        var tema = toFixed(3 * tema1Value - 3 * tema2Value + tema3Value, 4);
        this.indicatorData.push({ time : data[index].time, value : tema });
    }

};

TEMA.prototype = Object.create(IndicatorBase.prototype);
TEMA.prototype.constructor = TEMA;

TEMA.prototype.addPoint = function(data) {
    var tema1Value = this.ema1.addPoint(data)[0].value;
    var tema2Value = this.ema2.addPoint({ time : data.time, close : tema1Value})[0].value;
    var tema3Value = this.ema3.addPoint({ time : data.time, close : tema2Value})[0].value;
    var tema = toFixed(3 * tema1Value - 3 * tema2Value + tema3Value, 4);
    this.indicatorData.push({ time : data.time, value : tema });
    return [{
        id : this.uniqueID,
        value : tema
    }];
};

TEMA.prototype.update = function(data) {
    var index = this.indicatorData.length - 1;
    var tema1Value = this.ema1.update(data)[0].value;
    var tema2Value = this.ema2.update({ time : data.time, close : tema1Value})[0].value;
    var tema3Value = this.ema3.update({ time : data.time, close : tema2Value})[0].value;
    var tema = toFixed(3 * tema1Value - 3 * tema2Value + tema3Value, 4);
    this.indicatorData[index].value = tema;
    return [{
        id : this.uniqueID,
        value : tema
    }];
};

TEMA.prototype.toString = function() {
    return 'TEMA (' + this.options.period  + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
