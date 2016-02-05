/**
 * Created by Mahboob.M on 5/2/16.
 */

CC = function (data, options, indicators) {

    IndicatorBase.call(this, data, options, indicators);
    /* Coppock = WMA[10] of  (ROC[14] + ROC[11]).*/
    this.shortRoc = new ROC(data, { period: options.shortRocPeriod, appliedTo: options.appliedTo }, indicators);
    this.longRoc = new ROC(data, { period: options.longRocPeriod, appliedTo: options.appliedTo }, indicators);

    rocData=[];
    for (var index = 0; index < data.length; index++) {
        rocData.push({ time: data[index].time, close: this.shortRoc.indicatorData[index].value + this.longRoc.indicatorData[index].value });
    };

    this.wmaData = new WMA(rocData, { period: options.wmaPeriod }, indicators);
    this.indicatorData = this.wmaData.indicatorData;
};

CC.prototype = Object.create(IndicatorBase.prototype);
CC.prototype.constructor = CC;

CC.prototype.addPoint = function (data) {
    console.log('Adding CC data point : ', data);
    var shortRoc = this.shortRoc.addPoint(data)[0].value;
    var longRoc = this.longRoc.addPoint(data)[0].value;
    var cc = this.wmaData.addPoint({ time: data.time, close: shortRoc + longRoc })[0].value;
    this.indicatorData = this.wmaData.indicatorData;
    return [{
        id: this.uniqueID,
        value: cc
    }];
};

CC.prototype.update = function (data) {
    console.log('Updating CC data point : ', data);
    var shortRoc = this.shortRoc.update(data)[0].value;
    var longRoc = this.longRoc.update(data)[0].value;
    var cc = this.wmaData.update({ time: data.time, close: shortRoc + longRoc })[0].value;
    this.indicatorData = this.wmaData.indicatorData;
    return [{
        id: this.uniqueID,
        value: cc
    }];
};

CC.prototype.toString = function () {
    return 'CC (' + this.options.shortRocPeriod + ', ' + this.options.longRocPeriod + ', ' + this.options.wmaPeriod + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
