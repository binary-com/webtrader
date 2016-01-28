/**
 * Created by Arnab Karmakar on 1/23/16.
 */
CDL = function(data, options, indicators) {

    IndicatorBase.call(this, data, options, indicators);
    this.priceData = [];
    //Size of this.priceData and this.indicatorData might not be same because we are
    // not going to add indicator data when there is no pattern

    this.priceData.push(data[0]);
    this.priceData.push(data[1]);
    for (var index = 2; index < data.length; index++)
    {
        this.priceData.push(data[index]);
        var retRenderingCode = this.calculateIndicatorValue(this.options.cdlIndicatorCode);
        if (retRenderingCode)
        {
            this.indicatorData.push(retRenderingCode);
        }
    }

};

CDL.prototype = Object.create(IndicatorBase.prototype);
CDL.prototype.constructor = CDL;

CDL.prototype.addPoint = function(data) {
    this.priceData.push(data);
    var ret = this.calculateIndicatorValue(this.options.cdlIndicatorCode) || {};
    this.indicatorData.push(ret);
    return [{
        id : this.uniqueID,
        value : new CDLUpdateObject(ret.x || data.time, ret.title, ret.text)
    }];
};

CDL.prototype.update = function(data) {
    var index = this.priceData.length - 1;
    this.priceData[index].open  = data.open;
    this.priceData[index].high  = data.high;
    this.priceData[index].low   = data.low;
    this.priceData[index].close = data.close;
    var ret = this.calculateIndicatorValue(this.options.cdlIndicatorCode) || {};
    this.indicatorData[index] = ret;
    return [{
        id : this.uniqueID,
        value : new CDLUpdateObject(ret.x || data.time, ret.title, ret.text)
    }];
};

CDL.prototype.toString = function() {
    return this.options.cdlIndicatorCode.toUpperCase();
};

CDL.prototype.buildSeriesAndAxisConfFromData = function(indicatorMetadata) {
    return [
        {
            seriesConf : {
                id: this.uniqueID,
                name: this.toString(),
                data: this.indicatorData,
                type: 'flags',
                dashStyle: this.options.dashStyle,
                onChartIndicator: true,
                onSeries: this.options.onSeriesID, //Series ID on which this flags will be rendered
                shape: 'flag',
                turboThreshold: 0
            }
        }
    ];
};

CDLUpdateObject = function(x, title, text) {
    this.x = x;
    this.title = title;
    this.text = text;
    this.toJSObject = function() {
        return {
            x : x,
            title : title,
            text : text
        };
    };
};

CDL.prototype.CDL2CROWS = function() {
    var candleOne_Index         = this.priceData.length - 1;
    var candleTwo_Index         = candleOne_Index - 1;
    var candleThree_Index       = candleOne_Index - 2;

    var candleThree_Open        = this.priceData[candleThree_Index].open,
        candleThree_Close       = this.priceData[candleThree_Index].close;
    var candleTwo_Open          = this.priceData[candleTwo_Index].open,
        candleTwo_Close         = this.priceData[candleTwo_Index].close;
    var candleOne_Open          = this.priceData[candleOne_Index].open,
        candleOne_Close         = this.priceData[candleOne_Index].close;
    var isCandleThree_Bullish   = candleThree_Close > candleThree_Open,
        isCandleThree_Bearish   = candleThree_Close < candleThree_Open;
    var isCandleTwo_Bullish     = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish     = candleTwo_Close < candleTwo_Open;
    var isCandleOne_Bullish     = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish     = candleOne_Close < candleOne_Open;
    var isBearishContinuation = isCandleThree_Bullish
        && isCandleTwo_Bearish && (candleTwo_Open > candleThree_Close && candleTwo_Close > candleThree_Close)
        && isCandleOne_Bearish
        && (candleOne_Open < candleTwo_Open && candleOne_Open > candleTwo_Close) //opens within the prior candle's body
        && (candleOne_Close < candleThree_Close && candleOne_Close > candleThree_Open); //and closes within the body of the first candle in the pattern
    var isBullishContinuation = isCandleThree_Bearish
        && isCandleTwo_Bullish && (candleTwo_Open < candleThree_Close && candleTwo_Close < candleThree_Close)
        && isCandleOne_Bullish
        && (candleOne_Open > candleTwo_Open && candleOne_Open < candleTwo_Close) //opens within the prior candle's body
        && (candleOne_Close > candleThree_Close && candleOne_Close < candleThree_Open); //and closes within the body of the first candle in the pattern
    return {
        isBear : isBearishContinuation,
        isBull : isBullishContinuation
    };
};

CDL.prototype.CDLDOJI = function(open, high, low, close) {
    var isOpenCloseSame = (open === close),
        differenceBet_Open_High = Math.abs(open - high),
        differenceBet_Open_Low = Math.abs(open - low),
        candleBodySize = Math.abs(low - high);

    //Either open and close is same or difference between Open and Close is 1% of the total size of candle
    var isBearishContinuation = (isOpenCloseSame || ((candleBodySize * 0.05) >= Math.abs(open - close)))
        && differenceBet_Open_High < differenceBet_Open_Low;

    var isBullishContinuation = (isOpenCloseSame || ((candleBodySize * 0.05) >= Math.abs(open - close)))
        && differenceBet_Open_High > differenceBet_Open_Low;
    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
};

CDL.prototype.CDL3BLACKCROWS = function() {
    var candleOne_Index         = this.priceData.length - 1;
    var candleTwo_Index         = candleOne_Index - 1;
    var candleThree_Index       = candleOne_Index - 2;
    var candleFour_Index        = candleOne_Index - 3;
    var isBearishContinuation = false;

    if (candleFour_Index >= 0) {
        var candleFour_Open = this.priceData[candleFour_Index].open,
            candleFour_Low = this.priceData[candleFour_Index].low,
            candleFour_Close = this.priceData[candleFour_Index].close;
        var candleThree_Open = this.priceData[candleThree_Index].open,
            candleThree_Low = this.priceData[candleThree_Index].low,
            candleThree_Close = this.priceData[candleThree_Index].close;
        var candleTwo_Open = this.priceData[candleTwo_Index].open,
            candleTwo_Low = this.priceData[candleTwo_Index].low,
            candleTwo_Close = this.priceData[candleTwo_Index].close;
        var candleOne_Open = this.priceData[candleOne_Index].open,
            candleOne_Close = this.priceData[candleOne_Index].close;
        var isCandleThree_Bearish = candleThree_Close < candleThree_Open,
            isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open,
            isCandleOne_Bearish = candleOne_Close < candleOne_Open;

        isBearishContinuation = isCandleThree_Bearish && isCandleTwo_Bearish && isCandleOne_Bearish
            && candleThree_Close < candleFour_Low && candleTwo_Close < candleThree_Low && candleOne_Close < candleTwo_Low //closed lower than the previous day
            && _.inRange(candleThree_Open, candleFour_Close, candleFour_Open)
            && _.inRange(candleTwo_Open, candleThree_Close, candleThree_Open)
            && _.inRange(candleOne_Open, candleTwo_Close, candleTwo_Open); //opening within the body of the previous day;
    }

    //It's a bearish candlestick
    var isBullishContinuation = false;

    return {
        isBull : isBullishContinuation,
        isBear : isBearishContinuation
    };
};

CDL.prototype.CDL3INSIDE = function() {
    var candleOne_Index         = this.priceData.length - 1;
    var candleTwo_Index         = candleOne_Index - 1;
    var candleThree_Index       = candleOne_Index - 2;

    var candleThree_Open        = this.priceData[candleThree_Index].open,
        candleThree_Close       = this.priceData[candleThree_Index].close;
    var candleTwo_Open          = this.priceData[candleTwo_Index].open,
        candleTwo_Close         = this.priceData[candleTwo_Index].close;
    var candleOne_Open          = this.priceData[candleOne_Index].open,
        candleOne_Close         = this.priceData[candleOne_Index].close;

    var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
        isCandleThree_Bearish = candleThree_Close < candleThree_Open;
    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;

    var isBearishContinuation = isCandleThree_Bullish
        && isCandleTwo_Bearish && _.inRange(candleTwo_Open, candleThree_Open, candleThree_Close) && _.inRange(candleTwo_Close, candleThree_Open, candleThree_Close)
        && isCandleOne_Bearish && (candleOne_Close < candleTwo_Close);

    var isBullishContinuation = isCandleThree_Bearish
        && isCandleTwo_Bullish && _.inRange(candleTwo_Open, candleThree_Close, candleThree_Open) && _.inRange(candleTwo_Close, candleThree_Close, candleThree_Open)
        && isCandleOne_Bullish && (candleOne_Close > candleTwo_Close);

    return {
        isBear : isBearishContinuation,
        isBull : isBullishContinuation
    };
};

CDL.prototype.CDL3LINESTRIKE = function() {
    var candleOne_Index         = this.priceData.length - 1;
    var candleTwo_Index         = candleOne_Index - 1;
    var candleThree_Index       = candleOne_Index - 2;
    var candleFour_Index        = candleOne_Index - 3;
    var isBullishContinuation = false, isBearishContinuation = false;

    if (candleFour_Index >= 0) {
        var candleFour_Open = this.priceData[candleFour_Index].open,
            candleFour_Close = this.priceData[candleFour_Index].close;
        var candleThree_Open = this.priceData[candleThree_Index].open,
            candleThree_Close = this.priceData[candleThree_Index].close;
        var candleTwo_Open = this.priceData[candleTwo_Index].open,
            candleTwo_Close = this.priceData[candleTwo_Index].close;
        var candleOne_Open = this.priceData[candleOne_Index].open,
            candleOne_Close = this.priceData[candleOne_Index].close;

        var isCandleFour_Bullish = candleFour_Close > candleFour_Open,
            isCandleFour_Bearish = candleFour_Close < candleFour_Open,
            isCandleThree_Bullish = candleThree_Close > candleThree_Open,
            isCandleThree_Bearish = candleThree_Close < candleThree_Open,
            isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
            isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open,
            isCandleOne_Bullish = candleOne_Close > candleOne_Open,
            isCandleOne_Bearish = candleOne_Close < candleOne_Open;

        isBullishContinuation = isCandleFour_Bearish
                && isCandleThree_Bearish && (candleThree_Close < candleFour_Close)
                && isCandleTwo_Bearish && (candleTwo_Close < candleThree_Close)
                && isCandleOne_Bullish && (candleOne_Close > candleFour_Open && candleOne_Open < candleTwo_Close)
            ;

        isBearishContinuation = isCandleFour_Bullish
                && isCandleThree_Bullish && (candleThree_Close > candleFour_Close)
                && isCandleTwo_Bullish && (candleTwo_Close > candleThree_Close)
                && isCandleOne_Bearish && (candleOne_Close < candleFour_Open && candleOne_Open < candleTwo_Close)
            ;
    }

    return {
        isBear : isBearishContinuation,
        isBull : isBullishContinuation
    };
};

CDL.prototype.CDL3OUTSIDE = function() {
    var candleOne_Index         = this.priceData.length - 1;
    var candleTwo_Index         = candleOne_Index - 1;
    var candleThree_Index       = candleOne_Index - 2;

    var candleThree_Open        = this.priceData[candleThree_Index].open,
        candleThree_Close       = this.priceData[candleThree_Index].close;
    var candleTwo_Open          = this.priceData[candleTwo_Index].open,
        candleTwo_Close         = this.priceData[candleTwo_Index].close;
    var candleOne_Open          = this.priceData[candleOne_Index].open,
        candleOne_Close         = this.priceData[candleOne_Index].close;

    var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
        isCandleThree_Bearish = candleThree_Close < candleThree_Open;
    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;

    var isBearishContinuation = isCandleThree_Bullish
            && isCandleTwo_Bearish && candleTwo_Open > candleThree_Close && candleTwo_Close < candleThree_Open
            && isCandleOne_Bearish
        ;

    var isBullishContinuation = isCandleThree_Bearish
            && isCandleTwo_Bullish && candleTwo_Open < candleThree_Close && candleTwo_Close > candleThree_Open
            && isCandleOne_Bullish
        ;

    return {
        isBear : isBearishContinuation,
        isBull : isBullishContinuation
    };
};

CDL.prototype.CDL3STARSSOUTH = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;

    var candleThree_Open = this.priceData[candleThree_Index].open,
        candleThree_Close = this.priceData[candleThree_Index].close,
        candleThree_Low = this.priceData[candleThree_Index].low,
        candleThree_High = this.priceData[candleThree_Index].high;

    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close,
        candleTwo_Low = this.priceData[candleTwo_Index].low,
        candleTwo_High = this.priceData[candleTwo_Index].high;

    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_Low = this.priceData[candleOne_Index].low,
        candleOne_High = this.priceData[candleOne_Index].high;

    var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
        isCandleThree_Bearish = candleThree_Close < candleThree_Open;
    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;

    var candleThreeBodySize = Math.abs(candleThree_Close - candleThree_Open),
        candleTwoBodySize = Math.abs(candleTwo_Close - candleTwo_Open),
        candleOneBodySize = Math.abs(candleOne_Close - candleOne_Open);

    var candleThreeLowerShadow = Math.abs(candleThree_Low - Math.min(candleThree_Close, candleThree_Open)),
       candleThreeUpperShadow = Math.abs(candleThree_High - Math.max(candleThree_Close, candleThree_Open));

    var isBullishContinuation = isCandleThree_Bearish && (this.indicators.isLongCandle(candleThree_Open, candleThree_High, candleThree_Low, candleThree_Close))
                && (candleThreeLowerShadow >= (candleThreeBodySize * 2)) && (candleThreeUpperShadow < (candleThreeBodySize * 0.1)) //A black candlestick with almost no upper shadow and a long lower shadow appears on the first day.
                && isCandleTwo_Bearish && (candleTwo_Low > candleThree_Low) && (candleTwo_Open < candleThree_Open) && (candleTwo_Close < candleThree_Close) && (candleTwoBodySize < candleThreeBodySize) // The next day is another black candlestick closing below the previous day�s close and having an opening in the range of the previous day�s body. However, it has a higher low.
                && isCandleOne_Bearish && (candleOne_Low > candleTwo_Low) && (candleOne_Open === candleOne_High) && (candleOne_Low === candleOne_Close) && (candleOneBodySize < candleTwoBodySize);//The last day is a small black Marubozu with a higher low

    //It's a bullish candlestick
    var isBearishContinuation = false;

    return {
        isBear : isBearishContinuation,
        isBull : isBullishContinuation
    };
};

