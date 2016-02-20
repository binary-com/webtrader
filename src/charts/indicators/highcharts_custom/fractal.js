/**
 * Created by Mahboob.M on 2/18/16.
 */

FRACTAL = function (data, options, indicators) {
    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];

    this.CalculateFRACTALValue = function (data, index) {
        /* FRACTAL :
         Two candles marking lower highs / higher lows to the left
         The fractal over the higher high / under the lower low
         Two candles marking lower highs / higher lows to the right*/

        var middleBar = Math.floor(this.options.numberOfBars / 2);
        var candleMiddle_High = data[index].high,
           candleMiddle_Low = data[index].low;
        var isBear = true, isBull = true;
        for (var i = 1; i <= middleBar ; i++) {
            var nextIndex = index + i;
            var preIndex = index - i;
            if (nextIndex >= data.length || preIndex < 0) { isBear = false; isBear = false; break; };
            var candleNext_High = data[nextIndex].high,
                candleNext_Low = data[nextIndex].low;
            var candlePre_High = data[preIndex].high,
                candlePre_Low = data[preIndex].low;
            isBull = isBull && candleMiddle_High > candleNext_High && candleMiddle_High > candlePre_High;
            isBear = isBear && candleMiddle_Low < candleNext_Low && candleMiddle_Low < candlePre_Low;
        };
        var value = isBull ? candleMiddle_High : candleMiddle_Low;
        return FRACTALADDFLAGINFO({ isBull: isBull, isBear: isBear }, data[index].time, value);
    };

    for (var i = 0; i < data.length - 1; i++) {
        this.priceData.push(data[i]);
    };

    var middleBar = Math.floor(this.options.numberOfBars / 2);

    for (var index = middleBar; index < data.length - (middleBar + 1) ; index++) {
        var ret = this.CalculateFRACTALValue(this.priceData, index, this.options.numberOfBars);
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
    var middleBar = Math.floor(this.options.numberOfBars / 2);
    index = this.priceData.length - (middleBar + 2);
    var fractal = this.CalculateFRACTALValue(this.priceData, index) || {};
    if (fractal.text) {
        this.indicatorData.push({ time: fractal.x, value: fractal });
    };
    if (fractal.isUp) {
        return [{
            id: this.uniqueID[0],
            value: {x:fractal.x, title:fractal.title, text:fractal.text,shape: 'url(images/indicators/up_fractal.png)'}
        }];
    }
    else {
        return [{
            id: this.uniqueID[1],
            value: {x:fractal.x, title:fractal.title, text:fractal.text,shape: 'url(images/indicators/down_fractal.png)'}
        }];
    };
};

//FRACTAL.prototype.update = function (data) {
//    console.log('Updating FRACTAL data point : ', data);
//    var index = this.priceData.length - 1;
//    this.priceData[index].open = data.open;
//    this.priceData[index].high = data.high;
//    this.priceData[index].low = data.low;
//    this.priceData[index].close = data.close;
//    var middleBar = Math.floor(this.options.numberOfBars / 2);
//    index = this.priceData.length - (middleBar + 1);
//    var fractal = this.CalculateFRACTALValue(this.priceData, index) || {};
//    if (fractal) {
//        this.indicatorData[index].value = fractal;
//    };
//    if (fractal.isUp) {
//        return [{
//            id: this.uniqueID[0],
//            value: {x:fractal.x, title:fractal.title, text:fractal.text,shape: 'url(images/indicators/up_fractal.png)'}
//        }];
//    }
//    else {
//        return [{
//            id: this.uniqueID[1],
//            value: {x:fractal.x, title:fractal.title, text:fractal.text,shape: 'url(images/indicators/down_fractal.png)'}
//        }];
//    };
//};

FRACTAL.prototype.toString = function () {
    return 'FRACTAL (' + this.options.numberOfBars + ')';
};

FRACTALADDFLAGINFO = function (cdlObject, time, value) {
    var ret;
    if (cdlObject.isBull) {
        ret = {
            x: time,
             marker: {
                symbol: 'url(images/indicators/up_fractal.png)',
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
                symbol: 'url(images/indicators/down_fractal.png)',
            },
            title: ' ',
            y:value,
            text: 'Fractal: ' + value
        };
    }
    return ret;
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
                onSeries: this.options.onSeriesID, //Series ID on which this flags will be rendered
            }
        }
    ];
};
