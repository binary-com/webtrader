/**
 * Created by Mahboob.M on 2/18/16.
 */

FRACTAL = function (data, options, indicators) {
    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
    this.BULL = 1, this.BEAR = 2;
    this.middleBar_shift = Math.floor(this.options.numberOfBars / 2) | 0;
    
    this.BULL_IMAGE_URL = 'url(images/indicators/down_fractal.svg)';
    this.BEAR_IMAGE_URL = 'url(images/indicators/up_fractal.svg)';

    /**
     * @param data
     * @param middleBarIndex
     * @param checkFor - Whether to the calculation for bull or bear
     * @returns {*}
     * @constructor
     */
    this.CalculateFRACTALValue = function (data, middleBarIndex, checkFor) {

        /* FRACTAL :
         Two candles marking lower highs / higher lows to the left
         The fractal over the higher high / under the lower low
         Two candles marking lower highs / higher lows to the right*/
        if ((middleBarIndex - this.middleBar_shift) < 0 || (middleBarIndex + this.middleBar_shift) > data.length - 1) return null;

        var candleMiddle_High = data[middleBarIndex].high, candleMiddle_Low = data[middleBarIndex].low;

        var prices = _.range(middleBarIndex - this.middleBar_shift, middleBarIndex + this.middleBar_shift + 1)
                        .map(function(index) {
                            return data[index];
                        });
        var lowPrices = prices.map(function(val) { return val.low; });
        var highPrices = prices.map(function(val) { return val.high; });
        var lowestPrice = _.min(lowPrices);
        var highestPrice = _.max(highPrices);
        var isBull = (lowestPrice === candleMiddle_Low);
        var isBear = (highestPrice === candleMiddle_High);
        var pos = candleMiddle_Low;
        if (checkFor === this.BEAR) pos = candleMiddle_High;

        /*require(['moment'], function( moment ) {
            console.log(moment(data[data.length - 1].time).format('YYYY-MM-DD HH:mm'),
                            moment(data[data.length - 2].time).format('YYYY-MM-DD HH:mm'),
                                moment(data[middleBarIndex].time).format('YYYY-MM-DD HH:mm'), middleBarIndex, data.length);
        });*/

        return new FractalUpdateObject(data[middleBarIndex].time || data[middleBarIndex].x, pos,
                        (isBull && checkFor === this.BULL) || (isBear && checkFor === this.BEAR) ? ' ' : '',
                        'Fractal: ' + pos,
                        {
                            symbol: checkFor === this.BULL? this.BULL_IMAGE_URL : (checkFor === this.BEAR? this.BEAR_IMAGE_URL : null)
                        },
                        (isBull && checkFor === this.BULL),
                        (isBear && checkFor === this.BEAR)
                    );

    };

    for (var index = 0; index < data.length; index++) {
        this.priceData.push(data[index]);
        var parent = this;
        [this.BULL, this.BEAR].forEach(function(checkFor) {
            var ret = parent.CalculateFRACTALValue(data, index, checkFor);
            if (ret && !_.isEmpty(ret.text) && !_.isEmpty(ret.title) && ret.marker && ret.marker.symbol) {
                parent.indicatorData.push(ret);
            }
        });
    };

    console.log('Fractal, Init last data point', new Date(data[data.length - 1].time));

    this.addOrUpdateFractalData = function(mode) {
        //The fractal needs two next data for each point to find the pattern,so when a new data is added, we should check if the second previous
        // data is going to be fractal or not based on new data.
        var index = this.priceData.length - 1 - this.middleBar_shift;
        var parent = this;
        var returnObject = [];
        [this.BULL, this.BEAR].forEach(function(checkFor) {
            var ret = parent.CalculateFRACTALValue(parent.priceData, index, checkFor);
            if (ret && ret.marker && ret.marker.symbol) {
                //console.log( mode === 'add' ? 'Adding' : 'Updating', 'FRACTAL data point : ', ret, data, checkFor);
                if ( mode === 'add' ) {
                    parent.indicatorData.push(ret);
                    returnObject.push({
                        id: parent.uniqueID,
                        value: ret
                    });
                }
            }

            //We have to add ret with any value in update mode so that invalid fractal points are removed
            if (mode === 'update') {
                returnObject.push({
                    id: parent.uniqueID,
                    value: ret
                });
            }
        });

        console.log(mode, returnObject);
        return returnObject;
    };

};

FractalUpdateObject = function(x, y, title, text, marker, isBull, isBear) {
    this.y = y;
    this.x = x;
    this.title = title;
    this.text = text;
    this.marker = marker;
    this.isBull = isBull;
    this.isBear = isBear;
    this.toJSObject = function() {
        return {
            x : x,
            y : y,
            title : title,
            text : text,
            marker : marker
        };
    };
};

FRACTAL.prototype = Object.create(IndicatorBase.prototype);
FRACTAL.prototype.constructor = FRACTAL;

FRACTAL.prototype.addPoint = function (data) {
    //console.log('Adding FRACTAL data point :', data);
    //Don't process same time data points
    this.priceData.push(data);
    console.log('[Fractal], last data point', new Date(this.priceData[this.priceData.length - 1].time), ', second last data point', new Date(this.priceData[this.priceData.length - 2].time));
    return this.addOrUpdateFractalData( 'add' );
};

FRACTAL.prototype.update = function (data) {
    //console.log('Updating FRACTAL data point : ', data);
    var index = this.priceData.length - 1;
    this.priceData[index].open  = data.open;
    this.priceData[index].high  = data.high;
    this.priceData[index].low   = data.low;
    this.priceData[index].close = data.close;
    return this.addOrUpdateFractalData( 'update' );
};

FRACTAL.prototype.toString = function () {
    return 'FRACTAL (' + this.options.numberOfBars + ')';
};

FRACTAL.prototype.buildSeriesAndAxisConfFromData = function(indicatorMetadata) {
    console.log(indicatorMetadata, indicatorMetadata.onChartIndicator);
     return [
        {
            seriesConf: {
                id: this.uniqueID,
                name: this.toString(),
                data: this.indicatorData,
                type: 'scatter',
                turboThreshold: 0,
                onChartIndicator: indicatorMetadata.onChartIndicator,
                enableMouseTracking:false,
                onSeries: this.options.onSeriesID //Series ID on which this flags will be rendered
            }
        }
    ];
};