CDL.prototype.CDLABANDONEDBABY = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;

    var candleThree_Open = this.priceData[candleThree_Index].open,
        candleThree_Close = this.priceData[candleThree_Index].close,
        candleThree_Low = this.priceData[candleThree_Index].low,
        candleThree_High = this.priceData[candleThree_Index].high;

    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close,
        candleTwo_Low = this.priceData[candleTwo_Index].low,
        candleTwo_High = this.priceData[candleTwo_Index].high;

    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_Low = this.priceData[candleOne_Index].low,
        candleOne_High = this.priceData[candleOne_Index].high;

    var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
        isCandleThree_Bearish = candleThree_Close < candleThree_Open;
    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;

    var dojiResponse_candleTwo = this.CDLDOJI(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close);

    var isBearishContinuation = isCandleThree_Bullish && (this.indicators.isLongCandle(candleThree_Open, candleThree_High, candleThree_Low, candleThree_Close))
                                && dojiResponse_candleTwo.isBear && (candleTwo_Low > candleThree_High)
                                && isCandleOne_Bearish && (this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close)) && (candleOne_High < candleTwo_Low);

    var isBullishContinuation = isCandleThree_Bearish && (this.indicators.isLongCandle(candleThree_Open, candleThree_High, candleThree_Low, candleThree_Close))
                                && dojiResponse_candleTwo.isBull && (candleTwo_High < candleThree_Low)
                                && isCandleOne_Bullish && (this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close)) && (candleOne_Low > candleTwo_High);

    return {
        isBear : isBearishContinuation,
        isBull : isBullishContinuation
    };
}

CDL.prototype.CDLADVANCEBLOCK = function () {

    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;

    var candleThree_Open = this.priceData[candleThree_Index].open,
        candleThree_Close = this.priceData[candleThree_Index].close,
        candleThree_High = this.priceData[candleThree_Index].high,
        candleThree_Low = this.priceData[candleThree_Index].low;

    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close,
        candleTwo_High = this.priceData[candleTwo_Index].high,
        candleTwo_Low = this.priceData[candleTwo_Index].low;

    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_High = this.priceData[candleOne_Index].high;

    var isCandleThree_Bullish = candleThree_Close > candleThree_Open;
    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open;

    var candleOneBody = Math.abs(candleOne_Open - candleOne_Close),
        candleThreeBody = Math.abs(candleThree_Open - candleThree_Close),
        candleTwoBody = Math.abs(candleTwo_Open - candleTwo_Close),
        candleThreeUpperShadow = Math.abs(candleThree_High - candleThree_Close),
        candleTwoUpperShadow = Math.abs(candleTwo_High - candleTwo_Close),
        candleOneUpperShadow = Math.abs(candleOne_High - candleOne_Close);

    //It's a bearish candlestick
    var isBullishContinuation = false;

    var isBearishContinuation = isCandleThree_Bullish && (this.indicators.isLongCandle(candleThree_Open, candleThree_High, candleThree_Low, candleThree_Close)) //Three long white days occur, each with a higher close than the previous day
                                && isCandleTwo_Bullish && (this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close))
                                && (candleTwoBody <= candleThreeBody) && (candleTwo_Close > candleThree_Close) && (candleTwo_Open <= candleThree_Close) && (candleTwo_Open > candleThree_Open) //Each day opens within the body of the previous day 
                                && isCandleOne_Bullish && (candleOneBody <= candleTwoBody) && (candleOne_Close > candleTwo_Close) && (candleOne_Open <= candleTwo_Close) && (candleOne_Open > candleTwo_Open) //Each day opens within the body of the previous day
                                && (candleTwoUpperShadow > candleThreeUpperShadow) && (candleOneUpperShadow > candleThreeUpperShadow); //The second and third days should also show long upper wicks

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLBELTHOLD = function () {

    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;

    var candleThree_Open = this.priceData[candleThree_Index].open,
        candleThree_Close = this.priceData[candleThree_Index].close;

    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close;

    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_Low = this.priceData[candleOne_Index].low,
        candleOne_High = this.priceData[candleOne_Index].high;

    var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
        isCandleThree_Bearish = candleThree_Close < candleThree_Open;
    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;

    var isBullishContinuation = isCandleThree_Bearish  //After a stretch of bearish candlestick
                                && isCandleTwo_Bearish //After a stretch of bearish candlestick
                                && isCandleOne_Bullish && (this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close))  //Long candle
                                && (candleOne_Open === candleOne_Low) && (candleOne_Open < candleTwo_Close);// a bullish or white candlestick forms. The opening price, which becomes the low for the day, is significantly lower then the closing price.

    var isBearishContinuation = isCandleThree_Bullish  //After a stretch of bullish candlestick
                                && isCandleTwo_Bullish //After a stretch of bullish candlestick
                                && isCandleOne_Bearish &&  (this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close)) //Long candle
                                && (candleOne_Open === candleOne_High) && (candleOne_Open > candleTwo_Close);// a bearish or black candlestick forms. the opening price, which becomes the high for the day, is higher than the close of the previous day.

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLBREAKAWAY = function () {

    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;
    var candleFour_Index = candleOne_Index - 3;
    var candleFive_Index = candleOne_Index - 4;
    var isBullishContinuation = false, isBearishContinuation = false;

    if (candleFour_Index >= 0 && candleFive_Index > 0) {
        var candleFive_Open = this.priceData[candleFive_Index].open,
            candleFive_Close = this.priceData[candleFive_Index].close,
            candleFive_Low = this.priceData[candleFive_Index].low,
            candleFive_High = this.priceData[candleFive_Index].high;

        var candleFour_Open = this.priceData[candleFour_Index].open,
            candleFour_Close = this.priceData[candleFour_Index].close;

        var candleThree_Open = this.priceData[candleThree_Index].open,
            candleThree_Close = this.priceData[candleThree_Index].close;

        var candleTwo_Open = this.priceData[candleTwo_Index].open,
            candleTwo_Close = this.priceData[candleTwo_Index].close;

        var candleOne_Open = this.priceData[candleOne_Index].open,
            candleOne_Close = this.priceData[candleOne_Index].close;

        var isCandleFive_Bullish = candleFive_Close > candleFive_Open,
            isCandleFive_Bearish = candleFive_Close < candleFive_Open;

        var isCandleFour_Bullish = candleFour_Close > candleFour_Open,
            isCandleFour_Bearish = candleFour_Close < candleFour_Open;

        var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
            isCandleThree_Bearish = candleThree_Close < candleThree_Open;

        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
            isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;

        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
            isCandleOne_Bearish = candleOne_Close < candleOne_Open;

        var candleFiveBody = Math.abs(candleFive_Close - candleFive_Open);
        var shortCandleSize = candleFiveBody / 2;

        var isBullishContinuation = isCandleFive_Bearish && (this.indicators.isLongCandle(candleFive_Open, candleFive_High, candleFive_Low, candleFive_Close)) //long candle
                                  && isCandleFour_Bearish && (Math.abs(candleFour_Close - candleFour_Open) < shortCandleSize) && (candleFour_Open < candleFive_Close)
                                  && (Math.abs(candleThree_Close - candleThree_Open) < shortCandleSize) && (Math.min(candleThree_Close, candleThree_Open) < candleFour_Close)
                                  && (Math.abs(candleTwo_Close - candleTwo_Open) < shortCandleSize) && (Math.min(candleTwo_Close, candleTwo_Open) < Math.min(candleThree_Close, candleThree_Open))
                                  && isCandleOne_Bullish //The fifth day is a long blue day 
                                  && (candleOne_Open > (Math.min(candleTwo_Close, candleTwo_Open)))
                                  && (candleOne_Close > candleFour_Open) && (candleOne_Close < candleFive_Open);//closes inside the gap formed between the first two days..


        var isBearishContinuation = isCandleFive_Bullish
                                  && isCandleFour_Bullish && (Math.abs(candleFour_Close - candleFour_Open) < shortCandleSize) && (candleFour_Open > candleFive_Close)
                                  && (Math.abs(candleThree_Close - candleThree_Open) < shortCandleSize) && (Math.max(candleThree_Close, candleThree_Open) > candleFour_Close)
                                  && (Math.abs(candleTwo_Close - candleTwo_Open) < shortCandleSize) && (Math.max(candleTwo_Close, candleTwo_Open) > Math.max(candleThree_Close, candleThree_Open))
                                  && isCandleOne_Bearish //The fifth day is a long red day 
                                  && (candleOne_Open < (Math.max(candleTwo_Close, candleTwo_Open)))
                                  && (candleOne_Close < candleFour_Open) && (candleOne_Close > candleFive_Close);//that closes inside of the gap between the first and second candle

    }
    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLCLOSINGMARUBOZU = function () {
    var candleOne_Index = this.priceData.length - 1;

    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_Low = this.priceData[candleOne_Index].low,
        candleOne_High = this.priceData[candleOne_Index].high;

    var isBearish = candleOne_Open > candleOne_Close;
    var isBullish = candleOne_Open < candleOne_Close;

    var isBearishContinuation = isBearish
                               && (this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close))
                               && candleOne_Low === candleOne_Close;

    var isBullishContinuation = isBullish
                               && (this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close))
                               && candleOne_High === candleOne_Close;

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
};

CDL.prototype.CDLCOUNTERATTACK = function () {

    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;

    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close,
        candleTwo_High = this.priceData[candleTwo_Index].high,
        candleTwo_Low = this.priceData[candleTwo_Index].low;

    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_High = this.priceData[candleOne_Index].high,
        candleOne_Low = this.priceData[candleOne_Index].low;

    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;

    candleTwoBody = Math.abs(candleTwo_Close - candleTwo_Open);

    var isBullishContinuation = isCandleTwo_Bearish && (this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close)) // bearish counterattack is a long black candle in an uptrend
                                && isCandleOne_Bullish && (this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close)) //followed by a long white candle.
                                && (candleOne_Close <= (candleTwo_Close + (candleTwoBody * 0.1))) && (candleOne_Close >= (candleTwo_Close - (candleTwoBody * 0.1)))// Closing prices of both candles are at the same price level.

    var isBearishContinuation = isCandleTwo_Bullish && (this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close))// bullish counterattack is a long white candle in an uptrend level.
                                && isCandleOne_Bearish && (this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close))//followed by a long white candle.
                                && (candleOne_Close <= (candleTwo_Close + (candleTwoBody * 0.1))) && (candleOne_Close >= (candleTwo_Close - (candleTwoBody * 0.1)))// Closing prices of both candles are at the same price level.

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLDARKCLOUDCOVER = function () {

    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;

    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close;

    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;

    //It's a bearish candlestick
    var isBullishContinuation = false;

    var isBearishContinuation = isCandleTwo_Bullish
                                && isCandleOne_Bearish && (candleOne_Open > candleTwo_Close) //Black candlestick must open above the previous close.
                                && (candleOne_Close < (candleTwo_Open + (Math.abs(candleTwo_Open - candleTwo_Close) / 2))) //closes below the middle of day 1 bullish candlestick.
                                && (candleOne_Close > candleTwo_Open);//close within the price range of the previous day

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLDOJISTAR = function () {

    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;

    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close,
        candleTwo_Low = this.priceData[candleTwo_Index].low,
        candleTwo_High = this.priceData[candleTwo_Index].high;

    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_Low = this.priceData[candleOne_Index].low,
        candleOne_High = this.priceData[candleOne_Index].high;

    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;

    var dojiResponse_candleOne = this.CDLDOJI(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close);

    var isBearishContinuation = isCandleTwo_Bullish && (this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close)) //The first day is long green day
                                && dojiResponse_candleOne.isBear && (candleOne_Close >= candleTwo_Close); //Second day is a doji that opens at the previous day close

    var isBullishContinuation = isCandleTwo_Bearish && (this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close)) //The first day is long red day
                                && dojiResponse_candleOne.isBull && (candleOne_Close <= candleTwo_Close); //Second day is a doji that opens at the previous day close

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDL3WHITESOLDIERS = function() {
    var candleOne_Index         = this.priceData.length - 1;
    var candleTwo_Index         = candleOne_Index - 1;
    var candleThree_Index       = candleOne_Index - 2;
    var candleFour_Index        = candleOne_Index - 3;
    var isBullishContinuation = false, isBearishContinuation = false;

    if (candleFour_Index >= 0) {
        var candleFour_Open = this.priceData[candleFour_Index].open,
            candleFour_Low = this.priceData[candleFour_Index].low,
            candleFour_High = this.priceData[candleFour_Index].high,
            candleFour_Close = this.priceData[candleFour_Index].close;
        var candleThree_Open = this.priceData[candleThree_Index].open,
            candleThree_Low = this.priceData[candleThree_Index].low,
            candleThree_High = this.priceData[candleThree_Index].high,
            candleThree_Close = this.priceData[candleThree_Index].close;
        var candleTwo_Open = this.priceData[candleTwo_Index].open,
            candleTwo_Low = this.priceData[candleTwo_Index].low,
            candleTwo_High = this.priceData[candleTwo_Index].high,
            candleTwo_Close = this.priceData[candleTwo_Index].close;
        var candleOne_Open = this.priceData[candleOne_Index].open,
            candleOne_Low = this.priceData[candleOne_Index].low,
            candleOne_High = this.priceData[candleOne_Index].high,
            candleOne_Close = this.priceData[candleOne_Index].close;

        var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
            isCandleThree_Bearish = candleThree_Close < candleThree_Open,
            isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
            isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open,
            isCandleOne_Bullish = candleOne_Close > candleOne_Open,
            isCandleOne_Bearish = candleOne_Close < candleOne_Open;

        isBullishContinuation = isCandleThree_Bullish && candleThree_Close > candleFour_Close && this.indicators.isLongCandle(candleThree_Open, candleThree_High, candleThree_Low, candleThree_Close)
            && isCandleTwo_Bullish && candleTwo_Close > candleThree_Close && this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close)
            && isCandleOne_Bullish && candleOne_Close > candleTwo_Close && this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close)
        ;

        isBearishContinuation = isCandleThree_Bearish && candleThree_Close < candleFour_Close && this.indicators.isLongCandle(candleThree_Open, candleThree_High, candleThree_Low, candleThree_Close)
            && isCandleTwo_Bearish && candleTwo_Close < candleThree_Close && this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close)
            && isCandleOne_Bearish && candleOne_Close < candleTwo_Close && this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close)
        ;
    }

    return {
        isBear : isBearishContinuation,
        isBull : isBullishContinuation
    };
};

