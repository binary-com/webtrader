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
            this.tr.push({
                time: data[index].time,
                value: Math.max(Math.max(data[index].high - data[index].low, Math.abs(data[index].high - data[index - 1].close))
                    , data[index].low - data[index - 1].close
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

    }
};

ATR.prototype = Object.create(IndicatorBase.prototype);
ATR.prototype.constructor = ATR;

/**
 * Adds a new ATR point at the end
 * @param data
 * @returns {*[]}
 */
ATR.prototype.addPoint = function(data) {
    var highValue = data.high;
    var lowValue = data.low;
    var closeValue = data.close;
    var tr = Math.max(Math.max(highValue - lowValue, Math.abs(highValue - closeValue)), (lowValue - closeValue));
    var atr = toFixed(( this.indicatorData[this.indicatorData.length - 1].value * (this.options.period - 1) + tr ) / this.options.period, 4) ;
    this.indicatorData.push({
        time : data.time,
        value : atr
    });
    this.tr.push({
        time : data.time,
        value : tr
    });
    return [{
        id : this.uniqueID,
        value : atr
    }];
};

/**
 * Updates the last ATR point
 * @param data
 * @returns {*[]}
 */
ATR.prototype.update = function(data) {
    var highValue = data.high;
    var lowValue = data.low;
    var closeValue = data.close;
    var tr = Math.max(Math.max(highValue - lowValue, Math.abs(highValue - closeValue)), (lowValue - closeValue));
    //I am updating this.atr[this.atr.length - 1]. So have to consider this.atr[this.atr.length - 2] for calculation
    var atr = toFixed(( this.indicatorData[this.indicatorData.length - 2].value * (this.options.period - 1) + tr ) / this.options.period, 4) ;
    this.indicatorData[this.indicatorData.length - 1].value = atr;
    this.tr[this.indicatorData.length - 1].value = tr;
    return [{
        id : this.uniqueID,
        value : atr
    }];
};

/**
 * @returns {string}
 */
ATR.prototype.toString = function() {
    return 'ATR (' + this.options.period + ')';
};
