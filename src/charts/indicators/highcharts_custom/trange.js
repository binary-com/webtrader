/**
 * Created by Mahboob.M on 2/2/16.
 */

TRANGE = function(data, options, indicators) {

    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
    /*
     * Formula -
     * 	trange(t) = max[(high - low), abs(high - close(t - 1)), abs(low - close(t - 1))]
     * 		t - current
     * 		n - period
     */
    //Calculate TRANGE data
    for (var index = 0; index < data.length; index++)
    {
        if (index === 0)
        {
            this.indicatorData.push({
                time: data[index].time,
                value: data[index].high - data[index].low
            });
        }
        else
        {
            var price = indicators.getIndicatorOrPriceValue(data[index - 1], this.options.appliedTo);
            var trValue = Math.max(Math.max(data[index].high - data[index].low, Math.abs(data[index].high - price)), (data[index].low - price));
            this.indicatorData.push({ time: data[index].time, value: toFixed(trValue, 4) });
        }
        this.priceData.push(data[index]);
    }
};

TRANGE.prototype = Object.create(IndicatorBase.prototype);
TRANGE.prototype.constructor = TRANGE;

TRANGE.prototype.addPoint = function (data) {
    this.priceData.push(data);
    var index = this.priceData.length - 1;
    /*tr(t) = max[(high - low), abs(high - close(t - 1)), abs(low - close(t - 1))]*/
    var prePrice = this.indicators.getIndicatorOrPriceValue(this.priceData[index - 1], this.options.appliedTo);
    var trValue = Math.max(Math.max(data.high - data.low, Math.abs(data.high - prePrice)), (data.low - prePrice));
    this.indicatorData.push({ time: data.time, value: toFixed(trValue, 4) });
    return [{
        id : this.uniqueID,
        value : trValue
    }];
};

TRANGE.prototype.update = function (data) {
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    /*tr(t) = max[(high - low), abs(high - close(t - 1)), abs(low - close(t - 1))]*/
    var prePrice = this.indicators.getIndicatorOrPriceValue(this.priceData[index - 1], this.options.appliedTo);
    var trValue = Math.max(Math.max(data.high - data.low, Math.abs(data.high - prePrice)), (data.low - prePrice));
    this.indicatorData[this.indicatorData.length - 1].value = toFixed(trValue, 4);
    return [{
        id : this.uniqueID,
        value : trValue
    }];
};

/**
 * @returns {string}
 */
TRANGE.prototype.toString = function() {
    return 'TRANGE (' + this.options.period + ')';
};