CDL.prototype.CDLDRAGONFLYDOJI = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;

    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_Low = this.priceData[candleOne_Index].low,
        candleOne_High = this.priceData[candleOne_Index].high;

    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;

    var lowWick = Math.abs(candleOne_Low - Math.min(candleOne_Open, candleOne_Close)),
        highWick = Math.abs(candleOne_High - Math.max(candleOne_Open, candleOne_Close)),
        candleBodySize = Math.abs(candleOne_Low - candleOne_High),
        realBodySize = Math.abs(candleOne_Open - candleOne_Close),
        isOpenCloseHighAlmostSame = ((candleOne_Open === candleOne_Close) || (realBodySize < (candleBodySize * 0.1)))
        && ((candleOne_High === Math.max(candleOne_Open, candleOne_Close)) || (highWick < (candleBodySize * 0.1))),
        isLowerWickLong = (lowWick >= (candleBodySize * 0.60));

    var isBullishContinuation = isCandleTwo_Bearish //occurs at the bottom of downtrends.
                                && isOpenCloseHighAlmostSame //the open, high, and close are the same or about the same price
                                && isLowerWickLong;// The most important part of the Dragonfly Doji is the long lower shadow.

    var isBearishContinuation = isCandleTwo_Bullish //occurs at the top of uptrends
                                && isOpenCloseHighAlmostSame //the open, high, and close are the same or about the same price
                                && isLowerWickLong;// The most important part of the Dragonfly Doji is the long lower shadow.

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
};

CDL.prototype.CDLENGULFING = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;

    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_Low = this.priceData[candleOne_Index].low,
        candleOne_High = this.priceData[candleOne_Index].high;

    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;

    var lowWick = Math.abs(candleOne_Low - Math.min(candleOne_Open, candleOne_Close)),
        highWick = Math.abs(candleOne_High - Math.max(candleOne_Open, candleOne_Close)),
        candleBodySize = Math.abs(candleOne_Low - candleOne_High),
        realBodySize = Math.abs(candleOne_Open - candleOne_Close),
        isOpenCloseHighAlmostSame = ((candleOne_Open === candleOne_Close) || (realBodySize < (candleBodySize * 0.1)))
        && ((candleOne_High === Math.max(candleOne_Open, candleOne_Close)) || (highWick < (candleBodySize * 0.1))),
        isLowerWickLong = (lowWick >= (candleBodySize * 0.60));

    var isBearishContinuation = isCandleTwo_Bullish && isCandleOne_Bearish && candleTwo_Close < candleOne_Open && candleTwo_Open > candleOne_Close;

    var isBullishContinuation = isCandleTwo_Bearish && isCandleOne_Bullish && candleTwo_Close > candleOne_Open && candleTwo_Open < candleOne_Close;

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
};

CDL.prototype.CDLEVENINGDOJISTAR = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;
    var candleFour_Index = candleOne_Index - 3;

    var isBullishContinuation = false, isBearishContinuation = false;

    if (candleFour_Index >= 0) {
        var candleFour_Open = this.priceData[candleFour_Index].open,
            candleFour_Close = this.priceData[candleFour_Index].close;
        var candleThree_Open = this.priceData[candleThree_Index].open,
            candleThree_Close = this.priceData[candleThree_Index].close,
            candleThree_High = this.priceData[candleThree_Index].high,
            candleThree_Low = this.priceData[candleThree_Index].low;
        var candleTwo_Open = this.priceData[candleTwo_Index].open,
            candleTwo_Low = this.priceData[candleTwo_Index].low,
            candleTwo_High = this.priceData[candleTwo_Index].high,
            candleTwo_Close = this.priceData[candleTwo_Index].close;
        var candleOne_Open = this.priceData[candleOne_Index].open,
            candleOne_Close = this.priceData[candleOne_Index].close,
            candleOne_High = this.priceData[candleOne_Index].high,
            candleOne_Low = this.priceData[candleOne_Index].low;

        var isCandleFour_Bullish = candleFour_Close > candleFour_Open;
        var isCandleThree_Bullish = candleThree_Close > candleThree_Open;
        var isCandleOne_Bearish = candleOne_Close < candleOne_Open;

        var candleOneBody = Math.abs(candleOne_Open - candleOne_Close),
          candleThreeBody = Math.abs(candleThree_Open - candleThree_Close),
          candleTwoBody = Math.abs(candleTwo_Low - candleTwo_High),
          iscandleTwoDoji = (candleTwo_Open === candleTwo_Close) || ((candleTwoBody * 0.10) >= Math.abs(candleTwo_Open - candleTwo_Close));

        //It's a bearish candlestick
        var isBullishContinuation = false;

        var isBearishContinuation = isCandleFour_Bullish  //occurs at the top of an uptrend.
                                    && isCandleThree_Bullish && (this.indicators.isLongCandle(candleThree_Open, candleThree_High, candleThree_Low, candleThree_Close))  //The first part of an Evening Star reversal pattern is a large bullish green candle.
                                    && iscandleTwoDoji && (Math.min(candleTwo_Open, candleTwo_Close) > candleThree_Close) //The second day begins with a gap up and it is quite small and can be bullish or bearish.
                                    && isCandleOne_Bearish && (this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close)) && (candleOne_Open < Math.min(candleTwo_Open, candleTwo_Close))//a large Bearish Candle with gap down.
                                    && (candleOne_Close > candleThree_Open) && (candleOne_Close < candleThree_Close); //closes well within the body of the first candle
    }

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
};

CDL.prototype.CDLEVENINGSTAR = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;
    var candleFour_Index = candleOne_Index - 3;

    var isBullishContinuation = false, isBearishContinuation = false;

    if (candleFour_Index >= 0) {
        var candleFour_Open = this.priceData[candleFour_Index].open,
            candleFour_Close = this.priceData[candleFour_Index].close;
        var candleThree_Open = this.priceData[candleThree_Index].open,
            candleThree_Close = this.priceData[candleThree_Index].close,
            candleThree_High = this.priceData[candleThree_Index].high,
            candleThree_Low = this.priceData[candleThree_Index].low;
        var candleTwo_Open = this.priceData[candleTwo_Index].open,
            candleTwo_Low = this.priceData[candleTwo_Index].low,
            candleTwo_High = this.priceData[candleTwo_Index].high,
            candleTwo_Close = this.priceData[candleTwo_Index].close;
        var candleOne_Open = this.priceData[candleOne_Index].open,
            candleOne_Close = this.priceData[candleOne_Index].close,
            candleOne_High = this.priceData[candleOne_Index].high,
            candleOne_Low = this.priceData[candleOne_Index].low;

        var isCandleFour_Bullish = candleFour_Close > candleFour_Open;
        var isCandleThree_Bullish = candleThree_Close > candleThree_Open;
        var isCandleOne_Bearish = candleOne_Close < candleOne_Open;

        var candleOneBody = Math.abs(candleOne_Open - candleOne_Close);
        var candleTwoBody = Math.abs(candleTwo_Open - candleTwo_Close);
        var candleTwoSize = Math.abs(candleTwo_Low - candleTwo_High);
        var candleThreeBody = Math.abs(candleThree_Open - candleThree_Close);

        var isBullishContinuation = false;

        //Evening Star is bearish only
        var isBearishContinuation = isCandleFour_Bullish  //occurs at the top of an uptrend.
                                    && isCandleThree_Bullish && (this.indicators.isLongCandle(candleThree_Open, candleThree_High, candleThree_Low, candleThree_Close))//The first part of an Evening Star reversal pattern is a large bullish green candle.
                                    && (candleTwoBody >= candleTwoSize * 0.10) && (Math.min(candleTwo_Open, candleTwo_Close) > candleThree_Close) //The second day begins with a gap up and it is quite small and can be bullish or bearish.
                                    && isCandleOne_Bearish && (this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close)) && (candleOne_Open < Math.min(candleTwo_Open, candleTwo_Close))//a large Bearish Candle with gap down.
                                    && (candleOne_Close > candleThree_Open) && (candleOne_Close < candleThree_Close);
    }

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
};

