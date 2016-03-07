/**
 * Created by Mahboob.M on 2/7/16.
 */

ADXR = function (data, options, indicators) {

    IndicatorBase.call(this, data, options, indicators);
    /*ADXR = ADXR[i] = (ADX[i] + ADX[i-n]) / 2*/
    this.adx = new ADX(data, options, indicators);
    for (var index = 0; index < data.length ; index++)
    {
        if (index >= this.options.period) {
            var adxr = (this.adx.indicatorData[index].value + this.adx.indicatorData[index - this.options.period].value) / 2
            this.indicatorData.push({ time: data[index].time, value: toFixed(adxr, 4) });
        }
        else {
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
        };
    }
    
};

ADXR.prototype = Object.create(IndicatorBase.prototype);
ADXR.prototype.constructor = ADXR;

ADXR.prototype.addPoint = function (data) {
    console.log('Adding ADXR data point : ', data);
    var adx = this.adx.addPoint(data)[0].value;
    var index = this.adx.indicatorData.length - 1;
    var adxr = (adx + this.adx.indicatorData[index - this.options.period].value) / 2;
    this.indicatorData.push({ time: data.time, value: toFixed(adxr, 4) });
    return [{
        id: this.uniqueID,
        value: adxr
    }];
};

ADXR.prototype.update = function (data) {
    console.log('Updating ADXR data point : ', data);
    var adx = this.adx.update(data)[0].value;
    var index = this.adx.indicatorData.length - 1;
    var adxr = (adx + this.adx.indicatorData[index - this.options.period].value) / 2;
    this.indicatorData[index].value = toFixed(adxr, 4);
    return [{
        id: this.uniqueID,
        value: adxr
    }];
};

ADXR.prototype.toString = function () {
    return  'ADXR (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
