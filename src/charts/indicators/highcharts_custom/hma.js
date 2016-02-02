/**
 * Created by Arnab Karmakar on 1/14/16.
 */
HMA = function(data, options, indicators) {

    IndicatorBase.call(this, data, options, indicators);
    this.someTypeOfMa1 = null, this.someTypeOfMa2 = null, this.someTypeOfMa3 = null;

    // HMA(n) = WMA(2*WMA(n/2) – WMA(n)),sqrt(n))
    var maClassName = (options.maType || 'sma').toUpperCase();
    var n = Math.round(options.period / 2) | 0;
    this.someTypeOfMa1 = new window[maClassName](data, {
        period : n,
        appliedTo : options.appliedTo
    }, indicators);
    this.someTypeOfMa2 = new window[maClassName](data, {
        period : options.period,
        appliedTo : options.appliedTo
    }, indicators);

    var dataForHma = [];
    for (var index = 0; index < data.length; index++) {
        var ma1Value = this.someTypeOfMa1.indicatorData[index].value;
        var ma2Value = this.someTypeOfMa2.indicatorData[index].value;
        var ma3Value = 2 * ma1Value - ma2Value;
        dataForHma.push({ time : data[index].time, close : ma3Value });
    }
    var hmaPeriod = Math.round(Math.sqrt(options.period)) | 0;
    this.someTypeOfMa3 = new window[maClassName](dataForHma, {
        period : hmaPeriod,
        appliedTo : indicators.CLOSE
    }, indicators);
    this.indicatorData = this.someTypeOfMa3.indicatorData;

};

HMA.prototype = Object.create(IndicatorBase.prototype);
HMA.prototype.constructor = HMA;

HMA.prototype.addPoint = function(data) {
    var ma1Value = this.someTypeOfMa1.addPoint(data)[0].value;
    var ma2Value = this.someTypeOfMa2.addPoint(data)[0].value;
    var ma3Value = 2 * ma1Value - ma2Value;
    var hma = this.someTypeOfMa3.addPoint({time : data.time, close : ma3Value})[0].value;
    this.indicatorData = this.someTypeOfMa3.indicatorData;
    return [{
        id : this.uniqueID,
        value : hma
    }];
};

HMA.prototype.update = function(data) {
    var ma1Value = this.someTypeOfMa1.update(data)[0].value;
    var ma2Value = this.someTypeOfMa2.update(data)[0].value;
    var ma3Value = 2 * ma1Value - ma2Value;
    var hma = this.someTypeOfMa3.update({time : data.time, close : ma3Value})[0].value;
    this.indicatorData = this.someTypeOfMa3.indicatorData;
    return [{
        id : this.uniqueID,
        value : hma
    }];
};

HMA.prototype.toString = function() {
    return 'HMA (' + this.options.period  + ', '
        + this.indicators.appliedPriceString(this.options.appliedTo) + ', '
        + this.options.maType + ')';
};