CDL.prototype.CDLGAPSIDESIDEWHITE = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;

    var candleThree_Open = this.priceData[candleTwo_Index].open,
        candleThree_Close = this.priceData[candleTwo_Index].close;
    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close;

    var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
	    isCandleThree_Bearish = candleThree_Close < candleThree_Open;
    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;

    var isBullishContinuation = isCandleThree_Bullish  //the first candlestick is upward 
                                && isCandleTwo_Bullish && (candleTwo_Open > candleThree_Close) //followed by another upward that opens above  the first (gap up), 
                                && isCandleOne_Bullish && (candleOne_Open > candleThree_Close) && (candleOne_Open < candleTwo_Close)// followed by a third upward candlestick that opens below the close of the second (gap down)
                                && (candleOne_Close <= (candleTwo_Close + (Math.abs(candleTwo_Close - candleTwo_Open) * 0.10)));

    var isBearishContinuation = isCandleThree_Bearish  //the first candlestick is downward
                                && isCandleTwo_Bullish && (candleTwo_Close < candleThree_Close)//followed by an upward candlestick that opens below the  first one (gap down),
                                && isCandleOne_Bullish && (candleOne_Close < candleThree_Close) && (candleOne_Open < candleTwo_Close)// followed by an upward candlestick that opens below the close of the second one
                                && (candleOne_Close <= (candleTwo_Close + (Math.abs(candleTwo_Close - candleTwo_Open) * 0.10)));

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLGRAVESTONEDOJI = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;

    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_High = this.priceData[candleOne_Index].high,
        candleOne_Low = this.priceData[candleOne_Index].low;

    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;

    var highWick = Math.abs(candleOne_High - Math.max(candleOne_Open, candleOne_Close)),
        candleBodySize = Math.abs(candleOne_Low - candleOne_High),
        isOpenCloseLowAlmostSame = ((candleOne_Open === candleOne_Close) || ((candleBodySize * 0.05) >= Math.abs(candleOne_Open - candleOne_Close)))
        && (candleOne_Low === Math.min(candleOne_Open, candleOne_Close)) || ((candleBodySize * 0.05) >= Math.abs(candleOne_Low - Math.min(candleOne_Open, candleOne_Close))),
        isUpperShadowLong = (highWick >= (candleBodySize * 0.80));

    var isBullishContinuation = isCandleTwo_Bearish //occurs at the top of downtrend
                                && isOpenCloseLowAlmostSame //the open, high, and close are the same or about the same price
                                && isUpperShadowLong;// The most important part of the Graveston Doji is the long upper shadow..

    var isBearishContinuation = isCandleTwo_Bullish //occurs at the top of uptrends
                                && isOpenCloseLowAlmostSame //the open, high, and close are the same or about the same price
                                && isUpperShadowLong;// The most important part of the Graveston Doji is the long upper shadow..

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLHAMMER = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;

    var candleThree_Open = this.priceData[candleThree_Index].open,
        candleThree_Close = this.priceData[candleThree_Index].close;
    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_Low = this.priceData[candleOne_Index].low,
        candleOne_High = this.priceData[candleOne_Index].high;

    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
		isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;

    var candleOneUpperShadow = Math.abs(Math.max(candleOne_Open, candleOne_Close) - candleOne_High),
        candleOneBody = Math.abs(candleOne_Open - candleOne_Close),
        candleBodySize = Math.abs(candleOne_Low - candleOne_High),
        candleOneLowerShadow = Math.abs(candleOne_Low - Math.min(candleOne_Close, candleOne_Open)),
        isOpenCloseHighAlmostSame = (candleOneBody < (candleBodySize * 0.40))
        && ((candleOne_High === Math.max(candleOne_Open, candleOne_Close)) || (candleOneUpperShadow < (candleBodySize * 0.10)));

    var isBullishContinuation = isCandleTwo_Bearish && (candleTwo_Open < Math.min(candleThree_Close, candleThree_Open)) //a downward trend indicating a bullish reversal, it is a hammer
                                && isOpenCloseHighAlmostSame  //the open, high, and close are roughly the same price. means it has a small body.
                                && (candleOneLowerShadow >= (2.0 * candleOneBody)) && (candleOne_Close < candleTwo_Close); //there is a long lower shadow, twice the length as the real body.

    //It's a bullish candlestick
    var isBearishContinuation = false;

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLHANGINGMAN = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;

    var candleThree_Open = this.priceData[candleThree_Index].open,
        candleThree_Close = this.priceData[candleThree_Index].close;
    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_Low = this.priceData[candleOne_Index].low,
        candleOne_High = this.priceData[candleOne_Index].high;

    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
		isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;

    var candleOneUpperShadow = Math.abs(Math.max(candleOne_Open, candleOne_Close) - candleOne_High),
        candleOneBody = Math.abs(candleOne_Open - candleOne_Close),
        candleBodySize = Math.abs(candleOne_Low - candleOne_High),
        candleOneLowerShadow = Math.abs(candleOne_Low - Math.min(candleOne_Close, candleOne_Open)),
        isOpenCloseHighAlmostSame = (candleOneBody < (candleBodySize * 0.40))
        && ((candleOne_High === Math.max(candleOne_Open, candleOne_Close)) || (candleOneUpperShadow < (candleBodySize * 0.10)));

    var isBearishContinuation = isCandleTwo_Bullish && (candleTwo_Open > Math.max(candleThree_Close, candleThree_Open)) //a downward trend indicating a bullish reversal, it is a hammer
                              && isOpenCloseHighAlmostSame //the open, high, and close are roughly the same price. means it has a small body.
                              && (candleOneLowerShadow >= (2.0 * candleOneBody) && (candleOne_Close > candleTwo_Close)); //there is a long lower shadow, twice the length as the real body.

    //It's a bearish candlestick
    var isBullishContinuation = false;

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLHARAMI = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;

    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close,
        candleTwo_Low = this.priceData[candleTwo_Index].low,
        candleTwo_High = this.priceData[candleTwo_Index].high;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close;

    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;

    var isBullishContinuation = isCandleTwo_Bearish && (this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close))//the first candlestick is upward
                                && isCandleOne_Bullish && (candleOne_Open > candleTwo_Close) && (candleOne_Close < candleTwo_Open)// followed by a smaller candlestick whose body is located within the vertical range of the larger body
                                && (Math.abs(candleOne_Open - candleOne_Close) < (Math.abs(candleTwo_Open - candleTwo_Close) * 0.60)); //Must be smaller than prevoius day

    var isBearishContinuation = isCandleTwo_Bullish && (this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close))// a large bullish green candle on Day 1
                               && isCandleOne_Bearish && (candleOne_Open < candleTwo_Close) && (candleOne_Close > candleTwo_Open)// followed by a smaller candlestick whose body is located within the vertical range of the larger body
                               && (Math.abs(candleOne_Open - candleOne_Close) < (Math.abs(candleTwo_Open - candleTwo_Close) * 0.60));//Must be smaller than prevoius day

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLHARAMICROSS = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;

    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_Low = this.priceData[candleOne_Index].low,
        candleOne_High = this.priceData[candleOne_Index].high;

    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;

    var dojiResponse_candleOne = this.CDLDOJI(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close);

    var isBullishContinuation = isCandleTwo_Bearish //the first candlestick is upward
                                && dojiResponse_candleOne.isBull && (Math.min(candleOne_Close, candleOne_Open) > candleTwo_Close) && (Math.max(candleOne_Close, candleOne_Open) < candleTwo_Open); //followed by a doji that is located within the top and bottom of the candlestick's body. 

    var isBearishContinuation = isCandleTwo_Bullish // a large bullish green candle on Day 1
                                && dojiResponse_candleOne.isBear && (Math.min(candleOne_Close, candleOne_Open) > candleTwo_Open) && (Math.max(candleOne_Close, candleOne_Open) < candleTwo_Close); //followed by a doji that is located within the top and bottom of the candlestick's body. 

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLHOMINGPIGEON = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;

    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close,
        candleTwo_Low = this.priceData[candleTwo_Index].low,
        candleTwo_High = this.priceData[candleTwo_Index].high;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_Low = this.priceData[candleOne_Index].low,
        candleOne_High = this.priceData[candleOne_Index].high;

    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;

    var candleOneBody = Math.abs(candleOne_Close - candleOne_Open);

    var isBullishContinuation = isCandleTwo_Bearish && (this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close))// First candle is a long black candle.
                                && isCandleOne_Bearish 
                                && (candleOne_Low > candleTwo_Low) && (candleOne_Close > candleTwo_Close) // Second candle is an inside bar, which is also a black candle. Second candle closes inside the body of the first candle.
                                && (candleOne_High < candleTwo_High) && (candleOne_Open < candleTwo_Open);
    //It's a bullish candlestick
    var isBearishContinuation = false;

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLHIKKAKE = function () {

    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;
    var candleFour_Index = candleOne_Index - 3;
    var candleFive_Index = candleOne_Index - 4;
    var isBullishContinuation = false, isBearishContinuation = false;

    if (candleFour_Index >= 0 && candleFive_Index > 0) {
        var candleFive_Open = this.priceData[candleFive_Index].open,
            candleFive_Close = this.priceData[candleFive_Index].close;
        var candleFour_Open = this.priceData[candleFour_Index].open,
            candleFour_Close = this.priceData[candleFour_Index].close;
        var candleThree_Open = this.priceData[candleThree_Index].open,
            candleThree_Close = this.priceData[candleThree_Index].close;
        var candleTwo_Open = this.priceData[candleTwo_Index].open,
            candleTwo_Close = this.priceData[candleTwo_Index].close;
        var candleOne_Open = this.priceData[candleOne_Index].open,
            candleOne_Close = this.priceData[candleOne_Index].close;

        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
            isCandleOne_Bearish = candleOne_Close < candleOne_Open;

        var isBullishContinuation = Math.max(candleFive_Close, candleFive_Open) > Math.max(candleFour_Close, candleFour_Open)
                                   && Math.min(candleFive_Close, candleFive_Open) < Math.min(candleFour_Close, candleFour_Open)
                                   && Math.max(candleFive_Close, candleFive_Open) > Math.max(candleThree_Close, candleThree_Open)
                                   && Math.max(candleFive_Close, candleFive_Open) > Math.max(candleTwo_Close, candleTwo_Open)
                                   && isCandleOne_Bullish
                                   && (candleOne_Close > Math.max(candleFive_Close, candleFive_Open));// reaches above the range of the three preceding ,

        var isBearishContinuation = Math.max(candleFive_Close, candleFive_Open) > Math.max(candleFour_Close, candleFour_Open)
                                  && Math.min(candleFive_Close, candleFive_Open) < Math.min(candleFour_Close, candleFour_Open)
                                  && Math.min(candleFive_Close, candleFive_Open) < Math.min(candleThree_Close, candleThree_Open)
                                  && Math.min(candleFive_Close, candleFive_Open) < Math.min(candleTwo_Close, candleTwo_Open)
                                  && isCandleOne_Bearish
                                  && (candleOne_Close < Math.min(candleFive_Close, candleFive_Open));

    }
    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLIDENTICAL3CROWS = function () {

    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;
    var candleFour_Index = candleOne_Index - 3;
    var isBullishContinuation = false, isBearishContinuation = false;

    if (candleFour_Index >= 0 ) {
        var candleFour_Open = this.priceData[candleFour_Index].open,
            candleFour_Close = this.priceData[candleFour_Index].close;
        var candleThree_Open = this.priceData[candleThree_Index].open,
            candleThree_Close = this.priceData[candleThree_Index].close,
            candleThree_Low = this.priceData[candleThree_Index].low,
            candleThree_High = this.priceData[candleThree_Index].high;
        var candleTwo_Open = this.priceData[candleTwo_Index].open,
            candleTwo_Close = this.priceData[candleTwo_Index].close,
            candleTwo_Low = this.priceData[candleTwo_Index].low,
            candleTwo_High = this.priceData[candleTwo_Index].high;
        var candleOne_Open = this.priceData[candleOne_Index].open,
            candleOne_Close = this.priceData[candleOne_Index].close,
            candleOne_Low = this.priceData[candleOne_Index].low,
            candleOne_High = this.priceData[candleOne_Index].high;

        var isCandleFour_Bullish = candleFour_Close > candleFour_Open,
           isCandleThree_Bearish = candleThree_Close < candleThree_Open,
           isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open,
           isCandleOne_Bearish = candleOne_Close < candleOne_Open;

        var candleThreeBodySize = Math.abs(candleThree_Close - candleThree_Open),
             candleTwoBodySize = Math.abs(candleTwo_Close - candleTwo_Open),
             candleOneBodySize = Math.abs(candleOne_Close - candleOne_Open);

        //It''s a bearish candlestick
        var isBullishContinuation = false;

        var isBearishContinuation = isCandleFour_Bullish
                                 && isCandleThree_Bearish && (this.indicators.isLongCandle(candleThree_Open, candleThree_High, candleThree_Low, candleThree_Close))
				                 && isCandleTwo_Bearish && (this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close)) && (candleTwo_Open === candleThree_Close || (Math.abs(candleThree_Close - candleTwo_Open) < (candleThreeBodySize * .10))) && (candleTwo_Close < candleThree_Close) //Three consecutive long red days with lower closes each day
					             && isCandleOne_Bearish && (this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close)) && (candleOne_Open === candleTwo_Close || (Math.abs(candleTwo_Close - candleOne_Open) < (candleTwoBodySize * .10))) && (candleOne_Close < candleTwo_Close);  //and Each day opens at or near the previous day's close.

    }
    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLINNECK = function () {

    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;

    var candleThree_Open = this.priceData[candleThree_Index].open,
        candleThree_Close = this.priceData[candleThree_Index].close;
    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close,
        candleTwo_Low = this.priceData[candleTwo_Index].low,
        candleTwo_High = this.priceData[candleTwo_Index].high;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close;

    var isCandleThree_Bearish = candleThree_Close < candleThree_Open,
        isCandleThree_Bullish = candleThree_Close > candleThree_Open;

    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;

    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;

    var candleTwoBodySize = Math.abs(candleTwo_Close - candleTwo_Open);

    var isBullishContinuation = isCandleThree_Bullish //After an uptrend
                                && isCandleTwo_Bullish && (this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close)) //1st day is a long blue day.
                                && isCandleOne_Bearish && (candleOne_Open > candleTwo_High)  //2nd day is a red day which opens above the high of the 1st day
                                && (candleOne_Close < candleTwo_Close) && (candleOne_Close > (candleTwo_Close - (candleTwoBodySize * 0.10)));//2nd day closes barely into the body of the 1st day,near 1st day close.

    var isBearishContinuation = isCandleThree_Bearish //After a downtrend
                                && isCandleTwo_Bearish && (this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close)) //1st day is a long red day.
                                && isCandleOne_Bullish && (candleOne_Open < candleTwo_Low)  //2nd day is a white day which opens below the low of the 1st day
                                && (candleOne_Close > candleTwo_Close) && (candleOne_Close < (candleTwo_Close + (candleTwoBodySize * 0.10)));//2nd day closes barely into the body of the 1st day,near 1st day close.

    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLINVERTEDHAMMER = function () {

    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;

    var candleThree_Open = this.priceData[candleThree_Index].open,
        candleThree_Close = this.priceData[candleThree_Index].close;
    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_Low = this.priceData[candleOne_Index].low,
        candleOne_High = this.priceData[candleOne_Index].high;

    var isCandleThree_Bearish = candleThree_Close < candleThree_Open,
        isCandleThree_Bullish = candleThree_Close > candleThree_Open;

    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;

    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;

    var candleOneUpperShadow = Math.abs(Math.max(candleOne_Open, candleOne_Close) - candleOne_High),
        candleOneBody = Math.abs(candleOne_Open - candleOne_Close),
        candleBodySize = Math.abs(candleOne_Low - candleOne_High),
        candleOneLowerShadow = Math.abs(candleOne_Low - Math.min(candleOne_Close, candleOne_Open)),
        isOpenCloseLowAlmostSame = (candleOneBody < (candleBodySize * 0.40))
        && ((candleOne_Low === Math.min(candleOne_Open, candleOne_Close)) || (candleOneLowerShadow < (candleBodySize * 0.10)));

    var isBullishContinuation = (Math.min(candleTwo_Close, candleTwo_Open) < (Math.min(candleThree_Open, candleThree_Close)))
                                && (Math.min(candleOne_Close, candleOne_Open) < Math.min(candleTwo_Close, candleTwo_Open))  //a downward trend indicating a bullish reversal, it is a inverted hammer
                                && isOpenCloseLowAlmostSame //the open, low, and close are roughly the same price. means it has a small body.
                                && (candleOneUpperShadow >= (2.0 * candleOneBody)); //there is a long upper shadow, which should be at least twice the length of the real body.

    //It's a bullish candlestick
    var isBearishContinuation = false;

    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLKICKING = function () {

    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;

    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close,
        candleTwo_Low = this.priceData[candleTwo_Index].low,
        candleTwo_High = this.priceData[candleTwo_Index].high;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_Low = this.priceData[candleOne_Index].low,
        candleOne_High = this.priceData[candleOne_Index].high;

    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
		isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;


    var isBullishContinuation = isCandleTwo_Bearish && (candleTwo_Low === candleTwo_Close) && (candleTwo_High === candleTwo_Open)  // a black or filled candlestick without any wicks (shadows)
                               && isCandleOne_Bullish && (candleOne_Low === candleOne_Open) && (candleOne_High === candleOne_Close) //followed by a gap higher with a white or hollow candlestick that is also without wicks.
                               && (candleOne_Open > candleTwo_Open); //Gap up


    var isBearishContinuation = isCandleTwo_Bullish && (candleTwo_Low === candleTwo_Open) && (candleTwo_High === candleTwo_Close)  // a black or filled candlestick without any wicks (shadows)
                               && isCandleOne_Bearish && (candleOne_Low === candleOne_Close) && (candleOne_High === candleOne_Open) //followed by a gap higher with a white or hollow candlestick that is also without wicks.
                               && (candleOne_Open < candleTwo_Open); //Gap down

    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLLADDERBOTTOM = function () {

    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;
    var candleFour_Index = candleOne_Index - 3;
    var candleFive_Index = candleOne_Index - 4;

    var isBullishContinuation = false, isBearishContinuation = false;

    if (candleFour_Index >= 0 && candleFive_Index > 0) {
        var candleFive_Open = this.priceData[candleFive_Index].open,
            candleFive_Close = this.priceData[candleFive_Index].close;
        var candleFour_Open = this.priceData[candleFour_Index].open,
            candleFour_Close = this.priceData[candleFour_Index].close;
        var candleThree_Open = this.priceData[candleThree_Index].open,
            candleThree_Close = this.priceData[candleThree_Index].close;
        var candleTwo_Open = this.priceData[candleTwo_Index].open,
            candleTwo_Close = this.priceData[candleTwo_Index].close,
            candleTwo_Low = this.priceData[candleTwo_Index].low,
            candleTwo_High = this.priceData[candleTwo_Index].high;
        var candleOne_Open = this.priceData[candleOne_Index].open,
            candleOne_Close = this.priceData[candleOne_Index].close;

        var isCandleFive_Bullish = candleFive_Close > candleFive_Open,
            isCandleFive_Bearish = candleFive_Close < candleFive_Open;
        var isCandleFour_Bullish = candleFour_Close > candleFour_Open,
			isCandleFour_Bearish = candleFour_Close < candleFour_Open;
        var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
            isCandleThree_Bearish = candleThree_Close < candleThree_Open;
        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;

        var isBullishContinuation = isCandleFive_Bearish
                                    && isCandleFour_Bearish && candleFour_Open > candleFive_Close && candleFour_Close < candleFive_Close && candleFour_Open < candleFive_Open// 1st three days are red days with lower opens and closes each day.
                                    && isCandleThree_Bearish && candleThree_Open > candleFour_Close && candleThree_Close < candleFour_Close && candleThree_Open < candleFour_Open// 1st three days are red days with lower opens and closes each day.
                                    && isCandleTwo_Bearish && candleTwo_High > candleThree_Close && candleTwo_High > candleTwo_Open && candleTwo_Close < candleThree_Close && candleTwo_Open < candleThree_Open // 4th day is a red day with an upper shadow.
                                    && isCandleOne_Bullish && candleOne_Open > candleTwo_Open; //The last day is white that opens above the body of the 4th day.

        //It's a bullish candlestick
        var isBearishContinuation = false;

    }
    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLKICKINGBYLENGTH = function () {

    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;

    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close,
        candleTwo_Low = this.priceData[candleTwo_Index].low,
        candleTwo_High = this.priceData[candleTwo_Index].high;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_Low = this.priceData[candleOne_Index].low,
        candleOne_High = this.priceData[candleOne_Index].high;

    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;

    var isBullishContinuation = isCandleTwo_Bearish && (this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close)) && (candleTwo_Low === candleTwo_Close) && (candleTwo_High === candleTwo_Open)  // a black or filled candlestick without any wicks (shadows)
                               && isCandleOne_Bullish && (this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close)) && (candleOne_Low === candleOne_Open) && (candleOne_High === candleOne_Close) //followed by a gap higher with a white or hollow candlestick that is also without wicks.
                               && (candleOne_Open > candleTwo_Open); //Gap up


    var isBearishContinuation = isCandleTwo_Bullish && (this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close)) && (candleTwo_Low === candleTwo_Open) && (candleTwo_High === candleTwo_Close)  // a black or filled candlestick without any wicks (shadows)
                               && isCandleOne_Bearish && (this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close)) && (candleOne_Low === candleOne_Close) && (candleOne_High === candleOne_Open) //followed by a gap higher with a white or hollow candlestick that is also without wicks.
                               && (candleOne_Open < candleTwo_Open); //Gap down

    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLLONGLEGGEDDOJI = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;

    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_Low = this.priceData[candleOne_Index].low,
        candleOne_High = this.priceData[candleOne_Index].high;

    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;

    var lowerShadow = Math.abs(candleOne_Low - Math.min(candleOne_Open, candleOne_Close)),
        upperShadow = Math.abs(candleOne_High - Math.max(candleOne_Open, candleOne_Close)),
        candleBodySize = Math.abs(candleOne_Low - candleOne_High),
        realBodySize = Math.abs(candleOne_Open - candleOne_Close),
        isOpenCloseAlmostSame = ((candleOne_Open === candleOne_Close) || (realBodySize < (candleBodySize * 0.10))),
        isLowerShadowLong = (lowerShadow >= (candleBodySize * 0.40)) && (lowerShadow <= (candleBodySize * 0.80)),
        isUpperShadowLong = (upperShadow >= (candleBodySize * 0.40)) && (upperShadow <= (candleBodySize * 0.80));

    var isBullishContinuation = isCandleTwo_Bearish//occurs at the bottom of downtrends.
                                && isOpenCloseAlmostSame //vary small  body 
                                && isUpperShadowLong //long and almost same shadows 
                                && isLowerShadowLong;// long and almost same shadows

    var isBearishContinuation = isCandleTwo_Bullish //occurs at the top of uptrends\
                                && isOpenCloseAlmostSame //vary small body 
                                && isUpperShadowLong //long and almost same shadows
                                && isLowerShadowLong;// long and almost same shadows.

    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLLONGLINE = function () {
    var candleOne_Index = this.priceData.length - 1;

    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_Low = this.priceData[candleOne_Index].low,
        candleOne_High = this.priceData[candleOne_Index].high;

    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
		isCandleOne_Bearish = candleOne_Close < candleOne_Open;

    var lowerShadow = Math.abs(candleOne_Low - Math.min(candleOne_Open, candleOne_Close)),
        upperShadow = Math.abs(candleOne_High - Math.max(candleOne_Open, candleOne_Close)),
        candleBodySize = Math.abs(candleOne_Low - candleOne_High),
        realBodySize = Math.abs(candleOne_Close - candleOne_Open),
        isLowerShadowShort = (lowerShadow === 0) || (lowerShadow < (candleBodySize * 0.10)),
        isUpperShadowShort = (upperShadow === 0) || (upperShadow < (candleBodySize * 0.10));

    var isBullishContinuation = isCandleOne_Bullish
                                && this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close)
                                && isLowerShadowShort && isUpperShadowShort;

    var isBearishContinuation = isCandleOne_Bearish
                                && this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close)
                                && isLowerShadowShort && isUpperShadowShort;

    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLMARUBOZU = function () {
    var candleOne_Index = this.priceData.length - 1;

    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_Low = this.priceData[candleOne_Index].low,
        candleOne_High = this.priceData[candleOne_Index].high;

    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
		isCandleOne_Bearish = candleOne_Close < candleOne_Open;

    var lowerShadow = Math.abs(candleOne_Low - Math.min(candleOne_Open, candleOne_Close)),
        upperShadow = Math.abs(candleOne_High - Math.max(candleOne_Open, candleOne_Close)),
        candleBodySize = Math.abs(candleOne_Low - candleOne_High),
        realBodySize = Math.abs(candleOne_Close - candleOne_Open),
        isLowerShadowShort = (lowerShadow === 0) || (lowerShadow <= (candleBodySize * 0.05)),
        isUpperShadowShort = (upperShadow === 0) || (upperShadow <= (candleBodySize * 0.05));

    return {
        isBearishContinuation: isCandleOne_Bearish
                              && this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close)
                              && (isUpperShadowShort && isLowerShadowShort),
        isBullishContinuation: isCandleOne_Bullish
                              && this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close)
                              && isUpperShadowShort && isLowerShadowShort
    };

    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLMATCHINGLOW = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;

    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close;

    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
		isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;


    var isBullishContinuation = isCandleTwo_Bearish && (candleTwo_Open > candleOne_Open)  // The first candle has a tall body
                               && isCandleOne_Bearish && (candleOne_Close === candleTwo_Close); //The second day follows with another black candlestick whose closing price is exactly equal to the closing price of the first day.

    //It's a bullish candlestick
    var isBearishContinuation = false;

    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLMATHOLD = function () {

    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;
    var candleFour_Index = candleOne_Index - 3;
    var candleFive_Index = candleOne_Index - 4;

    var isBullishContinuation = false, isBearishContinuation = false;

    if (candleFour_Index >= 0 && candleFive_Index > 0) {
        var candleFive_Open = this.priceData[candleFive_Index].open,
            candleFive_Close = this.priceData[candleFive_Index].close,
            candleFive_High = this.priceData[candleFive_Index].high,
            candleFive_Low = this.priceData[candleFive_Index].low;
        var candleFour_Open = this.priceData[candleFour_Index].open,
            candleFour_Close = this.priceData[candleFour_Index].close,
            candleFour_High = this.priceData[candleFour_Index].high,
            candleFour_Low = this.priceData[candleFour_Index].low;
        var candleThree_Open = this.priceData[candleThree_Index].open,
            candleThree_Close = this.priceData[candleThree_Index].close,
            candleThree_High = this.priceData[candleThree_Index].high,
            candleThree_Low = this.priceData[candleThree_Index].low;
        var candleTwo_Open = this.priceData[candleTwo_Index].open,
            candleTwo_Close = this.priceData[candleTwo_Index].close,
            candleTwo_High = this.priceData[candleTwo_Index].high,
            candleTwo_Low = this.priceData[candleTwo_Index].low;
        var candleOne_Open = this.priceData[candleOne_Index].open,
            candleOne_Close = this.priceData[candleOne_Index].close,
            candleOne_High = this.priceData[candleOne_Index].high,
            candleOne_Low = this.priceData[candleOne_Index].low;

        var isCandleFive_Bullish = candleFive_Close > candleFive_Open,
            isCandleFive_Bearish = candleFive_Close < candleFive_Open;
        var isCandleFour_Bullish = candleFour_Close > candleFour_Open,
            isCandleFour_Bearish = candleFour_Close < candleFour_Open;
        var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
            isCandleThree_Bearish = candleThree_Close < candleThree_Open;
        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
            isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
            isCandleOne_Bearish = candleOne_Close < candleOne_Open;

        var isBullishContinuation = isCandleFive_Bullish && (this.indicators.isLongCandle(candleFive_Open, candleFive_High, candleFive_Low, candleFive_Close))  //The first day is a long white day
                                    && isCandleFour_Bearish && (candleFour_Close > candleFive_Close) && (this.indicators.isLongCandle(candleFour_Open, candleFour_High, candleFour_Low, candleFour_Close))//The second day gaps up and is a black day
                                    && isCandleThree_Bearish && (candleThree_Close < candleFour_Close) && (this.indicators.isLongCandle(candleThree_Open, candleThree_High, candleThree_Low, candleThree_Close))//The second, third, and fourth days have small real bodies and follow a brief downtrend pattern, but stay within the range of the first day 
                                    && isCandleTwo_Bearish && (candleTwo_Close < candleThree_Close) && (this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close)) && (candleTwo_Close > candleFive_Open) //  stay within the range of the first day 
                                    && isCandleOne_Bullish && (this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close)) && (candleOne_Close > candleFour_Close);// The fifth day is a long white day that closes above the trading ranges of the previous four days

        var isBearishContinuation = isCandleFive_Bearish && (this.indicators.isLongCandle(candleFive_Open, candleFive_High, candleFive_Low, candleFive_Close)) //The first day is a long red day
                                    && isCandleFour_Bullish && (candleFour_Close < candleFive_Close) && (this.indicators.isLongCandle(candleFour_Open, candleFour_High, candleFour_Low, candleFour_Close))//The second day gaps up and is a black day
                                    && isCandleThree_Bullish && (candleThree_Close > candleFour_Close) && (this.indicators.isLongCandle(candleThree_Open, candleThree_High, candleThree_Low, candleThree_Close))//The second, third, and fourth days have small real bodies and follow a brief downtrend pattern, but stay within the range of the first day 
                                    && isCandleTwo_Bullish && (candleTwo_Close > candleThree_Close) && (this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close)) && (candleTwo_Close < candleFive_Open) //  stay within the range of the first day 
                                    && isCandleOne_Bearish && (this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close)) && (candleOne_Close < candleFour_Close);// The fifth day is a long white day that closes bellow  the trading ranges of the previous four days

    }
    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLMORNINGDOJISTAR = function () {

    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;
    var candleFour_Index = candleOne_Index - 3;

    var isBullishContinuation = false, isBearishContinuation = false;

    if (candleFour_Index >= 0) {

        var candleFour_Open = this.priceData[candleFour_Index].open,
            candleFour_Close = this.priceData[candleFour_Index].close;
        var candleThree_Open = this.priceData[candleThree_Index].open,
            candleThree_Close = this.priceData[candleThree_Index].close,
            candleThree_High = this.priceData[candleThree_Index].high,
            candleThree_Low = this.priceData[candleThree_Index].low;
        var candleTwo_Open = this.priceData[candleTwo_Index].open,
            candleTwo_Close = this.priceData[candleTwo_Index].close,
            candleTwo_High = this.priceData[candleTwo_Index].high,
            candleTwo_Low = this.priceData[candleTwo_Index].low;
        var candleOne_Open = this.priceData[candleOne_Index].open,
            candleOne_Close = this.priceData[candleOne_Index].close,
            candleOne_High = this.priceData[candleOne_Index].high,
            candleOne_Low = this.priceData[candleOne_Index].low;

        var isCandleFour_Bearish = candleFour_Close < candleFour_Open;

        var isCandleThree_Bearish = candleThree_Close < candleThree_Open;

        var isCandleOne_Bullish = candleOne_Close > candleOne_Open;

        var candleOneBody = Math.abs(candleOne_Open - candleOne_Close),
            candleThreeBody = Math.abs(candleThree_Open - candleThree_Close),
            candleTwoBody = Math.abs(candleTwo_Low - candleTwo_High),
            iscandleTwoDoji = candleTwo_Open === candleTwo_Close || ((candleTwoBody * 0.10) >= Math.abs(candleTwo_Open - candleTwo_Close));

        var isBullishContinuation = (candleThree_Close < Math.min(candleFour_Close, candleFour_Open))  //occurs within a defined downtrend.
                                    && isCandleThree_Bearish && (this.indicators.isLongCandle(candleThree_Open, candleThree_High, candleThree_Low, candleThree_Close))  //The first part of an Evening Star reversal pattern is a large bullish green candle.
                                    && iscandleTwoDoji && (Math.max(candleTwo_Open, candleTwo_Close) < candleThree_Close) //The second day begins with a gap down and it is quite small and can be bullish or bearish.
                                    && isCandleOne_Bullish && (this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close)) && (candleOne_Open > Math.max(candleTwo_Open, candleTwo_Close))//a large Bullish Candle with gap up.
                                    && (candleOne_Close < candleThree_Open) && (candleOne_Close > candleThree_Close); //closes well within the body of the first candle

        //It's a bullish candlestick
        var isBearishContinuation = false;
    }
    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLMORNINGSTAR = function () {

    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;
    var candleFour_Index = candleOne_Index - 3;

    var isBullishContinuation = false, isBearishContinuation = false;

    if (candleFour_Index >= 0) {

        var candleFour_Open = this.priceData[candleFour_Index].open,
            candleFour_Close = this.priceData[candleFour_Index].close;
        var candleThree_Open = this.priceData[candleThree_Index].open,
            candleThree_Close = this.priceData[candleThree_Index].close;
        var candleTwo_Open = this.priceData[candleTwo_Index].open,
            candleTwo_Close = this.priceData[candleTwo_Index].close;
        var candleOne_Open = this.priceData[candleOne_Index].open,
            candleOne_Close = this.priceData[candleOne_Index].close;

        var isCandleFour_Bearish = candleFour_Close < candleFour_Open;
        var isCandleThree_Bearish = candleThree_Close < candleThree_Open;
        var isCandleOne_Bullish = candleOne_Close > candleOne_Open;

        var candleOneBody = Math.abs(candleOne_Open - candleOne_Close);
        var candleTwoBody = Math.abs(candleTwo_Open - candleTwo_Close);
        var candleThreeBody = Math.abs(candleThree_Open - candleThree_Close);

        var isBullishContinuation = (candleThree_Close < Math.min(candleFour_Close, candleFour_Open)) //its a bullish reversal pattern, usually occuring at the bottom of a downtrend. 
                                    && isCandleThree_Bearish && (candleThreeBody > (candleTwoBody * 3)) //The first part of an Evening Star reversal pattern is a large bullish green candle.
                                    && (candleTwoBody < (candleThreeBody / 3)) && (Math.max(candleTwo_Open, candleTwo_Close) < candleThree_Close) //The second day begins with a gap down and it is quite small and can be bullish or bearish.
                                    && isCandleOne_Bullish && (candleOneBody > candleTwoBody * 3) && (candleOne_Open > Math.max(candleTwo_Open, candleTwo_Close))//a large Bearish Candle than opens above the middle candle  and closes near the center of the first bar's body
                                    && (candleOne_Close < candleThree_Open);

        //It's a bullish only
        var isBearishContinuation = false;
    }
    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLONNECK = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;

    var candleThree_Open = this.priceData[candleThree_Index].open,
        candleThree_Close = this.priceData[candleThree_Index].close;
    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close,
        candleTwo_Low = this.priceData[candleTwo_Index].low,
        candleTwo_High = this.priceData[candleTwo_Index].high;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close;

    var isCandleThree_Bearish = candleThree_Close < candleThree_Open,
        isCandleThree_Bullish = candleThree_Close > candleThree_Open;
    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;

    var candleTwoBodySize = Math.abs(candleTwo_Close - candleTwo_Open);

    var isBullishContinuation = isCandleThree_Bullish //After an uptrend
                                && isCandleTwo_Bullish && (this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close)) //1st day is a long blue day.
                                && isCandleOne_Bearish && (candleOne_Open > candleTwo_High)  //2nd day is a red day which opens above the high of the 1st day
                                && (candleOne_Close >= candleTwo_High) && (candleOne_Close <= (candleTwo_High + (candleTwoBodySize * 0.10)));//The closing price of the black candle is at or near the high of the white candle

    var isBearishContinuation = isCandleThree_Bearish //After a downtrend
                                && isCandleTwo_Bearish && (this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close)) //1st day is a long red day.
                                && isCandleOne_Bullish && (candleOne_Open < candleTwo_Low)  //2nd day is a white day which opens below the low of the 1st day
                                && (candleOne_Close <= candleTwo_Low) && (candleOne_Close >= (candleTwo_Low - (candleTwoBodySize * 0.10)));//The closing price of the white candle is at or near the low of the black candle


    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLPIERCING = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;

    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close;

    var isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open;

    var isBullishContinuation = isCandleTwo_Bearish
                                && isCandleOne_Bullish && (candleOne_Open < candleTwo_Close) //white candlestick must open below the previous close.
                                && (candleOne_Close > (Math.abs(candleTwo_Open + candleTwo_Close) / 2))//close above the midpoint of the black candlestick's body.
                                && (candleOne_Close < candleTwo_Open);//close within the price range of the previous day
    //It's a bullish candlestick
    var isBearishContinuation = false;


    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLRICKSHAWMAN = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;

    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_High = this.priceData[candleOne_Index].high,
        candleOne_Low = this.priceData[candleOne_Index].low;

    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;

    var lowerShadow = Math.abs(candleOne_Low - Math.min(candleOne_Open, candleOne_Close)),
        upperShadow = Math.abs(candleOne_High - Math.max(candleOne_Open, candleOne_Close)),
        candleBodySize = Math.abs(candleOne_Low - candleOne_High),
        realBodySize = Math.abs(candleOne_Open - candleOne_Close),
        isOpenCloseAlmostSame = ((candleOne_Open === candleOne_Close) || (realBodySize < (candleBodySize * 0.10))),
        isLowerShadowLong = (lowerShadow >= (candleBodySize * 0.40)) && (lowerShadow <= (candleBodySize * 0.80)),
        isUpperShadowLong = (upperShadow >= (candleBodySize * 0.40)) && (upperShadow <= (candleBodySize * 0.80));

    var isBullishContinuation = isCandleTwo_Bearish//occurs at the bottom of downtrends.
                                && isOpenCloseAlmostSame //vary small  body 
                                && isUpperShadowLong //long and almost same shadows 
                                && isLowerShadowLong;// long and almost same shadows

    var isBearishContinuation = isCandleTwo_Bullish //occurs at the top of uptrends\
                                && isOpenCloseAlmostSame //vary small body 
                                && isUpperShadowLong //long and almost same shadows
                                && isLowerShadowLong;// long and almost same shadows.

    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLRISEFALL3METHODS = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;
    var candleFour_Index = candleOne_Index - 3;
    var candleFive_Index = candleOne_Index - 4;

    var isBullishContinuation = false, isBearishContinuation = false;

    if (candleFour_Index >= 0 && candleFive_Index > 0) {
        var candleFive_Open = this.priceData[candleFive_Index].open,
            candleFive_Close = this.priceData[candleFive_Index].close,
            candleFive_High = this.priceData[candleFive_Index].low,
            candleFive_Low = this.priceData[candleFive_Index].high;
        var candleFour_Open = this.priceData[candleFour_Index].open,
            candleFour_Close = this.priceData[candleFour_Index].close,
            candleFour_High = this.priceData[candleFour_Index].low,
            candleFour_Low = this.priceData[candleFour_Index].high;
        var candleThree_Open = this.priceData[candleThree_Index].open,
            candleThree_Close = this.priceData[candleThree_Index].close,
            candleThree_Low = this.priceData[candleThree_Index].low,
            candleThree_High = this.priceData[candleThree_Index].high;
        var candleTwo_Open = this.priceData[candleTwo_Index].open,
            candleTwo_Close = this.priceData[candleTwo_Index].close,
            candleTwo_Low = this.priceData[candleTwo_Index].low,
            candleTwo_High = this.priceData[candleTwo_Index].high;
        var candleOne_Open = this.priceData[candleOne_Index].open,
            candleOne_Close = this.priceData[candleOne_Index].close;

        var isCandleFive_Bullish = candleFive_Close > candleFive_Open,
            isCandleFive_Bearish = candleFive_Close < candleFive_Open;
        var isCandleFour_Bullish = candleFour_Close > candleFour_Open,
			isCandleFour_Bearish = candleFour_Close < candleFour_Open;
        var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
            isCandleThree_Bearish = candleThree_Close < candleThree_Open;
        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;


        var isBullishContinuation = isCandleFive_Bullish && (this.indicators.isLongCandle(candleFive_Open, candleFive_High, candleFive_Low, candleFive_Close)) //The first candlestick in this pattern is a light bullish candlestick with a large real body
                                    && isCandleFour_Bearish && candleFour_Low > candleFive_Low && candleFour_High < candleFive_High // it should be within the high and low of the first candlestick. 
                                    && isCandleThree_Bearish && candleThree_Low > candleFive_Low && candleThree_High < candleFive_High // it should be within the high and low of the first candlestick. 
                                    && isCandleTwo_Bearish && candleTwo_Low > candleFive_Low && candleTwo_High < candleFive_High // it should be within the high and low of the first candlestick. 
                                    && isCandleOne_Bullish && candleOne_Open > candleTwo_Close && candleOne_Close > candleFive_Close;//he last candlestick that completes the pattern should open higher than the close of its preceding candlestick and should close above the close of the first candlestick.

        var isBearishContinuation = isCandleFive_Bearish && (this.indicators.isLongCandle(candleFive_Open, candleFive_High, candleFive_Low, candleFive_Close))
                                    && isCandleFour_Bullish && candleFour_Low > candleFive_Low && candleFour_High < candleFive_High // it should be within the high and low of the first candlestick. 
                                    && isCandleThree_Bullish && candleThree_Low > candleFive_Low && candleThree_High < candleFive_High // it should be within the high and low of the first candlestick. 
                                    && isCandleTwo_Bullish && candleTwo_Low > candleFive_Low && candleTwo_High < candleFive_High // it should be within the high and low of the first candlestick. 
                                    && isCandleOne_Bearish && candleOne_Open < candleTwo_Close && candleOne_Close < candleFive_Close;//The last candlestick that completes the pattern should below the close of its preceding candlestick and should close lower that the close of the first candlestick.

    }
    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLSEPARATINGLINES = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;

    var candleThree_Open = this.priceData[candleThree_Index].open,
        candleThree_Close = this.priceData[candleThree_Index].close;
    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close,
        candleTwo_Low = this.priceData[candleTwo_Index].low,
        candleTwo_High = this.priceData[candleTwo_Index].high;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_Low = this.priceData[candleOne_Index].low,
        candleOne_High = this.priceData[candleOne_Index].high;

    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;

    var isBullishContinuation = (candleOne_Open > Math.max(candleThree_Open, candleThree_Close)) //After an uptrend
                               && isCandleTwo_Bearish && (this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close)) // 1st day is a long red day
                               && isCandleOne_Bullish && (this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close))// 2nd day is a long white day
                               && (candleOne_Open === candleTwo_Open); //2nd day is a white day that opens at the opening price of the 1st day.


    var isBearishContinuation = (candleOne_Open < Math.min(candleThree_Open, candleThree_Close)) //After an downtrend
                               && isCandleTwo_Bullish && (this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close))  // 1st day is a long white day
                               && isCandleOne_Bearish && (this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close))// 2nd day is a long red day
                               && (candleOne_Open === candleTwo_Open); //2nd day is a red day that opens at the opening price of the 1st day.


    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLSHOOTINGSTAR = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;

    var candleThree_Open = this.priceData[candleThree_Index].open,
        candleThree_Close = this.priceData[candleThree_Index].close;
    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_Low = this.priceData[candleOne_Index].low,
        candleOne_High = this.priceData[candleOne_Index].high;

    var candleOneUpperShadow = Math.abs(Math.max(candleOne_Open, candleOne_Close) - candleOne_High),
        candleOneBody = Math.abs(candleOne_Open - candleOne_Close),
        candleBodySize = Math.abs(candleOne_Low - candleOne_High),
        candleOneLowerShadow = Math.abs(candleOne_Low - Math.min(candleOne_Close, candleOne_Open)),
        isOpenCloseLowAlmostSame = (candleOneBody < (candleBodySize * 0.40))
        && ((candleOne_Low === Math.min(candleOne_Open, candleOne_Close)) || (candleOneLowerShadow < (candleBodySize * 0.10)));

    var isBearishContinuation = Math.max(candleTwo_Close, candleTwo_Open) > (Math.max(candleThree_Open, candleThree_Close))
                               && (Math.max(candleOne_Close, candleOne_Open) > Math.max(candleTwo_Close, candleTwo_Open))
                               && isOpenCloseLowAlmostSame //the open, low, and close are roughly the same price. means it has a small body.
                               && (candleOneUpperShadow >= (2.0 * candleOneBody)); //there is a long upper shadow, which should be at least twice the length of the real body.

    //It's a bearish candlestick
    var isBullishContinuation = false;

    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLSPINNINGTOP = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;

    var candleThree_Open = this.priceData[candleTwo_Index].open,
        candleThree_Close = this.priceData[candleTwo_Index].close;
    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_Low = this.priceData[candleOne_Index].low,
        candleOne_High = this.priceData[candleOne_Index].high;

    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;

    var upperShadow = candleOne_High - Math.max(candleOne_Open, candleOne_Close),
        lowerShadow = Math.min(candleOne_Open, candleOne_Close) - candleOne_Low,
        candleBodySize = Math.abs(candleOne_High - candleOne_Low),
        realBodySize = Math.abs(candleOne_Open - candleOne_Close);


    var isBullishContinuation = isCandleTwo_Bearish && (candleTwo_Close < (Math.min(candleThree_Open, candleThree_Close)))
                              && isCandleOne_Bullish && (candleOne_Open < candleTwo_Close)
                              && (realBodySize <= (candleBodySize * 0.30)) //It is not too different to a Doji in structure, but rather than a flat body it has a small body between an open and close price
                              && (upperShadow > realBodySize) && (upperShadow < (candleBodySize * 0.50)) // The spinning top is composed of a small body with small upper and lower shadows.
                              && (lowerShadow > realBodySize) && (lowerShadow < (candleBodySize * 0.50));


    var isBearishContinuation = isCandleTwo_Bullish && (candleTwo_Close > (Math.max(candleThree_Open, candleThree_Close)))
                              && isCandleOne_Bearish && (candleOne_Open > candleTwo_Close)
                              && (realBodySize <= (candleBodySize * 0.30)) //It is not too different to a Doji in structure, but rather than a flat body it has a small body between an open and close price
                              && (upperShadow > realBodySize) && (upperShadow < (candleBodySize * 0.50)) // The spinning top is composed of a small body with small upper and lower shadows.
                              && (lowerShadow > realBodySize) && (lowerShadow < (candleBodySize * 0.50));

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLSTALLEDPATTERN = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;

    var candleThree_Open = this.priceData[candleThree_Index].open,
        candleThree_Close = this.priceData[candleThree_Index].close,
        candleThree_Low = this.priceData[candleThree_Index].low,
        candleThree_High = this.priceData[candleThree_Index].high;
    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close,
        candleTwo_Low = this.priceData[candleTwo_Index].low,
        candleTwo_High = this.priceData[candleTwo_Index].high;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close;

    var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
        isCandleThree_Bearish = candleThree_Close < candleThree_Open;
    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;

    var candleThreeBodySize = Math.abs(candleThree_Close - candleThree_Open),
        candleTwoBodySize = Math.abs(candleTwo_Close - candleTwo_Open),
        candleOneBodySize = Math.abs(candleOne_Close - candleOne_Open);


    var isBullishContinuation = isCandleThree_Bearish && (this.indicators.isLongCandle(candleThree_Open, candleThree_High, candleThree_Low, candleThree_Close))// three candlesticks in a downtrend
                               && isCandleTwo_Bearish && (this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close)) && (candleTwo_Open <= candleThree_Open) //The second candlestick must open close to the close of the previous day. 
                               && isCandleOne_Bearish && (candleOne_Open < candleTwo_Close)   //must open close to the close of the previous day.
                               //&& (candleOneBodySize < candleMediumHeight * 0.60); //the last candlestick must be short

    var isBearishContinuation = isCandleThree_Bullish && (this.indicators.isLongCandle(candleThree_Open, candleThree_High, candleThree_Low, candleThree_Close)) // three candlesticks in a downtrend
                               && isCandleTwo_Bullish && (this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close)) && (candleTwo_Open >= candleThree_Open) //The second candlestick must open close to the close of the previous day. 
                               && isCandleOne_Bullish && (candleOne_Open > candleTwo_Close)   //must open close to the close of the previous day.
                               //&& (candleOneBodySize < candleMediumHeight * 0.60); //the last candlestick must be short

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLSTICKSANDWICH = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;
    var candleFour_Index = candleOne_Index - 3;

    var isBullishContinuation = false, isBearishContinuation = false;

    if (candleFour_Index >= 0) {
        var candleFour_Open = this.priceData[candleFour_Index].open,
            candleFour_Close = this.priceData[candleFour_Index].close;
        var candleThree_Open = this.priceData[candleThree_Index].open,
            candleThree_Close = this.priceData[candleThree_Index].close,
            candleThree_Low = this.priceData[candleThree_Index].low,
            candleThree_High = this.priceData[candleThree_Index].high;
        var candleTwo_Open = this.priceData[candleTwo_Index].open,
            candleTwo_Close = this.priceData[candleTwo_Index].close;
        var candleOne_Open = this.priceData[candleOne_Index].open,
            candleOne_Close = this.priceData[candleOne_Index].close,
            candleOne_Low = this.priceData[candleOne_Index].low,
            candleOne_High = this.priceData[candleOne_Index].high;

        var isCandleFour_Bullish = candleFour_Close > candleFour_Open,
			isCandleFour_Bearish = candleFour_Close < candleFour_Open;
        var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
            isCandleThree_Bearish = candleThree_Close < candleThree_Open;
        var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
			isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
        var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
			isCandleOne_Bearish = candleOne_Close < candleOne_Open;


        var candleThreebodySize = Math.abs(candleThree_Close - candleThree_Open);
        var isCanldeOneCloseSameAsCandleThreeClose = (candleOne_Close === candleThree_Close)
                                          || (candleOne_Close <= (candleThree_Close + (candleThreebodySize * 0.05)))
                                          || (candleOne_Close >= (candleThree_Close - (candleThreebodySize * 0.05)));

        var isBullishContinuation = isCandleThree_Bearish && (this.indicators.isLongCandle(candleThree_Open, candleThree_High, candleThree_Low, candleThree_Close)) && (candleThree_Close < (Math.min(candleFour_Close, candleFour_Open))) //We see a black candlestick on the first day after a downtrend
                                    && isCandleTwo_Bullish && (candleTwo_Close > candleThree_Open) && (candleTwo_Open > candleThree_Close) && (candleTwo_Open < candleThree_Open) //The second candlestick is a white (green) candlestick that gaps up from the previous close and closes above the previous day's open
                                    && isCandleOne_Bearish && (candleOne_Open > candleTwo_Close) && (candleOne_Close < candleTwo_Open) //both of which will have a larger trading range than the middle candlestick.
                                    && (this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close)) && isCanldeOneCloseSameAsCandleThreeClose;//The third day is a black day that closes at or near the close of the first day.

        var isBearishContinuation = isCandleThree_Bullish && (this.indicators.isLongCandle(candleThree_Open, candleThree_High, candleThree_Low, candleThree_Close)) && (candleThree_Close > (Math.max(candleFour_Close, candleFour_Open))) //We see a white candlestick on the first day after an uptrend
                                    && isCandleTwo_Bearish && (candleTwo_Close < candleThree_Open) && (candleTwo_Open < candleThree_Close) && (candleTwo_Open > candleThree_Open)//The second candlestick is a black candlestick that gaps down from the previous close and closes bellow the previous day's open
                                    && isCandleOne_Bullish && (candleOne_Open < candleTwo_Close) && (candleOne_Close > candleTwo_Open) //both of which will have a larger trading range than the middle candlestick.
                                    && (this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close)) && isCanldeOneCloseSameAsCandleThreeClose;//The third day is a black day that closes at or near the close of the first day.

    }
    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLTAKURI = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;

    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_High = this.priceData[candleOne_Index].high,
        candleOne_Low = this.priceData[candleOne_Index].low;

    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;

    var lowWick = Math.abs(candleOne_Low - Math.min(candleOne_Open, candleOne_Close)),
        highWick = Math.abs(candleOne_High - Math.max(candleOne_Open, candleOne_Close)),
        candleBodySize = Math.abs(candleOne_Low - candleOne_High),
        realBodySize = Math.abs(candleOne_Open - candleOne_Close),
        isOpenCloseHighAlmostSame = ((candleOne_Open === candleOne_Close) || (realBodySize < (candleBodySize * 0.20)))
        && ((candleOne_High === Math.max(candleOne_Open, candleOne_Close)) || (highWick < (candleBodySize * 0.20))),
        isLowerShadowLong = (lowWick >= (candleBodySize * 0.80));

    var isBullishContinuation = isCandleTwo_Bearish //occurs at the bottom of downtrends.
                                && isOpenCloseHighAlmostSame //the open, high, and close are the same or about the same price
                                && isLowerShadowLong;// with a Lower Shadow that is long at least three times the Real Body of the Candle; 

    var isBearishContinuation = isCandleTwo_Bullish //occurs at the top of uptrends
                                && isOpenCloseHighAlmostSame //the open, high, and close are the same or about the same price
                                && isLowerShadowLong;// with a Lower Shadow that is long at least three times the Real Body of the Candle; 

    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLTASUKIGAP = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;

    var candleThree_Open = this.priceData[candleThree_Index].open,
        candleThree_Close = this.priceData[candleThree_Index].close,
        candleThree_Low = this.priceData[candleThree_Index].low,
        candleThree_High = this.priceData[candleThree_Index].high;
    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close,
        candleTwo_Low = this.priceData[candleTwo_Index].low,
        candleTwo_High = this.priceData[candleTwo_Index].high;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close;

    var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
        isCandleThree_Bearish = candleThree_Close < candleThree_Open;
    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;


    var isBullishContinuation = isCandleThree_Bullish
                                && isCandleTwo_Bullish && candleTwo_Open > candleThree_Close //gaps above 1st day
                                && isCandleOne_Bearish && candleOne_Open > candleTwo_Open && candleOne_Open < candleTwo_Close //open inside the red 2day candle's real body.
                                && candleOne_Close < candleTwo_Open && candleOne_Close > candleThree_Close;//closes within the gap between the first two bars. 

    var isBearishContinuation = isCandleThree_Bearish
                                && isCandleTwo_Bearish && candleTwo_Open < candleThree_Close //gaps below 1st day
                                && isCandleOne_Bullish && candleOne_Open > candleTwo_Close && candleOne_Open < candleTwo_Open //open inside the red candle's real body.
                                && candleOne_Close < candleThree_Close && candleOne_Close > candleTwo_Open;//closes within the gap between the first two bars.

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLTHRUSTING = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;

    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close,
        candleTwo_High = this.priceData[candleTwo_Index].high,
        candleTwo_Low = this.priceData[candleTwo_Index].low;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close;

    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;

    var isBearishContinuation = isCandleTwo_Bearish && (this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close)) //day-one of the pattern is a long red candle continuing the trend
                                && isCandleOne_Bullish && (candleOne_Open < candleTwo_Close) //Day-two is a blue day
                                && candleOne_Close <= (candleTwo_Close + (Math.abs(candleTwo_Open - candleTwo_Close) / 2)) // closes into the body (below midpoint) of the previous day
                                && (candleOne_Close >= candleTwo_Close);

    var isBullishContinuation = isCandleTwo_Bullish && (this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close))////day-one of the pattern is a long blue candle
                                && isCandleOne_Bearish && (candleOne_Open > candleTwo_Close) //Day-two is a red day
                                && candleOne_Close >= (candleTwo_Close - (Math.abs(candleTwo_Open - candleTwo_Close) / 2)) // closes into the body (above midpoint) of the previous day
                                && (candleOne_Close <= candleTwo_Close);

    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLTRISTAR = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;

    var candleThree_Open = this.priceData[candleThree_Index].open,
        candleThree_Close = this.priceData[candleThree_Index].close,
        candleThree_Low = this.priceData[candleThree_Index].low,
        candleThree_High = this.priceData[candleThree_Index].high;
    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close,
        candleTwo_Low = this.priceData[candleTwo_Index].low,
        candleTwo_High = this.priceData[candleTwo_Index].high;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_Low = this.priceData[candleOne_Index].low,
        candleOne_High = this.priceData[candleOne_Index].high;

    var candleThreeDoji = this.CDLDOJI(candleThree_Open, candleThree_High, candleThree_Low, candleThree_Close);

    var candleTwoDoji = this.CDLDOJI(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close);

    var candleOneDoji = this.CDLDOJI(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close);

    var isBullishContinuation = candleThreeDoji.isBull
                                && candleTwoDoji.isBull && candleTwo_Low < candleOne_Low && candleTwo_Low < candleThree_Low //The Day 2 Doji has a gap bellow the first and third.
                                && candleOneDoji.isBull;

    var isBearishContinuation = candleThreeDoji.isBear
                                && candleTwoDoji.isBear && candleTwo_High > candleOne_High && candleTwo_High > candleThree_High //The Day 2 Doji has a gap above the first and third.
                                && candleOneDoji.isBear;
    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLUNIQUE3RIVER = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;
    var candleFour_Index = candleOne_Index - 3;

    var isBullishContinuation = false, isBearishContinuation = false;

    if (candleFour_Index >= 0 ) {
        var candleFour_Open = this.priceData[candleFour_Index].open,
            candleFour_Close = this.priceData[candleFour_Index].close,
            candleFour_High = this.priceData[candleFour_Index].low,
            candleFour_Low = this.priceData[candleFour_Index].high;
        var candleThree_Open = this.priceData[candleThree_Index].open,
            candleThree_Close = this.priceData[candleThree_Index].close,
            candleThree_Low = this.priceData[candleThree_Index].low,
            candleThree_High = this.priceData[candleThree_Index].high;
        var candleTwo_Open = this.priceData[candleTwo_Index].open,
            candleTwo_Close = this.priceData[candleTwo_Index].close,
            candleTwo_Low = this.priceData[candleTwo_Index].low,
            candleTwo_High = this.priceData[candleTwo_Index].high;
        var candleOne_Open = this.priceData[candleOne_Index].open,
            candleOne_Close = this.priceData[candleOne_Index].close;

        var isCandleFour_Bearish = candleFour_Close < candleFour_Open;
        var isCandleThree_Bearish = candleThree_Close < candleThree_Open;
        var isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
        var isCandleOne_Bullish = candleOne_Close > candleOne_Open;


        var candleTwoUpperShadow = Math.abs(candleTwo_Open - candleTwo_High);
        var candleTwoBody = Math.abs(candleTwo_Open - candleTwo_Close);
        var candleTwoLowerShadow = Math.abs(candleTwo_Low - candleTwo_Close);
        var isCandleTwoHammer = (candleTwoLowerShadow >= (2.0 * candleTwoBody)) && (candleTwoUpperShadow <= (candleTwoBody * 0.10));
        var candleThreeBody = Math.abs(candleThree_Close - candleThree_Open);

        var isBullishContinuation = isCandleFour_Bearish
                                    && isCandleThree_Bearish && (this.indicators.isLongCandle(candleThree_Open, candleThree_High, candleThree_Low, candleThree_Close))
                                    && candleThree_Close < candleFour_Close//The 1st candle has a long and bearish body
                                    && isCandleTwo_Bearish && isCandleTwoHammer && candleTwo_Close > candleThree_Close && candleTwo_Open < candleThree_Open && candleTwo_Low < candleThree_Low //The 2nd candle is a hammer, and its body is inside the 1st bar's body;
                                    && isCandleOne_Bullish && candleOne_Close < candleTwo_Close; //tThe 3rd candle is small and bullish, its Close price is lower than 2nd bar's.


        //It's a bullish candlestick
        var isBearishContinuation = false;
    }
    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLUPSIDEGAP2CROWS = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;

    var candleThree_Open = this.priceData[candleThree_Index].open,
        candleThree_Close = this.priceData[candleThree_Index].close,
        candleThree_Low = this.priceData[candleThree_Index].low,
        candleThree_High = this.priceData[candleThree_Index].high;
    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close;

    var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
	    isCandleThree_Bearish = candleThree_Close < candleThree_Open;
    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;


    var isBullishContinuation = isCandleThree_Bullish && (this.indicators.isLongCandle(candleThree_Open, candleThree_High, candleThree_Low, candleThree_Close)) //by a long white candlestick
                                && isCandleTwo_Bearish //small black candle with a body
                                && (candleTwo_Close > candleThree_Close)//  gapping above the prior candle's body.
                                && isCandleOne_Bearish && (candleOne_Close < candleTwo_Close && candleOne_Open > candleTwo_Open) //opening higher than the Day 2 open, but closing below the Day 2 close
                                && (candleOne_Close > candleThree_Close);// and above the Day 1 close

    //It's a bullish candlestick
    var isBearishContinuation = false;

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLXSIDEGAP3METHODS = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;

    var candleThree_Open = this.priceData[candleThree_Index].open,
        candleThree_Close = this.priceData[candleThree_Index].close,
        candleThree_Low = this.priceData[candleThree_Index].low,
        candleThree_High = this.priceData[candleThree_Index].high;
    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].clos,
        candleTwo_Low = this.priceData[candleTwo_Index].low,
        candleTwo_High = this.priceData[candleTwo_Index].high;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close;

    var isCandleThree_Bullish = candleThree_Close > candleThree_Open,
        isCandleThree_Bearish = candleThree_Close < candleThree_Open;
    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;

    var isBullishContinuation = isCandleThree_Bullish && (this.indicators.isLongCandle(candleThree_Open, candleThree_High, candleThree_Low, candleThree_Close)) //Long white
                                && isCandleTwo_Bullish && (this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close)) //Long white
                                && (candleTwo_Open > candleThree_Close) //gaps above 1st day
                                && isCandleOne_Bearish && (candleOne_Open > candleTwo_Open) && (candleOne_Open < candleTwo_Close) //The third day opens lower, into the body of the top white (or green) candle 
                                && (candleOne_Close < candleThree_Close) && (candleOne_Close > candleThree_Open);//and closes into the body of the first white (or green) candle.

    var isBearishContinuation = isCandleThree_Bearish && (this.indicators.isLongCandle(candleThree_Open, candleThree_High, candleThree_Low, candleThree_Close)) //Long red
                                && isCandleTwo_Bearish && (this.indicators.isLongCandle(candleTwo_Open, candleTwo_High, candleTwo_Low, candleTwo_Close))  //Long red
                                && (candleTwo_Open < candleThree_Close) //gaps below 1st day
                                && isCandleOne_Bullish && (candleOne_Open < candleTwo_Open) && (candleOne_Open > candleTwo_Close)
                                && (candleOne_Close > candleThree_Close) && (candleOne_Close < candleThree_Open);


    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLHIGHWAVE = function () {
    var candleOne_Index = this.priceData.length - 1;

    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_High = this.priceData[candleOne_Index].low,
        candleOne_Low = this.priceData[candleOne_Index].high;

    var isCandleOne_Bullish = candleOne_Close > candleOne_Open,
        isCandleOne_Bearish = candleOne_Close < candleOne_Open;

    var bodySize = Math.abs(candleOne_Close - candleOne_Open);
    var candleSize = Math.abs(candleOne_High - candleOne_Low);
    var upperShadow = Math.abs(candleOne_High - Math.max(candleOne_Open, candleOne_Close));
    var lowerShadow = Math.abs(Math.min(candleOne_Open, candleOne_Close) - candleOne_Low);

    var isBearishContinuation = isCandleOne_Bearish && (bodySize > (Math.max(upperShadow, lowerShadow) * 0.05))
                                && ((bodySize < (lowerShadow / 3)) && (bodySize < (upperShadow / 3)));//�High Wave� is a candlestick with a small body and long shadows.

    var isBullishContinuation = isCandleOne_Bullish && (bodySize > (Math.max(upperShadow, lowerShadow) * 0.05))
                                && ((bodySize < (lowerShadow / 3)) && (bodySize < (upperShadow / 3)));//�High Wave� is a candlestick with a small body and long shadows.

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.calculateIndicatorValue = function(cdlPatternCode) {
    var ret;
    var time = this.priceData[this.priceData.length - 1].time;
    switch (cdlPatternCode.toUpperCase()) {
        case 'CDL2CROWS':
            var cdlObject = this.CDL2CROWS();
            ret = CDLADDFLAGINFO(cdlObject, time, 'TC', 'Two crows');
            break;
        case 'CDLDOJI':
            var candleOne_Index = this.priceData.length - 1;
            var candleOne_Open = this.priceData[candleOne_Index].open,
                candleOne_High = this.priceData[candleOne_Index].high,
                candleOne_Low = this.priceData[candleOne_Index].low,
                candleOne_Close = this.priceData[candleOne_Index].close;
            var cdlObject = this.CDLDOJI(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close);
            ret = CDLADDFLAGINFO(cdlObject, time, 'D', 'Doji');
            break;
        case 'CDL3BLACKCROWS':
            var cdlObject = this.CDL3BLACKCROWS();
            ret = CDLADDFLAGINFO(cdlObject, time, 'TBC', 'Three Black crows');
            break;
        case 'CDL3INSIDE':
            var cdlObject = this.CDL3INSIDE();
            ret = CDLADDFLAGINFO(cdlObject, time, 'TIUD', 'Three Inside Up/Down');
            break;
        case 'CDL3LINESTRIKE':
            var cdlObject = this.CDL3LINESTRIKE();
            ret = CDLADDFLAGINFO(cdlObject, time, 'TLS', 'Three-Line Strike');
            break;
        case 'CDL3OUTSIDE':
            var cdlObject = this.CDL3OUTSIDE();
            ret = CDLADDFLAGINFO(cdlObject, time, 'TOUD', 'Three Outside Up/Down');
            break;
        case 'CDL3STARSSOUTH':
            var cdlObject = this.CDL3STARSSOUTH();
            ret = CDLADDFLAGINFO(cdlObject, time, 'TSS', 'Three Stars In The South');
            break;
        case 'CDL3WHITESOLDIERS':
            var cdlObject = this.CDL3WHITESOLDIERS();
            ret = CDLADDFLAGINFO(cdlObject, time, 'TWS', 'Three Advancing White Soldiers');
            break;
        case 'CDLABANDONEDBABY':
            var cdlObject = this.CDLABANDONEDBABY();
            ret = CDLADDFLAGINFO(cdlObject, time, 'AB', 'Abandoned Baby');
            break;
        case 'CDLADVANCEBLOCK':
            var cdlObject = this.CDLADVANCEBLOCK();
            ret = CDLADDFLAGINFO(cdlObject, time, 'AB', 'Advance Block');
            break;
        case 'CDLBELTHOLD':
            var cdlObject = this.CDLBELTHOLD();
            ret = CDLADDFLAGINFO(cdlObject, time, 'BH', 'Belt-hold');
            break;
        case 'CDLBREAKAWAY':
            var cdlObject = this.CDLBREAKAWAY();
            ret = CDLADDFLAGINFO(cdlObject, time, 'BA', 'Breakaway');
            break;
        case 'CDLCLOSINGMARUBOZU':
            var cdlObject = this.CDLCLOSINGMARUBOZU();
            ret = CDLADDFLAGINFO(cdlObject, time, 'CM', 'Closing Marubozu');
            break;
        case 'CDLCOUNTERATTACK':
            var cdlObject = this.CDLCOUNTERATTACK();
            ret = CDLADDFLAGINFO(cdlObject, time, 'CA', 'Counterattack');
            break;
        case 'CDLDARKCLOUDCOVER':
            var cdlObject = this.CDLDARKCLOUDCOVER();
            ret = CDLADDFLAGINFO(cdlObject, time, 'DCC', 'Dark Cloud Cover');
            break;
        case 'CDLDOJISTAR':
            var cdlObject = this.CDLDOJISTAR();
            ret = CDLADDFLAGINFO(cdlObject, time, 'DS', 'Doji Star');
            break;
        case 'CDLDRAGONFLYDOJI':
            var cdlObject = this.CDLDRAGONFLYDOJI();
            ret = CDLADDFLAGINFO(cdlObject, time, 'DD', 'Dragonfly Doji');
            break;
        case 'CDLENGULFING':
            var cdlObject = this.CDLENGULFING();
            ret = CDLADDFLAGINFO(cdlObject, time, 'EP', 'Engulfing Pattern');
            break;
        case 'CDLEVENINGDOJISTAR':
            var cdlObject = this.CDLEVENINGDOJISTAR();
            ret = CDLADDFLAGINFO(cdlObject, time, 'EDS', 'Evening Doji Star');
            break;
        case 'CDLEVENINGSTAR':
            var cdlObject = this.CDLEVENINGSTAR();
            ret = CDLADDFLAGINFO(cdlObject, time, 'ES', 'Evening Star');
            break;
        case 'CDLGAPSIDESIDEWHITE':
            var cdlObject = this.CDLGAPSIDESIDEWHITE();
            ret = CDLADDFLAGINFO(cdlObject, time, 'SSWL', 'Up/Down-Gap Side-By-Side White Lines');
            break;
        case 'CDLGRAVESTONEDOJI':
            var cdlObject = this.CDLGRAVESTONEDOJI();
            ret = CDLADDFLAGINFO(cdlObject, time, 'GSD', 'Gravestone Doji');
            break;
        case 'CDLHAMMER':
            var cdlObject = this.CDLHAMMER();
            ret = CDLADDFLAGINFO(cdlObject, time, 'H', 'Hammer');
            break;
        case 'CDLHANGINGMAN':
            var cdlObject = this.CDLHANGINGMAN();
            ret = CDLADDFLAGINFO(cdlObject, time, 'HM', 'Hanging Man');
            break;
        case 'CDLHARAMI':
            var cdlObject = this.CDLHARAMI();
            ret = CDLADDFLAGINFO(cdlObject, time, 'HP', 'Harami Pattern');
            break;
        case 'CDLHARAMICROSS':
            var cdlObject = this.CDLHARAMICROSS();
            ret = CDLADDFLAGINFO(cdlObject, time, 'HCP', 'Harami Cross Pattern');
            break;
        case 'CDLHOMINGPIGEON':
            var cdlObject = this.CDLHOMINGPIGEON();
            ret = CDLADDFLAGINFO(cdlObject, time, 'HP', 'Homing Pigeon');
            break;
        case 'CDLHIKKAKE':
            var cdlObject = this.CDLHIKKAKE();
            ret = CDLADDFLAGINFO(cdlObject, time, 'HP', 'Hikkake Pattern');
            break;
        case 'CDLHIGHWAVE':
            var cdlObject = this.CDLHIGHWAVE();
            ret = CDLADDFLAGINFO(cdlObject, time, 'HW', 'High Wave');
            break;
        case 'CDLIDENTICAL3CROWS':
            var cdlObject = this.CDLIDENTICAL3CROWS();
            ret = CDLADDFLAGINFO(cdlObject, time, 'ITC', 'Identical Three Crows');
            break;
        case 'CDLINNECK':
            var cdlObject = this.CDLINNECK();
            ret = CDLADDFLAGINFO(cdlObject, time, 'IN', 'In-Neck');
            break;
        case 'CDLINVERTEDHAMMER':
            var cdlObject = this.CDLINVERTEDHAMMER();
            ret = CDLADDFLAGINFO(cdlObject, time, 'IH', 'Inverted Hammer');
            break;
        case 'CDLKICKING':
            var cdlObject = this.CDLKICKING();
            ret = CDLADDFLAGINFO(cdlObject, time, 'KC', 'Kicking');
            break;
        case 'CDLKICKINGBYLENGTH':
            var cdlObject = this.CDLKICKINGBYLENGTH();
            ret = CDLADDFLAGINFO(cdlObject, time, 'KCWLM', 'Kicking (longer marubozu)');
            break;
        case 'CDLLADDERBOTTOM':
            var cdlObject = this.CDLLADDERBOTTOM();
            ret = CDLADDFLAGINFO(cdlObject, time, 'LB', 'Ladder Bottom');
            break;
        case 'CDLLONGLEGGEDDOJI':
            var cdlObject = this.CDLLONGLEGGEDDOJI();
            ret = CDLADDFLAGINFO(cdlObject, time, 'LLD', 'Long Legged Doji');
            break;
        case 'CDLLONGLINE':
            var cdlObject = this.CDLLONGLINE();
            ret = CDLADDFLAGINFO(cdlObject, time, 'LLC', 'Long Line Candle');
            break;
        case 'CDLMARUBOZU':
            var cdlObject = this.CDLMARUBOZU();
            ret = CDLADDFLAGINFO(cdlObject, time, 'MZ', 'Marubozu');
            break;
        case 'CDLMATCHINGLOW':
            var cdlObject = this.CDLMATCHINGLOW();
            ret = CDLADDFLAGINFO(cdlObject, time, 'ML', 'Matching Low');
            break;
        case 'CDLMATHOLD':
            var cdlObject = this.CDLMATHOLD();
            ret = CDLADDFLAGINFO(cdlObject, time, 'MH', 'Mat Hold');
            break;
        case 'CDLMORNINGDOJISTAR':
            var cdlObject = this.CDLMORNINGDOJISTAR();
            ret = CDLADDFLAGINFO(cdlObject, time, 'MDS', 'Morning Doji Star');
            break;
        case 'CDLMORNINGSTAR':
            var cdlObject = this.CDLMORNINGSTAR();
            ret = CDLADDFLAGINFO(cdlObject, time, 'MS', 'Morning Star');
            break;
        case 'CDLONNECK':
            var cdlObject = this.CDLONNECK();
            ret = CDLADDFLAGINFO(cdlObject, time, 'ON', 'On-Neck');
            break;
        case 'CDLPIERCING':
            var cdlObject = this.CDLPIERCING();
            ret = CDLADDFLAGINFO(cdlObject, time, 'PP', 'Piercing Pattern');
            break;
        case 'CDLRICKSHAWMAN':
            var cdlObject = this.CDLRICKSHAWMAN();
            ret = CDLADDFLAGINFO(cdlObject, time, 'RM', 'Rickshaw Man');
            break;
        case 'CDLRISEFALL3METHODS':
            var cdlObject = this.CDLRISEFALL3METHODS();
            ret = CDLADDFLAGINFO(cdlObject, time, 'FTM', 'Falling Three Methods');
            break;
        case 'CDLSEPARATINGLINES':
            var cdlObject = this.CDLSEPARATINGLINES();
            ret = CDLADDFLAGINFO(cdlObject, time, 'SL', 'Separating Lines');
            break;
        case 'CDLSHOOTINGSTAR':
            var cdlObject = this.CDLSHOOTINGSTAR();
            ret = CDLADDFLAGINFO(cdlObject, time, 'SS', 'Shooting Star');
            break;
        case 'CDLSPINNINGTOP':
            var cdlObject = this.CDLSPINNINGTOP();
            ret = CDLADDFLAGINFO(cdlObject, time, 'ST', 'Spinning Top');
            break;
        case 'CDLSTALLEDPATTERN':
            var cdlObject = this.CDLSTALLEDPATTERN();
            ret = CDLADDFLAGINFO(cdlObject, time, 'SP', 'Stalled Pattern');
            break;
        case 'CDLSTICKSANDWICH':
            var cdlObject = this.CDLSTICKSANDWICH();
            ret = CDLADDFLAGINFO(cdlObject, time, 'SS', 'Stick Sandwich');
            break;
        case 'CDLTAKURI':
            var cdlObject = this.CDLTAKURI();
            ret = CDLADDFLAGINFO(cdlObject, time, 'TK', 'Takuri');
            break;
        case 'CDLTASUKIGAP':
            var cdlObject = this.CDLTASUKIGAP();
            ret = CDLADDFLAGINFO(cdlObject, time, 'TG', 'Tasuki Gap');
            break;
        case 'CDLTHRUSTING':
            var cdlObject = this.CDLTHRUSTING();
            ret = CDLADDFLAGINFO(cdlObject, time, 'TP', 'Thrusting Pattern');
            break;
        case 'CDLTRISTAR':
            var cdlObject = this.CDLTRISTAR();
            ret = CDLADDFLAGINFO(cdlObject, time, 'TSP', 'Tristar Pattern');
            break;
        case 'CDLUNIQUE3RIVER':
            var cdlObject = this.CDLUNIQUE3RIVER();
            ret = CDLADDFLAGINFO(cdlObject, time, 'U3R', 'Unique 3 River');
            break;
        case 'CDLUPSIDEGAP2CROWS':
            var cdlObject = this.CDLUPSIDEGAP2CROWS();
            ret = CDLADDFLAGINFO(cdlObject, time, 'UGTC', 'Upside Gap Two Crows');
            break;
        case 'CDLXSIDEGAP3METHODS':
            var cdlObject = this.CDLXSIDEGAP3METHODS();
            ret = CDLADDFLAGINFO(cdlObject, time, 'GTM', 'Upside/Downside Gap Three Methods');
            break;
    }
    return ret;
};

CDLADDFLAGINFO = function (cdlObject, time, shortDisplayName, longDisplayName) {
    var ret;
    if (cdlObject.isBull) {
        ret = {
            x: time,
            title: '<span style="color : blue">' + shortDisplayName + '</span>',
            text: longDisplayName + ' : Bull'
        };
    }
    else if (cdlObject.isBear) {
        ret = {
            x: time,
            title: '<span style="color : red">' + shortDisplayName + '</span>',
            text: longDisplayName + ' : Bear'
        };
    }
    return ret;
};
