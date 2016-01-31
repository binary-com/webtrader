/**
 * Created by Mahboob.M on 1/29/16.
 */

SUM = function (data, options, indicators) {
    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
    this.CalculateSUMValue = function (data, index) {
        /* SUM :
         sum = sum price over n, n - period*/
        var sum = 0.0;
        for (var i = 0; i < this.options.period; i++) {
            sum += this.indicators.getIndicatorOrPriceValue(data[index - i], this.options.appliedTo);
        }
        return toFixed(sum, 4);
    };
    for (var index = 0; index < data.length; index++) {
        if (index >= (this.options.period - 1)) {
            var sum = this.CalculateSUMValue(data, index);
            this.indicatorData.push({ time: data[index].time, value: sum });
        } else {
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
        }
        this.priceData.push(data[index]);
    }
};

SUM.prototype = Object.create(IndicatorBase.prototype);
SUM.prototype.constructor = SUM;

SUM.prototype.addPoint = function (data) {
    console.log('Adding SUM data point : ', data);
    this.priceData.push(data);
    var sum = this.CalculateSUMValue(this.priceData, this.priceData.length - 1);
    this.indicatorData.push({ time: data.time, value: sum });
    return [{
        id: this.uniqueID,
        value: sum
    }];
};

SUM.prototype.update = function (data) {
    console.log('Updating SUM data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var sum = this.CalculateSUMValue(this.priceData, index);
    this.indicatorData[index].value = sum;
    return [{
        id: this.uniqueID,
        value: sum
    }];
};

SUM.prototype.toString = function () {
    return 'SUM (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
