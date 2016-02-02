/**
 * Created by Arnab Karmakar on 1/13/16.
 */

/**
 * Initialize a new ATR indicator
 * @param data in [{time, open, high, low, close}, {time, open, high, low, close}] format
 * @param options - ATR parameters passed from UI (user selection)
 * @constructor
 */
ATR = function(data, options, indicators) {

    IndicatorBase.call(this, data, options, indicators);
    this.tr = [];
    this.priceData = [];
    /*
     * Formula -
     * 	tr(t) = max[(high - low), abs(high - close(t - 1)), abs(low - close(t - 1))]
     * 	atr(t) = (atr(t-1) x (n - 1) + tr(t)) / n
     * 		t - current
     * 		n - period
     */
    //Calculate ATR data
    for (var index = 0; index < data.length; index++)
    {

        //Calculate TR - start
        if (index == 0)
        {
            this.tr.push({
                time: data[index].time,
                value: data[index].high - data[index].low
            });
        }
        else
        {
            var price = indicators.getIndicatorOrPriceValue(data[index - 1], this.options.appliedTo);
            this.tr.push({
                time: data[index].time,
                value: Math.max(Math.max(data[index].high - data[index].low, Math.abs(data[index].high - price))
                    , data[index].low - price
                )
            });
        }
        //Calculate TR - end

        //Calculate ATR - start
        if (index >= options.period)
        {
            var atrValue = (this.indicatorData[index - 1].value * (options.period - 1) + this.tr[index].value) / options.period;
            if (isFinite(atrValue) && !isNaN(atrValue))
            {
                this.indicatorData.push({
                    time: data[index].time,
                    value: toFixed(atrValue, 4)
                });
            }
        }
        else
        {
            this.indicatorData.push({ time : data[index].time, value : 0.0 });
        }
        //Calculate ATR - end
         this.priceData.push(data[index]);
    }
};

ATR.prototype = Object.create(IndicatorBase.prototype);
ATR.prototype.constructor = ATR;

/**
 * Adds a new ATR point at the end
 * @param data
 * @returns {*[]}
 */
ATR.prototype.addPoint = function (data) {
    this.priceData.push(data);
    var index = this.priceData.length - 1;
    /*tr(t) = max[(high - low), abs(high - close(t - 1)), abs(low - close(t - 1))]
    atr(t) = (atr(t-1) x (n - 1) + tr(t)) / n*/
    var prePrice = this.indicators.getIndicatorOrPriceValue(this.priceData[index - 1], this.options.appliedTo);
    var trValue = Math.max(Math.max(data.high - data.low, Math.abs(data.high - prePrice)), (data.low - prePrice));
    var atrValue = toFixed(((this.indicatorData[index - 1].value * (this.options.period - 1) + trValue) / this.options.period), 4);
    this.indicatorData.push({
        time : data.time,
        value : atrValue
    });
    this.tr.push({
        time : data.time,
        value : trValue
    });
    return [{
        id : this.uniqueID,
        value : atrValue
    }];
};

/**
 * Updates the last ATR point
 * @param data
 * @returns {*[]}
 */
ATR.prototype.update = function (data) {
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    /*tr(t) = max[(high - low), abs(high - close(t - 1)), abs(low - close(t - 1))]
    atr(t) = (atr(t-1) x (n - 1) + tr(t)) / n*/
    var prePrice = this.indicators.getIndicatorOrPriceValue(this.priceData[index - 1], this.options.appliedTo);
    var trValue = Math.max(Math.max(data.high - data.low, Math.abs(data.high - prePrice)), (data.low - prePrice));
    var atrValue = toFixed(((this.indicatorData[index - 1].value * (this.options.period - 1) + trValue) / this.options.period), 4);
    this.indicatorData[this.indicatorData.length - 1].value = atrValue;
    this.tr[this.indicatorData.length - 1].value = trValue;
    return [{
        id : this.uniqueID,
        value : atrValue
    }];
};

/**
 * @returns {string}
 */
ATR.prototype.toString = function() {
    return 'ATR (' + this.options.period + ')';
};
