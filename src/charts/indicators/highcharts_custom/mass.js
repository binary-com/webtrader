/**
 * Created by Mahboob.M on 2/9/16.
 */
MASS = function (data, options, indicators) {

    options.singleMaType = (options.singleMaType || 'SMA').toUpperCase();
    options.doubleMaType = (options.doubleMaType || 'SMA').toUpperCase();
    IndicatorBase.call(this, data, options, indicators);
    /*
    Single EMA = 9-period exponential moving average (EMA) of the high-low differential  
    Double EMA = 9-period EMA of the 9-period EMA of the high-low differential 
    EMA Ratio = Single EMA divided by Double EMA 
    Mass Index = 25-period sum of the EMA Ratio 
   */

    this.calculateMassValue = function (index) {
        var sum = 0;
        for (var i = 0; i < this.options.period ; i++) {
            sum += this.ratioData[index - i].value;
        };
        return toFixed(sum, 4);
    };

    var highLowData = [];
    for (var index = 0; index < data.length; index++) {
        var value = data[index].high - data[index].low;
        highLowData.push({ time: data[index].time, close: value });
    };
    this.singleMA = new window[options.singleMaType](highLowData, { maType: options.singleMaType, period: options.singlePeriod }, indicators)

    singleMAData = [];
    this.singleMA.indicatorData.forEach(function (singleMA) {
        singleMAData.push({ time: singleMA.time, close: singleMA.value });
    });
    this.doubleMA = new window[options.doubleMaType](singleMAData, { maType: options.doubleMaType, period: options.doublePeriod }, indicators);

    var index = 0, _this = this;
    this.ratioData = [];
    this.singleMA.indicatorData.forEach(function (singleMA) {
        var maRatio = 0;
        if (_this.doubleMA.indicatorData[index].value !== 0) { maRatio = singleMA.value / _this.doubleMA.indicatorData[index].value };
        _this.ratioData.push({ time: data[index].time, value: maRatio });
        index++;
    });

    for (var index = 0; index < data.length; index++) {
        if (index >= this.options.period) {
            var mass = this.calculateMassValue(index);
            this.indicatorData.push({ time: data[index].time, value: mass });
        }
        else {
            this.indicatorData.push({ time: data[index].time, value: 0 });
        };
    };
};

MASS.prototype = Object.create(IndicatorBase.prototype);
MASS.prototype.constructor = MASS;

MASS.prototype.addPoint = function (data) {
    var index = this.indicatorData.length - 1;
    var highLowDiffValue = data.high - data.low;
    var singleMA = this.singleMA.addPoint({ time: data.time, close: highLowDiffValue })[0].value;
    var doubleMA = this.doubleMA.addPoint({ time: data.time, close: singleMA })[0].value;
    this.ratioData.push({ time: data.time, value: (doubleMA !== 0 ? singleMA / doubleMA : 0) });
    var mass = this.calculateMassValue(index);
    this.indicatorData.push({ time: data.time, value: mass });
    return [{
        id: this.uniqueID,
        value: mass,
    }];
};

MASS.prototype.update = function (data) {
    var index = this.indicatorData.length - 1;
    var highLowDiffValue = data.high - data.low;
    var singleMA = this.singleMA.update({ time: data.time, close: highLowDiffValue })[0].value;
    var doubleMA = this.doubleMA.update({ time: data.time, close: singleMA })[0].value;
    this.ratioData[index].value = doubleMA !== 0 ? singleMA / doubleMA : 0;
    var mass = this.calculateMassValue(index);
    this.indicatorData[index].value = mass;
    return [{
        id: this.uniqueID,
        value: mass
    }];
};

MASS.prototype.toString = function () {
    return 'MASS (' + this.options.singlePeriod + ', ' + this.options.doublePeriod + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
