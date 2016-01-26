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

CDL.prototype.CDL3WHITESOLDIERS = function () {
    var candleOne_Index = this.priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;

    var candleThree_Open = this.priceData[candleThree_Index].open,
        candleThree_Close = this.priceData[candleThree_Index].close;
    var candleTwo_Open = this.priceData[candleTwo_Index].open,
        candleTwo_Close = this.priceData[candleTwo_Index].close;
    var candleOne_Open = this.priceData[candleOne_Index].open,
        candleOne_Close = this.priceData[candleOne_Index].close;

    var isCandleThree_Bullish = candleThree_Close > candleThree_Open;
    var isCandleTwo_Bullish = candleTwo_Close > candleTwo_Open;
    var isCandleOne_Bullish = candleOne_Close > candleOne_Open;

    var isBullishContinuation = isCandleThree_Bullish
                                && isCandleTwo_Bullish && (candleTwo_Open > candleThree_Open && candleTwo_Open <= candleThree_Close && candleTwo_Close > candleThree_Close)
                                && isCandleOne_Bullish && (candleOne_Open > candleTwo_Open && candleOne_Open <= candleTwo_Close && candleOne_Close > candleTwo_Close);

    //It's a bullish candlestick
    var isBearishContinuation = false;

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

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
