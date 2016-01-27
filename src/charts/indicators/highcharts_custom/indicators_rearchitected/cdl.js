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
    var isBearishContinuation = (isOpenCloseSame || ((candleBodySize * 0.10) >= Math.abs(open - close)))
        && differenceBet_Open_High < differenceBet_Open_Low;

    var isBullishContinuation = (isOpenCloseSame || ((candleBodySize * 0.10) >= Math.abs(open - close)))
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
            //candleFour_Low = this.priceData[candleFour_Index].low,
            candleFour_Close = this.priceData[candleFour_Index].close;
        var candleThree_Open = this.priceData[candleThree_Index].open,
            //candleThree_Low = this.priceData[candleThree_Index].low,
            candleThree_Close = this.priceData[candleThree_Index].close;
        var candleTwo_Open = this.priceData[candleTwo_Index].open,
            //candleTwo_Low = this.priceData[candleTwo_Index].low,
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

    var isBullishContinuation = isCandleThree_Bearish
                && (candleThreeLowerShadow >= (candleThreeBodySize * 2)) && (candleThreeUpperShadow < (candleThreeBodySize * 0.1)) //A black candlestick with almost no upper shadow and a long lower shadow appears on the first day.
                && isCandleTwo_Bearish && (candleTwo_Low > candleThree_Low) && (candleTwo_Open < candleThree_Open) && (candleTwo_Close < candleThree_Close) && (candleTwoBodySize < candleThreeBodySize) // The next day is another black candlestick closing below the previous day’s close and having an opening in the range of the previous day’s body. However, it has a higher low.
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

    var isBearishContinuation = isCandleThree_Bullish
                                && dojiResponse_candleTwo.isBear && (candleTwo_Low > candleThree_High)
                                && isCandleOne_Bearish && (candleOne_High < candleTwo_Low);

    var isBullishContinuation = isCandleThree_Bearish 
                                && dojiResponse_candleTwo.isBull && (candleTwo_High < candleThree_Low)
                                && isCandleOne_Bullish && (candleOne_Low > candleTwo_High);

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
        candleThree_High = this.priceData[candleThree_Index].high;

    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close,
        candleTwo_High = this.priceData[candleTwo_Index].high;

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

    var isBearishContinuation = isCandleThree_Bullish  //Three long white days occur, each with a higher close than the previous day
                                && isCandleTwo_Bullish && (candleTwoBody <= candleThreeBody) && (candleTwo_Close > candleThree_Close) && (candleTwo_Open <= candleThree_Close) && (candleTwo_Open > candleThree_Open) //Each day opens within the body of the previous day 
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
                                && isCandleOne_Bullish //Long candle
                                && (candleOne_Open === candleOne_Low) && (candleOne_Open < candleTwo_Close);// a bullish or white candlestick forms. The opening price, which becomes the low for the day, is significantly lower then the closing price.

    var isBearishContinuation = isCandleThree_Bullish  //After a stretch of bullish candlestick
                                && isCandleTwo_Bullish //After a stretch of bullish candlestick
                                && isCandleOne_Bearish //Long candle
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
            candleFive_Close = this.priceData[candleFive_Index].close;

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

        var isBullishContinuation = isCandleFive_Bearish
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

    var isBearishContinuation = isBearish  && candleOne_Low === candleOne_Close;
    var isBullishContinuation = isBullish  && candleOne_High === candleOne_Close;

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
};

CDL.prototype.CDLCOUNTERATTACK = function () {

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

    candleTwoBody = Math.abs(candleTwo_Close - candleTwo_Open);

    var isBullishContinuation = isCandleTwo_Bearish // bearish counterattack is a long black candle in an uptrend
                                && isCandleOne_Bullish  //followed by a long white candle.
                                && (candleOne_Close <= (candleTwo_Close + (candleTwoBody * 0.1))) && (candleOne_Close >= (candleTwo_Close - (candleTwoBody * 0.1)))// Closing prices of both candles are at the same price level.

    var isBearishContinuation = isCandleTwo_Bullish // bullish counterattack is a long white candle in an uptrend level.
                                && isCandleOne_Bearish //followed by a long white candle.
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
        candleTwo_Close = this.priceData[candleTwo_Index].close;

    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close,
        candleOne_Low = this.priceData[candleOne_Index].low,
        candleOne_High = this.priceData[candleOne_Index].high;

    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open,
        isCandleTwo_Bearish = candleTwo_Close < candleTwo_Open;

    var dojiResponse_candleOne = this.CDLDOJI(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close);

    var isBearishContinuation = isCandleTwo_Bullish //The first day is long green day
                                && dojiResponse_candleOne.isBear && (candleOne_Close >= candleTwo_Close); //Second day is a doji that opens at the previous day close

    var isBullishContinuation = isCandleTwo_Bearish  //The first day is long red day
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
            candleThree_High = this.priceData[candleTwo_Index].high,
            candleThree_Low = this.priceData[candleTwo_Index].low;
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
            candleThree_High = this.priceData[candleTwo_Index].high,
            candleThree_Low = this.priceData[candleTwo_Index].low;
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

CDL.prototype.calculateIndicatorValue = function(cdlPatternCode) {
    var ret;
    var time = this.priceData[this.priceData.length - 1].time;
    switch(cdlPatternCode.toUpperCase()) {
        case 'CDL2CROWS':
            var cdlObject = this.CDL2CROWS();
            ret = CDLADDFLAGINFO(cdlObject, time, 'TC', 'Two crows');
            break;
        case 'CDLDOJI':
            var candleOne_Index         = this.priceData.length - 1;
            var candleOne_Open          = this.priceData[candleOne_Index].open,
                candleOne_High          = this.priceData[candleOne_Index].high,
                candleOne_Low           = this.priceData[candleOne_Index].low,
                candleOne_Close         = this.priceData[candleOne_Index].close;
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
