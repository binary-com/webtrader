/**
 * Created by Arnab Karmakar on 1/14/16.
 */
EMA = function(data, options, indicators) {

    this.options = options;
    //Calculate the initial value and store locally
    this.indicatorData = [];
    this.uniqueID = uuid();
    this.indicators = indicators;

    for (var index = 0; index < data.length; index++) {
        if (index === (this.options.period - 1)) {
            var sum = 0.0;
            for (var i = this.options.period - 1; i >= 0; i--) {
                sum += indicators.getIndicatorOrPriceValue(data[index - i], this.options.appliedTo);
            }
            console.log('sum : ', sum);
            var sma = toFixed(sum / this.options.period, 4);
            this.indicatorData.push({ time : data[index].time, value : sma });
        } else if(index > (this.options.period - 1)) {
            var preEma = this.indicatorData[index - 1].value;
            var price = indicators.getIndicatorOrPriceValue(data[index], this.options.appliedTo);
            var ema = (price * 2 / (this.options.period + 1)) + (preEma * (1 - 2 / (this.options.period + 1)));
            ema = toFixed(ema, 4);
            this.indicatorData.push({ time : data[index].time, value : ema });
        } else {
            this.indicatorData.push({ time : data[index].time, value : 0.0 });
        }
    }

};

EMA.prototype.addPoint = function(data) {
    var index = this.indicatorData.length - 1;
    var preEma = this.indicatorData[index].value;
    var price = this.indicators.getIndicatorOrPriceValue(data, this.options.appliedTo);
    var ema = (price * 2 / (this.options.period + 1)) + (preEma * (1 - 2 / (this.options.period + 1)));
    ema = toFixed(ema, 4);
    this.indicatorData.push({ time : data.time, value : ema });
    return [{
        id : this.uniqueID,
        value : ema
    }];
};

EMA.prototype.update = function(data) {
    var index = this.indicatorData.length - 1;
    var preEma = this.indicatorData[index - 1].value;
    var price = this.indicators.getIndicatorOrPriceValue(data, this.options.appliedTo);
    var ema = (price * 2 / (this.options.period + 1)) + (preEma * (1 - 2 / (this.options.period + 1)));
    ema = toFixed(ema, 4);
    this.indicatorData[index].value = ema;
    return [{
        id : this.uniqueID,
        value : ema
    }];
};

EMA.prototype.toString = function() {
    return 'EMA (' + this.options.period  + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};

EMA.prototype.buildSeriesAndAxisConfFromData = function(indicatorMetadata) {
    var data = [];
    //Prepare the data before sending a configuration
    this.indicatorData.forEach(function(e) {
        data.push([e.time, e.value]);
    });
    return [{
        seriesConf : {
            id: this.uniqueID,
            name: this.toString(),
            data: data,
            type: 'line',
            color: this.options.stroke,
            lineWidth: this.options.strokeWidth,
            dashStyle: this.options.dashStyle
        }
    }];
};

EMA.prototype.getIDs = function() {
    return [this.uniqueID];
};

EMA.prototype.isSameInstance = function(uniqueIDArr) {
    return _.isEqual(uniqueIDArr.sort(), [this.uniqueID]);
};
