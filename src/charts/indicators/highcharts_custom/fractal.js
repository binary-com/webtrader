/**
 * Created by Mahboob.M on 2/18/16.
 */

FRACTAL = function (data, options, indicators) {
    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];

    var fractalAddFlagInfo = function (cdlObject, time, value) {
        var ret;
        if (cdlObject.isBull) {
            ret = {
                x: time,
                marker: {
                    symbol: 'url(images/indicators/down_fractal.svg)',
                },
                title: ' ',
                y:value ,
                text: 'Fractal: ' + value
            };
        }
        else if (cdlObject.isBear) {
            ret = {
                x: time,
                marker: {
                    symbol: 'url(images/indicators/up_fractal.svg)',
                },
                title: ' ',
                y:value,
                text: 'Fractal: ' + value
            };
        }
        return ret;
    };

    this.middleBar_shift = Math.floor(this.options.numberOfBars / 2) | 0;

    this.CalculateFRACTALValue = function (data,middleBarIndex) {
        /* FRACTAL :
         Two candles marking lower highs / higher lows to the left
         The fractal over the higher high / under the lower low
         Two candles marking lower highs / higher lows to the right*/
        if ((middleBarIndex - this.middleBar_shift) < 0
            || (middleBarIndex + this.middleBar_shift) > data.length - 1) {
            return undefined;
        }

        var candleMiddle_High = data[middleBarIndex].high,
            candleMiddle_Low = data[middleBarIndex].low;

        var prices = _.range(middleBarIndex - this.middleBar_shift, middleBarIndex + this.middleBar_shift + 1)
            .map(function(index) {
                return data[index];
            });
        var lowPrices = prices.map(function(val) {
            return val.low;
        });
        var highPrices = prices.map(function(val) {
            return val.high;
        });
        var lowestPrice = _.min(lowPrices);
        var highestPrice = _.max(highPrices);
        var isBull = lowestPrice === candleMiddle_Low;
        var isBear = highestPrice === candleMiddle_High;
        var pos = lowestPrice;
        if (isBear) pos = highestPrice;

        return fractalAddFlagInfo({
                isBull: isBull,
                isBear: isBear
            }, data[middleBarIndex].time, pos);
    };

    for (var index = 0; index < data.length - 1; index++) {
        this.priceData.push(data[index]);
        var ret = this.CalculateFRACTALValue(data, index);
        if (ret) {
            this.indicatorData.push(ret);
        }
    };

};

FRACTAL.prototype = Object.create(IndicatorBase.prototype);
FRACTAL.prototype.constructor = FRACTAL;

FRACTAL.prototype.addPoint = function (data) {
    console.log('Adding FRACTAL data point : ', data);
    this.priceData.push(data);
    //The fractal needs two next data for each point to find the pattern,so when a new data is added, we should check if the second previous data is going to be fractal or not based on new data.
    var index = this.priceData.length - 1 - this.middleBar_shift;
    var ret = this.CalculateFRACTALValue(this.priceData, index) || {};
    if (ret.text) {
        this.indicatorData.push(ret);
    };
    return [{
        id: this.uniqueID,
        value: ret
    }];
};

FRACTAL.prototype.update = function (data) {
    console.log('Updating FRACTAL data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open = data.open;
    this.priceData[index].high = data.high;
    this.priceData[index].low = data.low;
    this.priceData[index].close = data.close;
    index = this.priceData.length - 1 - this.middleBar_shift;
    var ret = this.CalculateFRACTALValue(this.priceData,index) || {};
    if (ret.text) {
        this.indicatorData[this.indicatorData.length - 1] = ret;
    };
    return [{
        id: this.uniqueID,
        value: ret
    }];
};

FRACTAL.prototype.toString = function () {
    return 'FRACTAL (' + this.options.numberOfBars + ')';
};

FRACTAL.prototype.buildSeriesAndAxisConfFromData = function(indicatorMetadata) {
     return [
        {
            seriesConf: {
                id: this.uniqueID,
                name: this.toString(),
                data: this.indicatorData,
                type: 'scatter',
                onChartIndicator: true,
                enableMouseTracking:false,
                onSeries: this.options.onSeriesID //Series ID on which this flags will be rendered
            }
        }
    ];
};
