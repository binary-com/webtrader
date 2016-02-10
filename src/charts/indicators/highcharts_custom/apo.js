/**
 * Created by Mahboob.M on 2/7/16.
 */
APO = function (data, options, indicators) {

    options.fastMaType = (options.fastMaType || 'SMA').toUpperCase();
    options.slowMaType = (options.slowMaType || 'SMA').toUpperCase();
    IndicatorBase.call(this, data, options, indicators);
    var slowOptions = { maType: options.slowMaType, period: options.slowPeriod, appliedTo: options.appliedTo },
        fastOprions = { maType: options.fastMaType, period: options.fastPeriod, appliedTo: options.appliedTo };
    this.fastMa = new window[options.fastMaType](data, fastOprions, indicators);
    this.slowMa = new window[options.slowMaType](data, slowOptions, indicators);

    /* APO = Fast Moving Average - Slow Moving Average */
    for (var index = 0; index < data.length; index++) {
        if (index >= this.options.slowPeriod) {
            var apoValue = toFixed((this.fastMa.indicatorData[index].value - this.slowMa.indicatorData[index].value), 4);
            this.indicatorData.push({ time: data[index].time, value: apoValue });
        }
        else {
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
        };
    }
};

APO.prototype = Object.create(IndicatorBase.prototype);
APO.prototype.constructor = APO;

APO.prototype.addPoint = function (data) {
    var fastMa = this.fastMa.addPoint(data)[0].value;
    var slowMa = this.slowMa.addPoint(data)[0].value;
    var apoValue = toFixed((fastMa - slowMa), 4);
    this.indicatorData.push({ time: data.time, value: apoValue });
    return [{
        id: this.uniqueID,
        value: apoValue
    }];
};

APO.prototype.update = function (data) {
    var index = this.indicatorData.length - 1;
    var fastMa = this.fastMa.update(data)[0].value;
    var slowMa = this.slowMa.update(data)[0].value;
    var apoValue = toFixed((fastMa - slowMa), 4);
    this.indicatorData[index].value = apoValue;
    return [{
        id: this.uniqueID,
        value: apoValue
    }];
};

APO.prototype.toString = function () {
    return 'APO (' + this.options.fastPeriod + ', ' + this.options.slowPeriod + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
