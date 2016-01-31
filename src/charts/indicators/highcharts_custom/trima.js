/**
 * Created by Arnab Karmakar on 1/15/16.
 */
TRIMA = function(data, options, indicators) {

    IndicatorBase.call(this, data, options, indicators);

    /*
     MA = ( SMA ( SMAm, Nm ) ) / Nm
     Where:
     N = Time periods + 1
     Nm = Round ( N / 2 )
     SMAm = ( Sum ( Price, Nm ) ) / Nm
     *
     *  Do not fill any value in trimaData from 0 index to options.period-1 index
     */
    var Nm = Math.round((this.options.period + 1) / 2) | 0;
    for (var index = 0; index < data.length; index++) {
        if (index === (Nm - 1)) {
            var sum = 0.0;
            for (var i = Nm - 1; i >= 0; i--) {
                sum += indicators.getIndicatorOrPriceValue(data[index - i], this.options.appliedTo);
            }
            this.indicatorData.push({ time : data[index].time, value : toFixed(sum / Nm, 4) });
        } else if(index > (Nm - 1)) {
            var preTrima = this.indicatorData[index - 1].value;
            var price = indicators.getIndicatorOrPriceValue(data[index], this.options.appliedTo);
            var trima = (preTrima * (Nm - 1) + price) / Nm;
            this.indicatorData.push({ time : data[index].time, value : toFixed(trima, 4) });
        } else {
            this.indicatorData.push({ time : data[index].time, value : 0.0 });
        }
    }

};

TRIMA.prototype = Object.create(IndicatorBase.prototype);
TRIMA.prototype.constructor = TRIMA;

TRIMA.prototype.addPoint = function(data) {
    var Nm = Math.round((this.options.period + 1) / 2) | 0;
    var index = this.indicatorData.length - 1;
    var preTrima = this.indicatorData[index].value;
    var price = this.indicators.getIndicatorOrPriceValue(data, this.options.appliedTo);
    var trima = (preTrima * (Nm - 1) + price) / Nm;
    trima = toFixed(trima, 4);
    this.indicatorData.push({ time : data.time, value : trima });
    return [{
        id : this.uniqueID,
        value : trima
    }];
};

TRIMA.prototype.update = function(data) {
    var Nm = Math.round((this.options.period + 1) / 2) | 0;
    var index = this.indicatorData.length - 1;
    var preTrima = this.indicatorData[index - 1].value;
    var price = this.indicators.getIndicatorOrPriceValue(data, this.options.appliedTo);
    var trima = (preTrima * (Nm - 1) + price) / Nm;
    trima = toFixed(trima, 4);
    this.indicatorData[index].value = trima;
    return [{
        id : this.uniqueID,
        value : trima
    }];
};

TRIMA.prototype.toString = function() {
    return 'TRIMA (' + this.options.period  + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};
