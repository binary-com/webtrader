/**
 * Created by Mahboob.M on 1/30/16.
 */

SMMA = function (data, options, indicators) {
    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
    this.CalculateSMMAValue = function (data, index) {
        /* SMMA :
         //PREVSUM = SMMA(i - 1) * N
         //SMMA(i) = (PREVSUM - SMMA(i - 1) + CLOSE(i)) / N
         //SUM1 — is the total sum of closing prices for N periods;
         //PREVSUM — is the smoothed sum of the previous bar;
         //SMMA1 — is the smoothed moving average of the first bar;
         //SMMA(i) — is the smoothed moving average of the current bar (except for the first one);
         //CLOSE(i) — is the current closing price;
         //N — is the smoothing period.*/
        var preSma = this.indicatorData[index - 1].value;
        var preSum = preSma * this.options.period;
        var smmaValue = (preSum - preSma + this.indicators.getIndicatorOrPriceValue(data[index], this.options.appliedTo)) / this.options.period;
        return toFixed(smmaValue, 4);
    };
    for (var index = 0; index < data.length; index++) {
        if (index > (this.options.period - 1)) {
            var smma = this.CalculateSMMAValue( data, index);
            this.indicatorData.push({ time: data[index].time, value: smma });
        }
        else if (index === this.options.period - 1) {
            var sum = 0.0;
            for (var i = 0; i < this.options.period; i++) {
                sum += this.indicators.getIndicatorOrPriceValue(data[i], this.options.appliedTo);
            }
            var smma = toFixed(sum / this.options.period , 4);
            this.indicatorData.push({ time: data[index].time, value: smma });
        }
        else {
            this.indicatorData.push({ time: data[index].time, value: 0.0 });
        }
        this.priceData.push(data[index]);
    }
};

SMMA.prototype = Object.create(IndicatorBase.prototype);
SMMA.prototype.constructor = SMMA;

SMMA.prototype.addPoint = function (data) {
    console.log('Adding SMMA data point : ', data);
    this.priceData.push(data);
    var smma = this.CalculateSMMAValue(this.priceData, this.priceData.length - 1);
    this.indicatorData.push({ time: data.time, value: smma });
    return [{
        id: this.uniqueID,
        value: smma
    }];
};

SMMA.prototype.update = function (data) {
    console.log('Updating SMMA data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    var smma = this.CalculateSMMAValue(this.priceData, index);
    this.indicatorData[index].value = smma;
    return [{
        id: this.uniqueID,
        value: smma
    }];
};

SMMA.prototype.toString = function () {
    return 'SMMA (' + this.options.period + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
