/**
 * Created by Arnab Karmakar on 1/15/16.
 */
WMA = function(data, options, indicators) {

    this.options = options;
    //Calculate the initial value and store locally
    this.indicatorData = [];
    this.uniqueID = uuid();
    this.indicators = indicators;
    this.priceData = [];

    /*
     WMA = ( Price * n + Price(1) * n-1 + ... Price( n-1 ) * 1) / ( n * ( n + 1 ) / 2 )
     Where: n = time period
     *
     *  Do not fill any value in wmaData from 0 index to options.period-1 index
     */
    for (var index = 0; index < data.length; index++) {
        if(index >= (this.options.period - 1)) {
            var wmaValue = 0.0;
            for (var subIndex = index, count = this.options.period; subIndex >= 0 && count >= 0; count--, subIndex--) {
                var price = indicators.getIndicatorOrPriceValue(data[subIndex], this.options.appliedTo);
                wmaValue += price * count;
            }
            wmaValue = wmaValue / (this.options.period * (this.options.period + 1) / 2);
            wmaValue = toFixed(wmaValue, 4);
            this.indicatorData.push({ time : data[index].time, value : wmaValue });
        } else {
            this.indicatorData.push({ time : data[index].time, value : 0.0 });
        }
        this.priceData.push(data[index]);
    }

};

WMA.prototype.addPoint = function(data) {
    this.priceData.push(data);
    var index = this.indicatorData.length - 1;
    var price = this.indicators.getIndicatorOrPriceValue(data, this.options.appliedTo);
    var wmaValue = this.options.period * price;
    for (var subIndex = index, count = this.options.period - 1; subIndex >= 0 && count >= 1; count--, subIndex--) {
        var price = this.indicators.getIndicatorOrPriceValue(this.priceData[subIndex], this.options.appliedTo);
        wmaValue += price * count;
    }
    wmaValue = wmaValue / (this.options.period * (this.options.period + 1) / 2);
    wmaValue = toFixed(wmaValue, 4);
    this.indicatorData.push({ time : data.time, value : wmaValue });
    return [{
        id : this.uniqueID,
        value : wmaValue
    }];
};

WMA.prototype.update = function(data) {
    var index = this.indicatorData.length - 1;
    this.priceData[index].open  = data.open;
    this.priceData[index].high  = data.high;
    this.priceData[index].low   = data.low;
    this.priceData[index].close = data.close;
    var wmaValue = 0.0;
    for (var subIndex = index, count = this.options.period; subIndex >= 0 && count >= 1; count--, subIndex--) {
        var price = this.indicators.getIndicatorOrPriceValue(this.priceData[subIndex], this.options.appliedTo);
        wmaValue += price * count;
    }
    wmaValue = wmaValue / (this.options.period * (this.options.period + 1) / 2);
    wmaValue = toFixed(wmaValue, 4);
    this.indicatorData[index].value = wmaValue;
    return [{
        id : this.uniqueID,
        value : wmaValue
    }];
};

WMA.prototype.toString = function() {
    return 'WMA (' + this.options.period  + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};

WMA.prototype.buildSeriesAndAxisConfFromData = function(indicatorMetadata) {
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

WMA.prototype.getIDs = function() {
    return [this.uniqueID];
};

WMA.prototype.isSameInstance = function(uniqueIDArr) {
    return _.isEqual(uniqueIDArr.sort(), [this.uniqueID]);
};
