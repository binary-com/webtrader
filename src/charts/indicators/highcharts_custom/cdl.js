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
    var ret = this.calculateIndicatorValue(this.options.cdlIndicatorCode)|| {};
    if(ret.text)
    {
        this.indicatorData.push(ret);
    }
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
    if(ret.text)
    {
        this.indicatorData[index] = ret;
    }
    return [{
        id : this.uniqueID,
        value : new CDLUpdateObject(ret.x || data.time, ret.title, ret.text)
    }];
};

CDL.prototype.toString = function() {
    return this.indicators.getIndicatorsJSONData()[this.options.cdlIndicatorCode].long_display_name;
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

CDL.prototype.CDL2CROWS = function () {
    var params = CDLGETPARAMS(this.priceData);
    var isBearishContinuation = params.isCandleThree_Bullish
        && params.isCandleTwo_Bearish && (params.candleTwo_Open > params.candleThree_Close && params.candleTwo_Close > params.candleThree_Close)
        && params.isCandleOne_Bearish
        && (params.candleOne_Open < params.candleTwo_Open && params.candleOne_Open > params.candleTwo_Close) //opens within the prior candle's body
        && (params.candleOne_Close < params.candleThree_Close && params.candleOne_Close > params.candleThree_Open); //and closes within the body of the first candle in the pattern
    var isBullishContinuation = params.isCandleThree_Bearish
        && params.isCandleTwo_Bullish && (params.candleTwo_Open < params.candleThree_Close && params.candleTwo_Close < params.candleThree_Close)
        && params.isCandleOne_Bullish
        && (params.candleOne_Open > params.candleTwo_Open && params.candleOne_Open < params.candleTwo_Close) //opens within the prior candle's body
        && (params.candleOne_Close > params.candleThree_Close && params.candleOne_Close < params.candleThree_Open); //and closes within the body of the first candle in the pattern
    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
};

CDL.prototype.CDLDOJI = function(open, high, low, close) {
    var isOpenCloseSame = (open === close),
        differenceBet_Open_High = Math.abs(open - high),
        differenceBet_Open_Low = Math.abs(open - low),
        candleBodySize = Math.abs(low - high),
        realBodySize = Math.abs(open - close);

    //Either open and close is same or difference between Open and Close is 1% of the total size of candle
    var isBearishContinuation = (isOpenCloseSame || ((candleBodySize * 0.05) >= realBodySize))
        && differenceBet_Open_High < differenceBet_Open_Low;

    var isBullishContinuation = (isOpenCloseSame || ((candleBodySize * 0.05) >= realBodySize))
        && differenceBet_Open_High > differenceBet_Open_Low;

    var isDoji = (isOpenCloseSame || ((candleBodySize * 0.05) >= realBodySize)) && (differenceBet_Open_High > realBodySize) && (differenceBet_Open_Low > realBodySize);

    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation,
        isDoji:isDoji
    };
};

CDL.prototype.CDL3BLACKCROWS = function() {
    var params = CDLGETPARAMS(this.priceData);
    var isBearishContinuation = false;
    if (params.candleFour_Index >= 0) {
        isBearishContinuation = params.isCandleThree_Bearish && params.isCandleTwo_Bearish && params.isCandleOne_Bearish
            && params.candleThree_Close < params.candleFour_Low && params.candleTwo_Close < params.candleThree_Low && params.candleOne_Close < params.candleTwo_Low //closed lower than the previous day
            && _.inRange(params.candleThree_Open, params.candleFour_Close, params.candleFour_Open)
            && _.inRange(params.candleTwo_Open, params.candleThree_Close, params.candleThree_Open)
            && _.inRange(params.candleOne_Open, params.candleTwo_Close, params.candleTwo_Open); //opening within the body of the previous day;
    }
    //It's a bearish candlestick
    var isBullishContinuation = false;
    return {
        isBull : isBullishContinuation,
        isBear : isBearishContinuation
    };
};

CDL.prototype.CDL3INSIDE = function() {
    var params = CDLGETPARAMS(this.priceData);
    var isBearishContinuation = params.isCandleThree_Bullish
        && params.isCandleTwo_Bearish && _.inRange(params.candleTwo_Open, params.candleThree_Open, params.candleThree_Close) && _.inRange(params.candleTwo_Close, params.candleThree_Open, params.candleThree_Close)
        && params.isCandleOne_Bearish && (params.candleOne_Close < params.candleTwo_Close);
    var isBullishContinuation = params.isCandleThree_Bearish
        && params.isCandleTwo_Bullish && _.inRange(params.candleTwo_Open, params.candleThree_Close, params.candleThree_Open) && _.inRange(params.candleTwo_Close, params.candleThree_Close, params.candleThree_Open)
        && params.isCandleOne_Bullish && (params.candleOne_Close > params.candleTwo_Close);
    return {
        isBear : isBearishContinuation,
        isBull : isBullishContinuation
    };
};

CDL.prototype.CDL3LINESTRIKE = function() {
    var params = CDLGETPARAMS(this.priceData);
    var isBullishContinuation = false, isBearishContinuation = false;
    if (params.candleFour_Index >= 0) {
        isBullishContinuation = params.isCandleFour_Bearish
                 && params.isCandleThree_Bearish && (params.candleThree_Close < params.candleFour_Close)
                 && params.isCandleTwo_Bearish && (params.candleTwo_Close < params.candleThree_Close)
                 && params.isCandleOne_Bullish && (params.candleOne_Close > params.candleFour_Open && params.candleOne_Open < params.candleTwo_Close);

        isBearishContinuation = params.isCandleFour_Bullish
                && params.isCandleThree_Bullish && (params.candleThree_Close > params.candleFour_Close)
                && params.isCandleTwo_Bullish && (params.candleTwo_Close > params.candleThree_Close)
                && params.isCandleOne_Bearish && (params.candleOne_Close < params.candleFour_Open && params.candleOne_Open < params.candleTwo_Close);
    }
    return {
        isBear : isBearishContinuation,
        isBull : isBullishContinuation
    };
};

CDL.prototype.CDL3OUTSIDE = function() {
    var params = CDLGETPARAMS(this.priceData);
    var isBearishContinuation = params.isCandleThree_Bullish
            && params.isCandleTwo_Bearish && params.candleTwo_Open > params.candleThree_Close && params.candleTwo_Close < params.candleThree_Open
            && params.isCandleOne_Bearish;
    var isBullishContinuation = params.isCandleThree_Bearish
            && params.isCandleTwo_Bullish && params.candleTwo_Open < params.candleThree_Close && params.candleTwo_Close > params.candleThree_Open
            && params.isCandleOne_Bullish;
    return {
        isBear : isBearishContinuation,
        isBull : isBullishContinuation
    };
};

CDL.prototype.CDL3STARSSOUTH = function () {
    var params = CDLGETPARAMS(this.priceData);
    var candleThreeBodySize = Math.abs(params.candleThree_Close - params.candleThree_Open),
        candleTwoBodySize = Math.abs(params.candleTwo_Close - params.candleTwo_Open),
        candleOneBodySize = Math.abs(params.candleOne_Close - params.candleOne_Open);
    var candleThreeLowerShadow = Math.abs(params.candleThree_Low - Math.min(params.candleThree_Close, params.candleThree_Open));

    var candleOneObejct = this.CDLMARUBOZU(params.candleOne_Open, params.candleOne_High, params.candleOne_Low, params.candleOne_Close);

    var isBullishContinuation = params.isCandleThree_Bearish && (candleThreeLowerShadow >= candleThreeBodySize) //A black candlestick with almost no upper shadow and a long lower shadow appears on the first day.
                && params.isCandleTwo_Bearish && (params.candleTwo_Low > params.candleThree_Low) && (params.candleTwo_Open < params.candleThree_Open) && (candleTwoBodySize < candleThreeBodySize) // The next day is another black candlestick closing below the previous day�s close and having an opening in the range of the previous day�s body. However, it has a higher low.
                && candleOneObejct.isBear && (params.candleOne_Low > params.candleTwo_Low) && (candleOneBodySize < candleTwoBodySize);//The last day is a small black Marubozu with a higher low
   
    //It's a bullish candlestick
    var isBearishContinuation = false;
    return {
        isBear : isBearishContinuation,
        isBull : isBullishContinuation
    };
};

CDL.prototype.CDLABANDONEDBABY = function () {
     var params = CDLGETPARAMS(this.priceData);

    var dojiResponse_candleTwo = this.CDLDOJI(params.candleTwo_Open, params.candleTwo_High, params.candleTwo_Low, params.candleTwo_Close);

    var isBearishContinuation = params.isCandleThree_Bullish
                                && dojiResponse_candleTwo.isDoji && (params.candleTwo_Low > params.candleThree_High)
                                && params.isCandleOne_Bearish && (params.candleTwo_Low > params.candleOne_High);

    var isBullishContinuation = params.isCandleThree_Bearish
                                && dojiResponse_candleTwo.isDoji && (params.candleTwo_High < params.candleThree_Low)
                                && params.isCandleOne_Bullish && (params.candleTwo_High < params.candleOne_Low);

    return {
        isBear : isBearishContinuation,
        isBull : isBullishContinuation
    };
}

CDL.prototype.CDLADVANCEBLOCK = function () {

    var params = CDLGETPARAMS(this.priceData);

    var candleOneBody = Math.abs(params.candleOne_Open - params.candleOne_Close),
        candleThreeBody = Math.abs(params.candleThree_Open - params.candleThree_Close),
        candleTwoBody = Math.abs(params.candleTwo_Open - params.candleTwo_Close),
        candleThreeUpperShadow = Math.abs(params.candleThree_High - params.candleThree_Close),
        candleTwoUpperShadow = Math.abs(params.candleTwo_High - params.candleTwo_Close),
        candleOneUpperShadow = Math.abs(params.candleOne_High - params.candleOne_Close);

    //It's a bearish candlestick
    var isBullishContinuation = false;

    var isBearishContinuation = params.isCandleThree_Bullish && (this.indicators.isLongCandle(params.candleThree_Open, params.candleThree_High, params.candleThree_Low, params.candleThree_Close)) //Three long white days occur, each with a higher close than the previous day
                                && params.isCandleTwo_Bullish && (candleTwoBody <= candleThreeBody) && (params.candleTwo_Close > params.candleThree_Close)
                                && (params.candleTwo_Open <= params.candleThree_Close) && (params.candleTwo_Open > params.candleThree_Open) //Each day opens within the body of the previous day 
                                && params.isCandleOne_Bullish && (candleOneBody <= candleTwoBody) && (params.candleOne_Close > params.candleTwo_Close)
                                && (params.candleOne_Open <= params.candleTwo_Close) && (params.candleOne_Open > params.candleTwo_Open) //Each day opens within the body of the previous day
                                && (candleTwoUpperShadow > candleThreeUpperShadow) && (candleOneUpperShadow > candleThreeUpperShadow); //The second and third days should also show long upper wicks

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLBELTHOLD = function () {

    var params = CDLGETPARAMS(this.priceData);

    var isBullishContinuation = params.isCandleThree_Bearish  //After a stretch of bearish candlestick
                                && params.isCandleTwo_Bearish //After a stretch of bearish candlestick
                                && params.isCandleOne_Bullish && (this.indicators.isLongCandle(params.candleOne_Open, params.candleOne_High, params.candleOne_Low, params.candleOne_Close))  //Long candle
                                && (params.candleOne_Open === params.candleOne_Low) && (params.candleOne_Open < params.candleTwo_Close);// a bullish or white candlestick forms. The opening price, which becomes the low for the day, is significantly lower then the closing price.

    var isBearishContinuation = params.isCandleThree_Bullish  //After a stretch of bullish candlestick
                                && params.isCandleTwo_Bullish //After a stretch of bullish candlestick
                                && params.isCandleOne_Bearish &&  (this.indicators.isLongCandle(params.candleOne_Open, params.candleOne_High, params.candleOne_Low, params.candleOne_Close)) //Long candle
                                && (params.candleOne_Open === params.candleOne_High) && (params.candleOne_Open > params.candleTwo_Close);// a bearish or black candlestick forms. the opening price, which becomes the high for the day, is higher than the close of the previous day.

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLBREAKAWAY = function () {

    var params = CDLGETPARAMS(this.priceData);

    var isBullishContinuation = false, isBearishContinuation = false;

    if (params.candleFour_Index >= 0 && params.candleFive_Index > 0) {
        var candleFiveBody = Math.abs(params.candleFive_Close - params.candleFive_Open);
        var shortCandleSize = candleFiveBody / 2;

        var isBullishContinuation = params.isCandleFive_Bearish && (this.indicators.isLongCandle(params.candleFive_Open, params.candleFive_High, params.candleFive_Low, params.candleFive_Close)) //long candle
                                  && params.isCandleFour_Bearish && (Math.abs(params.candleFour_Close - params.candleFour_Open) < shortCandleSize) && (params.candleFour_Open < params.candleFive_Close)
                                  && (Math.abs(params.candleThree_Close - params.candleThree_Open) < shortCandleSize) && (Math.min(params.candleThree_Close, params.candleThree_Open) < params.candleFour_Close)
                                  && (Math.abs(params.candleTwo_Close - params.candleTwo_Open) < shortCandleSize) && (Math.min(params.candleTwo_Close, params.candleTwo_Open) < Math.min(params.candleThree_Close, params.candleThree_Open))
                                  && params.isCandleOne_Bullish //The fifth day is a long blue day 
                                  && (params.candleOne_Open > (Math.min(params.candleTwo_Close, params.candleTwo_Open)))
                                  && (params.candleOne_Close > params.candleFour_Open) && (params.candleOne_Close < params.candleFive_Open);//closes inside the gap formed between the first two days..


        var isBearishContinuation = params.isCandleFive_Bullish
                                  && params.isCandleFour_Bullish && (Math.abs(params.candleFour_Close - params.candleFour_Open) < params.shortCandleSize) && (params.candleFour_Open > params.candleFive_Close)
                                  && (Math.abs(params.candleThree_Close - params.candleThree_Open) < shortCandleSize) && (Math.max(params.candleThree_Close, params.candleThree_Open) > params.candleFour_Close)
                                  && (Math.abs(params.candleTwo_Close - params.candleTwo_Open) < shortCandleSize) && (Math.max(params.candleTwo_Close, params.candleTwo_Open) > Math.max(params.candleThree_Close, params.candleThree_Open))
                                  && params.isCandleOne_Bearish //The fifth day is a long red day 
                                  && (params.candleOne_Open < (Math.max(params.candleTwo_Close, params.candleTwo_Open)))
                                  && (params.candleOne_Close < params.candleFour_Open) && (params.candleOne_Close > params.candleFive_Close);//that closes inside of the gap between the first and second candle

    }
    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLCLOSINGMARUBOZU = function () {
    var params = CDLGETPARAMS(this.priceData);

    var isBearishContinuation = params.isCandleOne_Bearish
                               && (this.indicators.isLongCandle(params.candleOne_Open, params.candleOne_High, params.candleOne_Low, params.candleOne_Close))
                               && (params.candleOne_Low === params.candleOne_Close);

    var isBullishContinuation = params.isCandleOne_Bullish
                               && (this.indicators.isLongCandle(params.candleOne_Open, params.candleOne_High, params.candleOne_Low, params.candleOne_Close))
                               && (params.candleOne_High === params.candleOne_Close);

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
};

CDL.prototype.CDLCOUNTERATTACK = function () {

    var params = CDLGETPARAMS(this.priceData);

    var candleTwoBody = Math.abs(params.candleTwo_Close - params.candleTwo_Open);

    var isBullishContinuation = params.isCandleTwo_Bearish // bearish counterattack is a long black candle in an uptrend
                                && params.isCandleOne_Bullish  //followed by a long white candle.
                                && (params.candleOne_Close <= (params.candleTwo_Close + (candleTwoBody * 0.05)))
                                && (params.candleOne_Close >= (params.candleTwo_Close - (candleTwoBody * 0.05)));// Closing prices of both candles are at the same price level.

    var isBearishContinuation = params.isCandleTwo_Bullish // bullish counterattack is a long white candle in an uptrend level.
                                && params.isCandleOne_Bearish //followed by a long white candle.
                                && (params.candleOne_Close <= (params.candleTwo_Close + (candleTwoBody * 0.05)))
                                && (params.candleOne_Close >= (params.candleTwo_Close - (candleTwoBody * 0.05)));// Closing prices of both candles are at the same price level.

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLDARKCLOUDCOVER = function () {

    var params = CDLGETPARAMS(this.priceData);

    //It's a bearish candlestick
    var isBullishContinuation = false;

    var isBearishContinuation = params.isCandleTwo_Bullish
                                && params.isCandleOne_Bearish && (params.candleOne_Open > params.candleTwo_Close) //Black candlestick must open above the previous close.
                                && (params.candleOne_Close < (params.candleTwo_Open + (Math.abs(params.candleTwo_Open - params.candleTwo_Close) / 2))) //closes below the middle of day 1 bullish candlestick.
                                && (params.candleOne_Close > params.candleTwo_Open);//close within the price range of the previous day

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLDOJISTAR = function () {

    var params = CDLGETPARAMS(this.priceData);

    var dojiResponse_candleOne = this.CDLDOJI(params.candleOne_Open, params.candleOne_High, params.candleOne_Low, params.candleOne_Close);

    var isBearishContinuation = params.isCandleTwo_Bullish && (this.indicators.isLongCandle(params.candleTwo_Open, params.candleTwo_High, params.candleTwo_Low, params.candleTwo_Close)) //The first day is long green day
                                && dojiResponse_candleOne.isBear && (params.candleOne_Close >= params.candleTwo_Close); //Second day is a doji that opens at the previous day close

    var isBullishContinuation = params.isCandleTwo_Bearish && (this.indicators.isLongCandle(params.candleTwo_Open, params.candleTwo_High, params.candleTwo_Low, params.candleTwo_Close)) //The first day is long red day
                                && dojiResponse_candleOne.isBull && (params.candleOne_Close <= params.candleTwo_Close); //Second day is a doji that opens at the previous day close

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDL3WHITESOLDIERS = function() {
    var params = CDLGETPARAMS(this.priceData);
    var isBullishContinuation = false, isBearishContinuation = false;

    if (params.candleFour_Index >= 0) {
        isBullishContinuation = params.isCandleThree_Bullish && params.candleThree_Close >= params.candleFour_Close
            && this.indicators.isLongCandle(params.candleThree_Open, params.candleThree_High, params.candleThree_Low, params.candleThree_Close)
            && params.isCandleTwo_Bullish && params.candleTwo_Open >= params.candleThree_Open
            && params.candleTwo_Open <= params.candleThree_Close && params.candleTwo_Close >= params.candleThree_Close
            && this.indicators.isLongCandle(params.candleTwo_Open, params.candleTwo_High, params.candleTwo_Low, params.candleTwo_Close)
            && params.isCandleOne_Bullish && params.candleOne_Open >= params.candleTwo_Open
            && params.candleOne_Open <= params.candleTwo_Close && params.candleOne_Close >= params.candleTwo_Close
            && this.indicators.isLongCandle(params.candleOne_Open, params.candleOne_High, params.candleOne_Low, params.candleOne_Close);

        //It's a bullish candlestick
        isBearishContinuation = false;
    }

    return {
        isBear : isBearishContinuation,
        isBull : isBullishContinuation
    };
};

CDL.prototype.CDLDRAGONFLYDOJI = function () {
    var params = CDLGETPARAMS(this.priceData);

    var lowWick = Math.abs(params.candleOne_Low - Math.min(params.candleOne_Open, params.candleOne_Close)),
        highWick = Math.abs(params.candleOne_High - Math.max(params.candleOne_Open, params.candleOne_Close)),
        candleBodySize = Math.abs(params.candleOne_Low - params.candleOne_High),
        realBodySize = Math.abs(params.candleOne_Open - params.candleOne_Close),
        isOpenCloseHighAlmostSame = ((params.candleOne_Open === params.candleOne_Close) || (realBodySize < (candleBodySize * 0.1)))
        && ((params.candleOne_High === Math.max(params.candleOne_Open, params.candleOne_Close)) || (highWick < (candleBodySize * 0.1))),
        isLowerWickLong = (lowWick >= (candleBodySize * 0.60));

    var isBullishContinuation = params.isCandleTwo_Bearish //occurs at the bottom of downtrends.
                                && isOpenCloseHighAlmostSame //the open, high, and close are the same or about the same price
                                && isLowerWickLong;// The most important part of the Dragonfly Doji is the long lower shadow.

    var isBearishContinuation = params.isCandleTwo_Bullish //occurs at the top of uptrends
                                && isOpenCloseHighAlmostSame //the open, high, and close are the same or about the same price
                                && isLowerWickLong;// The most important part of the Dragonfly Doji is the long lower shadow.

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
};

CDL.prototype.CDLENGULFING = function () {
    var params = CDLGETPARAMS(this.priceData);

    var lowWick = Math.abs(params.candleOne_Low - Math.min(params.candleOne_Open, params.candleOne_Close)),
        highWick = Math.abs(params.candleOne_High - Math.max(params.candleOne_Open, params.candleOne_Close)),
        candleBodySize = Math.abs(params.candleOne_Low - params.candleOne_High),
        realBodySize = Math.abs(params.candleOne_Open - params.candleOne_Close),
        isOpenCloseHighAlmostSame = ((params.candleOne_Open === params.candleOne_Close) || (realBodySize < (candleBodySize * 0.1)))
        && ((params.candleOne_High === Math.max(params.candleOne_Open, params.candleOne_Close)) || (highWick < (candleBodySize * 0.1))),
        isLowerWickLong = (lowWick >= (candleBodySize * 0.60));

    var isBearishContinuation = params.isCandleTwo_Bullish && params.isCandleOne_Bearish && params.candleTwo_Close < params.candleOne_Open && params.candleTwo_Open > params.candleOne_Close;

    var isBullishContinuation = params.isCandleTwo_Bearish && params.isCandleOne_Bullish && params.candleTwo_Close > params.candleOne_Open && params.candleTwo_Open < params.candleOne_Close;

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
};

CDL.prototype.CDLEVENINGDOJISTAR = function () {
    var params = CDLGETPARAMS(this.priceData);
    var isBullishContinuation = false, isBearishContinuation = false;

    if (params.candleFour_Index >= 0) {
        var candleOneBody = Math.abs(params.candleOne_Open - params.candleOne_Close),
            candleThreeBody = Math.abs(params.candleThree_Open - params.candleThree_Close),
            candleTwoBody = Math.abs(params.candleTwo_Low - params.candleTwo_High),
            iscandleTwoDoji = (params.candleTwo_Open === params.candleTwo_Close) || ((candleTwoBody * 0.10) >= Math.abs(params.candleTwo_Open - params.candleTwo_Close));

        //It's a bearish candlestick
        var isBullishContinuation = false;

        var isBearishContinuation = (params.candleThree_Close >= Math.max(params.candleFour_Close, params.candleFour_Open))  //occurs at the top of an uptrend.
                                    && params.isCandleThree_Bullish && (this.indicators.isLongCandle(params.candleThree_Open, params.candleThree_High, params.candleThree_Low, params.candleThree_Close))  //The first part of an Evening Star reversal pattern is a large bullish green candle.
                                    && iscandleTwoDoji && (Math.min(params.candleTwo_Open, params.candleTwo_Close) > params.candleThree_Close) //The second day begins with a gap up and it is quite small and can be bullish or bearish.
                                    && params.isCandleOne_Bearish && (this.indicators.isLongCandle(params.candleOne_Open, params.candleOne_High, params.candleOne_Low, params.candleOne_Close)) && (params.candleOne_Open < Math.min(params.candleTwo_Open, params.candleTwo_Close))//a large Bearish Candle with gap down.
                                    && (params.candleOne_Close > params.candleThree_Open) && (params.candleOne_Close < params.candleThree_Close); //closes well within the body of the first candle
    }

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
};

CDL.prototype.CDLEVENINGSTAR = function () {
    var params = CDLGETPARAMS(this.priceData);
    var isBullishContinuation = false, isBearishContinuation = false;

    if (params.candleFour_Index >= 0) {
        var candleOneBody = Math.abs(params.candleOne_Open - params.candleOne_Close);
        var candleTwoBody = Math.abs(params.candleTwo_Open - params.candleTwo_Close);
        var candleTwoSize = Math.abs(params.candleTwo_Low - params.candleTwo_High);
        var candleThreeBody = Math.abs(params.candleThree_Open - params.candleThree_Close);

        var isBullishContinuation = false;

        //Evening Star is bearish only
        var isBearishContinuation = (params.candleThree_Close >= Math.max(params.candleFour_Close, params.candleFour_Open))  //occurs at the top of an uptrend.
                                    && params.isCandleThree_Bullish && (this.indicators.isLongCandle(params.candleThree_Open, params.candleThree_High, params.candleThree_Low, params.candleThree_Close))//The first part of an Evening Star reversal pattern is a large bullish green candle.
                                    && (candleTwoBody >= candleTwoSize * 0.10) && (Math.min(params.candleTwo_Open, params.candleTwo_Close) > params.candleThree_Close) //The second day begins with a gap up and it is quite small and can be bullish or bearish.
                                    && params.isCandleOne_Bearish && (this.indicators.isLongCandle(params.candleOne_Open, params.candleOne_High, params.candleOne_Low, params.candleOne_Close)) && (params.candleOne_Open < Math.min(params.candleTwo_Open, params.candleTwo_Close))//a large Bearish Candle with gap down.
                                    && (params.candleOne_Close > params.candleThree_Open) && (params.candleOne_Close < params.candleThree_Close);
    }

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
};

CDL.prototype.CDLGAPSIDESIDEWHITE = function () {
    var params = CDLGETPARAMS(this.priceData);

    var isBullishContinuation = params.isCandleThree_Bullish  //the first candlestick is upward 
                                && params.isCandleTwo_Bullish && (params.candleTwo_Open > params.candleThree_Close) //followed by another upward that opens above  the first (gap up), 
                                && params.isCandleOne_Bullish && (params.candleOne_Open > params.candleThree_Close) && (params.candleOne_Open < params.candleTwo_Close)// followed by a third upward candlestick that opens below the close of the second (gap down)
                                && (params.candleOne_Close <= (params.candleTwo_Close + (Math.abs(params.candleTwo_Close - params.candleTwo_Open) * 0.10)));

    var isBearishContinuation = params.isCandleThree_Bearish  //the first candlestick is downward
                                && params.isCandleTwo_Bullish && (params.candleTwo_Close < params.candleThree_Close)//followed by an upward candlestick that opens below the  first one (gap down),
                                && params.isCandleOne_Bullish && (params.candleOne_Close < params.candleThree_Close) && (params.candleOne_Open < params.candleTwo_Close)// followed by an upward candlestick that opens below the close of the second one
                                && (params.candleOne_Close <= (params.candleTwo_Close + (Math.abs(params.candleTwo_Close - params.candleTwo_Open) * 0.10)));

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLGRAVESTONEDOJI = function () {
    var params = CDLGETPARAMS(this.priceData);

    var highWick = Math.abs(params.candleOne_High - Math.max(params.candleOne_Open, params.candleOne_Close)),
        candleBodySize = Math.abs(params.candleOne_Low - params.candleOne_High),
        isOpenCloseLowAlmostSame = ((params.candleOne_Open === params.candleOne_Close) || ((candleBodySize * 0.05) >= Math.abs(params.candleOne_Open - params.candleOne_Close)))
        && (params.candleOne_Low === Math.min(params.candleOne_Open, params.candleOne_Close)) || ((candleBodySize * 0.05) >= Math.abs(params.candleOne_Low - Math.min(params.candleOne_Open, params.candleOne_Close))),
        isUpperShadowLong = (highWick >= (candleBodySize * 0.80));

    var isBullishContinuation = params.isCandleTwo_Bearish //occurs at the top of downtrend
                                && isOpenCloseLowAlmostSame //the open, high, and close are the same or about the same price
                                && isUpperShadowLong;// The most important part of the Graveston Doji is the long upper shadow..

    var isBearishContinuation = params.isCandleTwo_Bullish //occurs at the top of uptrends
                                && isOpenCloseLowAlmostSame //the open, high, and close are the same or about the same price
                                && isUpperShadowLong;// The most important part of the Graveston Doji is the long upper shadow..

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLHAMMER = function () {
    var params = CDLGETPARAMS(this.priceData);

    var candleOneUpperShadow = Math.abs(Math.max(params.candleOne_Open, params.candleOne_Close) - params.candleOne_High),
        candleOneBody = Math.abs(params.candleOne_Open - params.candleOne_Close),
        candleBodySize = Math.abs(params.candleOne_Low - params.candleOne_High),
        candleOneLowerShadow = Math.abs(params.candleOne_Low - Math.min(params.candleOne_Close, params.candleOne_Open)),
        isOpenCloseHighAlmostSame = (candleOneBody < (candleBodySize * 0.40))
        && ((params.candleOne_High === Math.max(params.candleOne_Open, params.candleOne_Close)) || (candleOneUpperShadow < (candleBodySize * 0.10)));

    var isBullishContinuation = params.isCandleTwo_Bearish && (params.candleTwo_Open < Math.min(params.candleThree_Close, params.candleThree_Open)) //a downward trend indicating a bullish reversal, it is a hammer
                                && isOpenCloseHighAlmostSame  //the open, high, and close are roughly the same price. means it has a small body.
                                && (candleOneLowerShadow >= (2.0 * candleOneBody)) && (params.candleOne_Close < params.candleTwo_Close); //there is a long lower shadow, twice the length as the real body.

    //It's a bullish candlestick
    var isBearishContinuation = false;

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLHANGINGMAN = function () {
    var params = CDLGETPARAMS(this.priceData);

    var candleOneUpperShadow = Math.abs(Math.max(params.candleOne_Open, params.candleOne_Close) - params.candleOne_High),
        candleOneBody = Math.abs(params.candleOne_Open - params.candleOne_Close),
        candleBodySize = Math.abs(params.candleOne_Low - params.candleOne_High),
        candleOneLowerShadow = Math.abs(params.candleOne_Low - Math.min(params.candleOne_Close, params.candleOne_Open)),
        isOpenCloseHighAlmostSame = (candleOneBody < (candleBodySize * 0.40))
        && ((params.candleOne_High === Math.max(params.candleOne_Open, params.candleOne_Close)) || (candleOneUpperShadow < (candleBodySize * 0.10)));

    var isBearishContinuation = params.isCandleTwo_Bullish && (params.candleTwo_Open > Math.max(params.candleThree_Close, params.candleThree_Open)) //a downward trend indicating a bullish reversal, it is a hammer
                              && isOpenCloseHighAlmostSame //the open, high, and close are roughly the same price. means it has a small body.
                              && (candleOneLowerShadow >= (2.0 * candleOneBody) && (params.candleOne_Close > params.candleTwo_Close)); //there is a long lower shadow, twice the length as the real body.

    //It's a bearish candlestick
    var isBullishContinuation = false;

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLHARAMI = function () {
    var params = CDLGETPARAMS(this.priceData);

    var isBullishContinuation = params.isCandleTwo_Bearish && (this.indicators.isLongCandle(params.candleTwo_Open, params.candleTwo_High, params.candleTwo_Low, params.candleTwo_Close))//the first candlestick is upward
                                && params.isCandleOne_Bullish && (params.candleOne_Open > params.candleTwo_Close) && (params.candleOne_Close < params.candleTwo_Open)// followed by a smaller candlestick whose body is located within the vertical range of the larger body
                                && (Math.abs(params.candleOne_Open - params.candleOne_Close) < (Math.abs(params.candleTwo_Open - params.candleTwo_Close) * 0.60)); //Must be smaller than prevoius day

    var isBearishContinuation = params.isCandleTwo_Bullish && (this.indicators.isLongCandle(params.candleTwo_Open, params.candleTwo_High, params.candleTwo_Low, params.candleTwo_Close))// a large bullish green candle on Day 1
                               && params.isCandleOne_Bearish && (params.candleOne_Open < params.candleTwo_Close) && (params.candleOne_Close > params.candleTwo_Open)// followed by a smaller candlestick whose body is located within the vertical range of the larger body
                               && (Math.abs(params.candleOne_Open - params.candleOne_Close) < (Math.abs(params.candleTwo_Open - params.candleTwo_Close) * 0.60));//Must be smaller than prevoius day

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLHARAMICROSS = function () {
    var params = CDLGETPARAMS(this.priceData);

    var dojiResponse_candleOne = this.CDLDOJI(params.candleOne_Open, params.candleOne_High, params.candleOne_Low, params.candleOne_Close);

    var isBullishContinuation = params.isCandleTwo_Bearish //the first candlestick is upward
                                && dojiResponse_candleOne.isBull && (Math.min(params.candleOne_Close, params.candleOne_Open) > params.candleTwo_Close) && (Math.max(params.candleOne_Close, params.candleOne_Open) < params.candleTwo_Open); //followed by a doji that is located within the top and bottom of the candlestick's body. 

    var isBearishContinuation = params.isCandleTwo_Bullish // a large bullish green candle on Day 1
                                && dojiResponse_candleOne.isBear && (Math.min(params.candleOne_Close, params.candleOne_Open) > params.candleTwo_Open) && (Math.max(params.candleOne_Close, params.candleOne_Open) < params.candleTwo_Close); //followed by a doji that is located within the top and bottom of the candlestick's body. 

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLHOMINGPIGEON = function () {
    var params = CDLGETPARAMS(this.priceData);

    var candleOneBody = Math.abs(params.candleOne_Close - params.candleOne_Open);

    var isBullishContinuation = params.isCandleTwo_Bearish && (this.indicators.isLongCandle(params.candleTwo_Open, params.candleTwo_High, params.candleTwo_Low, params.candleTwo_Close))// First candle is a long black candle.
                                && params.isCandleOne_Bearish 
                                && (params.candleOne_Low > params.candleTwo_Low) && (params.candleOne_Close > params.candleTwo_Close) // Second candle is an inside bar, which is also a black candle. Second candle closes inside the body of the first candle.
                                && (params.candleOne_High < params.candleTwo_High) && (params.candleOne_Open < params.candleTwo_Open);
    //It's a bullish candlestick
    var isBearishContinuation = false;

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLHIKKAKE = function () {
    var params = CDLGETPARAMS(this.priceData);
    var isBullishContinuation = false, isBearishContinuation = false;

    if (params.candleFour_Index >= 0 && params.candleFive_Index > 0) {
        var isBullishContinuation = Math.max(params.candleFive_Close, params.candleFive_Open) > Math.max(params.candleFour_Close, params.candleFour_Open)
                                   && Math.min(params.candleFive_Close, params.candleFive_Open) < Math.min(params.candleFour_Close, params.candleFour_Open)
                                   && Math.max(params.candleFive_Close, params.candleFive_Open) > Math.max(params.candleThree_Close, params.candleThree_Open)
                                   && Math.max(params.candleFive_Close, params.candleFive_Open) > Math.max(params.candleTwo_Close, params.candleTwo_Open)
                                   && params.isCandleOne_Bullish
                                   && (params.candleOne_Close > Math.max(params.candleFive_Close, params.candleFive_Open));// reaches above the range of the three preceding ,

        var isBearishContinuation = Math.max(params.candleFive_Close, params.candleFive_Open) > Math.max(params.candleFour_Close, params.candleFour_Open)
                                  && Math.min(params.candleFive_Close, params.candleFive_Open) < Math.min(params.candleFour_Close, params.candleFour_Open)
                                  && Math.min(params.candleFive_Close, params.candleFive_Open) < Math.min(params.candleThree_Close, params.candleThree_Open)
                                  && Math.min(params.candleFive_Close, params.candleFive_Open) < Math.min(params.candleTwo_Close, params.candleTwo_Open)
                                  && params.isCandleOne_Bearish
                                  && (params.candleOne_Close < Math.min(params.candleFive_Close, params.candleFive_Open));

    }
    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLIDENTICAL3CROWS = function () {
    var params = CDLGETPARAMS(this.priceData);
    var isBullishContinuation = false, isBearishContinuation = false;

    if (params.candleFour_Index >= 0 ) {
        var candleThreeBodySize = Math.abs(params.candleThree_Close - params.candleThree_Open),
             candleTwoBodySize = Math.abs(params.candleTwo_Close - params.candleTwo_Open),
             candleOneBodySize = Math.abs(params.candleOne_Close - params.candleOne_Open);

        //It''s a bearish candlestick
        var isBullishContinuation = false;

        var isBearishContinuation = params.isCandleFour_Bullish
                                 && params.isCandleThree_Bearish && (this.indicators.isLongCandle(params.candleThree_Open, params.candleThree_High, params.candleThree_Low, params.candleThree_Close))
				                 && params.isCandleTwo_Bearish && (this.indicators.isLongCandle(params.candleTwo_Open, params.candleTwo_High, params.candleTwo_Low, params.candleTwo_Close)) && (params.candleTwo_Open === params.candleThree_Close || (Math.abs(params.candleThree_Close - params.candleTwo_Open) < (candleThreeBodySize * .10))) && (params.candleTwo_Close < params.candleThree_Close) //Three consecutive long red days with lower closes each day
					             && params.isCandleOne_Bearish && (this.indicators.isLongCandle(params.candleOne_Open, params.candleOne_High, params.candleOne_Low, params.candleOne_Close)) && (params.candleOne_Open === params.candleTwo_Close || (Math.abs(params.candleTwo_Close - params.candleOne_Open) < (candleTwoBodySize * .10))) && (params.candleOne_Close < params.candleTwo_Close);  //and Each day opens at or near the previous day's close.

    }
    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLINNECK = function () {
    var params = CDLGETPARAMS(this.priceData);

    var candleTwoBodySize = Math.abs(params.candleTwo_Close - params.candleTwo_Open);

    var isBullishContinuation = params.isCandleThree_Bullish //After an uptrend
                                && params.isCandleTwo_Bullish && (this.indicators.isLongCandle(params.candleTwo_Open, params.candleTwo_High, params.candleTwo_Low, params.candleTwo_Close)) //1st day is a long blue day.
                                && params.isCandleOne_Bearish && (params.candleOne_Open > params.candleTwo_High)  //2nd day is a red day which opens above the high of the 1st day
                                && (params.candleOne_Close < params.candleTwo_Close) && (params.candleOne_Close > (params.candleTwo_Close - (candleTwoBodySize * 0.10)));//2nd day closes barely into the body of the 1st day,near 1st day close.

    var isBearishContinuation = params.isCandleThree_Bearish //After a downtrend
                                && params.isCandleTwo_Bearish && (this.indicators.isLongCandle(params.candleTwo_Open, params.candleTwo_High, params.candleTwo_Low, params.candleTwo_Close)) //1st day is a long red day.
                                && params.isCandleOne_Bullish && (params.candleOne_Open < params.candleTwo_Low)  //2nd day is a white day which opens below the low of the 1st day
                                && (params.candleOne_Close > params.candleTwo_Close) && (params.candleOne_Close < (params.candleTwo_Close + (candleTwoBodySize * 0.10)));//2nd day closes barely into the body of the 1st day,near 1st day close.

    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLINVERTEDHAMMER = function () {
    var params = CDLGETPARAMS(this.priceData);

    var candleOneUpperShadow = Math.abs(Math.max(params.candleOne_Open, params.candleOne_Close) - params.candleOne_High),
        candleOneBody = Math.abs(params.candleOne_Open - params.candleOne_Close),
        candleBodySize = Math.abs(params.candleOne_Low - params.candleOne_High),
        candleOneLowerShadow = Math.abs(params.candleOne_Low - Math.min(params.candleOne_Close, params.candleOne_Open)),
        isOpenCloseLowAlmostSame = (candleOneBody < (candleBodySize * 0.40))
        && ((params.candleOne_Low === Math.min(params.candleOne_Open, params.candleOne_Close)) || (candleOneLowerShadow < (candleBodySize * 0.10)));

    var isBullishContinuation = (Math.min(params.candleTwo_Close, params.candleTwo_Open) < (Math.min(params.candleThree_Open, params.candleThree_Close)))
                                && (Math.min(params.candleOne_Close, params.candleOne_Open) < Math.min(params.candleTwo_Close, params.candleTwo_Open))  //a downward trend indicating a bullish reversal, it is a inverted hammer
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
    var params = CDLGETPARAMS(this.priceData);
    var candleOneObejct = this.CDLMARUBOZU(params.candleOne_Open, params.candleOne_High, params.candleOne_Low, params.candleOne_Close);
    var candleTwoObejct = this.CDLMARUBOZU(params.candleTwo_Open, params.candleTwo_High, params.candleTwo_Low, params.candleTwo_Close);

    var isBullishContinuation = candleTwoObejct.isBear  // a black or filled candlestick without any wicks (shadows)
                               && candleOneObejct.isBull //followed by a gap higher with a white or hollow candlestick that is also without wicks.
                               && (params.candleOne_Close > params.candleTwo_Open); //Gap up

    var isBearishContinuation = candleTwoObejct.isBull  // a black or filled candlestick without any wicks (shadows)
                               && candleOneObejct.isBear //followed by a gap higher with a white or hollow candlestick that is also without wicks.
                               && (params.candleOne_Close < params.candleTwo_Open); //Gap down

    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLLADDERBOTTOM = function () {
    var params = CDLGETPARAMS(this.priceData);
    var isBullishContinuation = false, isBearishContinuation = false;

    if (params.candleFour_Index >= 0 && params.candleFive_Index > 0) {
        var isBullishContinuation = params.isCandleFive_Bearish
                                    && params.isCandleFour_Bearish && params.candleFour_Open > params.candleFive_Close && params.candleFour_Close < params.candleFive_Close && params.candleFour_Open < params.candleFive_Open// 1st three days are red days with lower opens and closes each day.
                                    && params.isCandleThree_Bearish && params.candleThree_Open > params.candleFour_Close && params.candleThree_Close < params.candleFour_Close && params.candleThree_Open < params.candleFour_Open// 1st three days are red days with lower opens and closes each day.
                                    && params.isCandleTwo_Bearish && params.candleTwo_High > params.candleThree_Close && params.candleTwo_High > params.candleTwo_Open && params.candleTwo_Close < params.candleThree_Close && params.candleTwo_Open < params.candleThree_Open // 4th day is a red day with an upper shadow.
                                    && params.isCandleOne_Bullish && params.candleOne_Open > params.candleTwo_Open; //The last day is white that opens above the body of the 4th day.

        //It's a bullish candlestick
        var isBearishContinuation = false;

    }
    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLKICKINGBYLENGTH = function () {
    var params = CDLGETPARAMS(this.priceData);
    var candleOneObejct = this.CDLMARUBOZU(params.candleOne_Open, params.candleOne_High, params.candleOne_Low, params.candleOne_Close);
    var candleTwoObejct = this.CDLMARUBOZU(params.candleTwo_Open, params.candleTwo_High, params.candleTwo_Low, params.candleTwo_Close);

    var isBullishContinuation = candleTwoObejct.isBear && (this.indicators.isLongCandle(params.candleTwo_Open, params.candleTwo_High, params.candleTwo_Low, params.candleTwo_Close)) // a black or filled candlestick without any wicks (shadows)
                              && candleOneObejct.isBull && (this.indicators.isLongCandle(params.candleOne_Open, params.candleOne_High, params.candleOne_Low, params.candleOne_Close))//followed by a gap higher with a white or hollow candlestick that is also without wicks.
                              && (params.candleOne_Close > params.candleTwo_Open); //Gap up

    var isBearishContinuation = candleTwoObejct.isBull && (this.indicators.isLongCandle(params.candleTwo_Open, params.candleTwo_High, params.candleTwo_Low, params.candleTwo_Close)) // a black or filled candlestick without any wicks (shadows)
                               && candleOneObejct.isBear && (this.indicators.isLongCandle(params.candleOne_Open, params.candleOne_High, params.candleOne_Low, params.candleOne_Close)) //followed by a gap higher with a white or hollow candlestick that is also without wicks.
                               && (params.candleOne_Close < params.candleTwo_Open); //Gap down

    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLLONGLEGGEDDOJI = function () {
    var params = CDLGETPARAMS(this.priceData);

    var lowerShadow = Math.abs(params.candleOne_Low - Math.min(params.candleOne_Open, params.candleOne_Close)),
        upperShadow = Math.abs(params.candleOne_High - Math.max(params.candleOne_Open, params.candleOne_Close)),
        candleBodySize = Math.abs(params.candleOne_Low - params.candleOne_High),
        realBodySize = Math.abs(params.candleOne_Open - params.candleOne_Close),
        isOpenCloseAlmostSame = ((params.candleOne_Open === params.candleOne_Close) || (realBodySize < (candleBodySize * 0.10))),
        isLowerShadowLong = (lowerShadow >= (candleBodySize * 0.40)) && (lowerShadow <= (candleBodySize * 0.80)),
        isUpperShadowLong = (upperShadow >= (candleBodySize * 0.40)) && (upperShadow <= (candleBodySize * 0.80));

    var isBullishContinuation = params.isCandleTwo_Bearish//occurs at the bottom of downtrends.
                                && isOpenCloseAlmostSame //vary small  body 
                                && isUpperShadowLong //long and almost same shadows 
                                && isLowerShadowLong;// long and almost same shadows

    var isBearishContinuation = params.isCandleTwo_Bullish //occurs at the top of uptrends\
                                && isOpenCloseAlmostSame //vary small body 
                                && isUpperShadowLong //long and almost same shadows
                                && isLowerShadowLong;// long and almost same shadows.

    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLLONGLINE = function () {
    var params = CDLGETPARAMS(this.priceData);

    var lowerShadow = Math.abs(params.candleOne_Low - Math.min(params.candleOne_Open, params.candleOne_Close)),
        upperShadow = Math.abs(params.candleOne_High - Math.max(params.candleOne_Open, params.candleOne_Close)),
        candleBodySize = Math.abs(params.candleOne_Low - params.candleOne_High),
        realBodySize = Math.abs(params.candleOne_Close - params.candleOne_Open),
        isLowerShadowShort = (lowerShadow === 0) || (lowerShadow < (candleBodySize * 0.10)),
        isUpperShadowShort = (upperShadow === 0) || (upperShadow < (candleBodySize * 0.10));

    var isBullishContinuation = params.isCandleOne_Bullish
                                && this.indicators.isLongCandle(params.candleOne_Open, params.candleOne_High, params.candleOne_Low, params.candleOne_Close)
                                && isLowerShadowShort && isUpperShadowShort;

    var isBearishContinuation = params.isCandleOne_Bearish
                                && this.indicators.isLongCandle(params.candleOne_Open, params.candleOne_High, params.candleOne_Low, params.candleOne_Close)
                                && isLowerShadowShort && isUpperShadowShort;

    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLMARUBOZU = function (candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close) {
    var params = CDLGETPARAMS(this.priceData);

    var lowerShadow = Math.abs(candleOne_Low - Math.min(candleOne_Open, candleOne_Close)),
        upperShadow = Math.abs(candleOne_High - Math.max(candleOne_Open, candleOne_Close)),
        candleBodySize = Math.abs(candleOne_Low - candleOne_High),
        realBodySize = Math.abs(candleOne_Close - candleOne_Open),
        isLowerShadowShort = (lowerShadow === 0) || (lowerShadow <= (candleBodySize * 0.05)),
        isUpperShadowShort = (upperShadow === 0) || (upperShadow <= (candleBodySize * 0.05));
    var isCandleOne_Bearish = candleOne_Close > candleOne_Open,
        isCandleOne_Bullish = candleOne_Close < candleOne_Open;

    isBearishContinuation = isCandleOne_Bearish
                          && this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close)
                          && (isUpperShadowShort && isLowerShadowShort);
    isBullishContinuation = isCandleOne_Bullish
                          && this.indicators.isLongCandle(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close)
                          && isUpperShadowShort && isLowerShadowShort;

    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLMATCHINGLOW = function () {
    var params = CDLGETPARAMS(this.priceData);

    var isBullishContinuation = params.isCandleTwo_Bearish && (params.candleTwo_Open > params.candleOne_Open)  // The first candle has a tall body
                               && params.isCandleOne_Bearish && (params.candleOne_Close === params.candleTwo_Close); //The second day follows with another black candlestick whose closing price is exactly equal to the closing price of the first day.

    //It's a bullish candlestick
    var isBearishContinuation = false;

    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLMATHOLD = function () {
    var params = CDLGETPARAMS(this.priceData);
    var isBullishContinuation = false, isBearishContinuation = false;

    if (params.candleFour_Index >= 0 && params.candleFive_Index > 0) {
       var isBullishContinuation = params.isCandleFive_Bullish && (this.indicators.isLongCandle(params.candleFive_Open, params.candleFive_High, params.candleFive_Low, params.candleFive_Close))  //The first day is a long white day
                                    && params.isCandleFour_Bearish && (params.candleFour_Close > params.candleFive_Close) //The second day gaps up and is a black day
                                    && params.isCandleThree_Bearish && (params.candleThree_Close < params.candleFour_Close)//The second, third, and fourth days have small real bodies and follow a brief downtrend pattern, but stay within the range of the first day 
                                    && params.isCandleTwo_Bearish && (params.candleTwo_Close < params.candleThree_Close) && (params.candleTwo_Close > params.candleFive_Open) //  stay within the range of the first day 
                                    && params.isCandleOne_Bullish && (this.indicators.isLongCandle(params.candleOne_Open, params.candleOne_High, params.candleOne_Low, params.candleOne_Close))
                                    && (params.candleOne_Close > params.candleFour_Open);// The fifth day is a long white day that closes above the trading ranges of the previous four days

        var isBearishContinuation = params.isCandleFive_Bearish && (this.indicators.isLongCandle(params.candleFive_Open, params.candleFive_High, params.candleFive_Low, params.candleFive_Close)) //The first day is a long red day
                                    && params.isCandleFour_Bullish && (params.candleFour_Close < params.candleFive_Close)//The second day gaps up and is a black day
                                    && params.isCandleThree_Bullish && (params.candleThree_Close > params.candleFour_Close)//The second, third, and fourth days have small real bodies and follow a brief downtrend pattern, but stay within the range of the first day 
                                    && params.isCandleTwo_Bullish && (params.candleTwo_Close > params.candleThree_Close) && (params.candleTwo_Close < params.candleFive_Open) //  stay within the range of the first day 
                                    && params.isCandleOne_Bearish && (this.indicators.isLongCandle(params.candleOne_Open, params.candleOne_High, params.candleOne_Low, params.candleOne_Close))
                                    && (params.candleOne_Close < params.candleFour_Open);// The fifth day is a long white day that closes bellow  the trading ranges of the previous four days

    }
    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLMORNINGDOJISTAR = function () {
    var params = CDLGETPARAMS(this.priceData);
    var isBullishContinuation = false, isBearishContinuation = false;

    if (params.candleFour_Index >= 0) {
        var candleOneBody = Math.abs(params.candleOne_Open - params.candleOne_Close),
            candleThreeBody = Math.abs(params.candleThree_Open - params.candleThree_Close),
            candleTwoBody = Math.abs(params.candleTwo_Low - params.candleTwo_High),
            iscandleTwoDoji = params.candleTwo_Open === params.candleTwo_Close || ((candleTwoBody * 0.10) >= Math.abs(params.candleTwo_Open - params.candleTwo_Close));

        var isBullishContinuation = (params.candleThree_Close < Math.min(params.candleFour_Close, params.candleFour_Open))  //occurs within a defined downtrend.
                                    && params.isCandleThree_Bearish && (this.indicators.isLongCandle(params.candleThree_Open, params.candleThree_High, params.candleThree_Low, params.candleThree_Close))  //The first part of an Evening Star reversal pattern is a large bullish green candle.
                                    && iscandleTwoDoji && (Math.max(params.candleTwo_Open, params.candleTwo_Close) < params.candleThree_Close) //The second day begins with a gap down and it is quite small and can be bullish or bearish.
                                    && params.isCandleOne_Bullish && (this.indicators.isLongCandle(params.candleOne_Open, params.candleOne_High, params.candleOne_Low, params.candleOne_Close)) && (params.candleOne_Open > Math.max(params.candleTwo_Open, params.candleTwo_Close))//a large Bullish Candle with gap up.
                                    && (params.candleOne_Close < params.candleThree_Open) && (params.candleOne_Close > params.candleThree_Close); //closes well within the body of the first candle

        //It's a bullish candlestick
        var isBearishContinuation = false;
    }
    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLMORNINGSTAR = function () {
    var params = CDLGETPARAMS(this.priceData);
    var isBullishContinuation = false, isBearishContinuation = false;

    if (params.candleFour_Index >= 0) {
        var candleOneBody = Math.abs(params.candleOne_Open - params.candleOne_Close);
        var candleTwoBody = Math.abs(params.candleTwo_Open - params.candleTwo_Close);
        var candleThreeBody = Math.abs(params.candleThree_Open - params.candleThree_Close);

        var isBullishContinuation = (params.candleThree_Close < Math.min(params.candleFour_Close, params.candleFour_Open)) //its a bullish reversal pattern, usually occuring at the bottom of a downtrend. 
                                    && params.isCandleThree_Bearish && (candleThreeBody > (candleTwoBody * 3)) //The first part of an Evening Star reversal pattern is a large bullish green candle.
                                    && (candleTwoBody < (candleThreeBody / 3)) && (Math.max(params.candleTwo_Open, params.candleTwo_Close) < params.candleThree_Close) //The second day begins with a gap down and it is quite small and can be bullish or bearish.
                                    && params.isCandleOne_Bullish && (candleOneBody > candleTwoBody * 3) && (params.candleOne_Open > Math.max(params.candleTwo_Open, params.candleTwo_Close))//a large Bearish Candle than opens above the middle candle  and closes near the center of the first bar's body
                                    && (params.candleOne_Close < params.candleThree_Open);

        //It's a bullish only
        var isBearishContinuation = false;
    }
    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLONNECK = function () {
    var params = CDLGETPARAMS(this.priceData);

    var candleTwoBodySize = Math.abs(params.candleTwo_Close - params.candleTwo_Open);

    var isBullishContinuation = params.isCandleThree_Bullish //After an uptrend
                                && params.isCandleTwo_Bullish && (this.indicators.isLongCandle(params.candleTwo_Open, params.candleTwo_High, params.candleTwo_Low, params.candleTwo_Close)) //1st day is a long blue day.
                                && params.isCandleOne_Bearish && (params.candleOne_Open > params.candleTwo_High)  //2nd day is a red day which opens above the high of the 1st day
                                && (params.candleOne_Close >= params.candleTwo_High) && (params.candleOne_Close <= (params.candleTwo_High + (candleTwoBodySize * 0.10)));//The closing price of the black candle is at or near the high of the white candle

    var isBearishContinuation = params.isCandleThree_Bearish //After a downtrend
                                && params.isCandleTwo_Bearish && (this.indicators.isLongCandle(params.candleTwo_Open, params.candleTwo_High, params.candleTwo_Low, params.candleTwo_Close)) //1st day is a long red day.
                                && params.isCandleOne_Bullish && (params.candleOne_Open < params.candleTwo_Low)  //2nd day is a white day which opens below the low of the 1st day
                                && (params.candleOne_Close <= params.candleTwo_Low) && (params.candleOne_Close >= (params.candleTwo_Low - (candleTwoBodySize * 0.10)));//The closing price of the white candle is at or near the low of the black candle


    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLPIERCING = function () {
    var params = CDLGETPARAMS(this.priceData);

    var isBullishContinuation = params.isCandleTwo_Bearish
                                && params.isCandleOne_Bullish && (params.candleOne_Open < params.candleTwo_Close) //white candlestick must open below the previous close.
                                && (params.candleOne_Close > (Math.abs(params.candleTwo_Open + params.candleTwo_Close) / 2))//close above the midpoint of the black candlestick's body.
                                && (params.candleOne_Close < params.candleTwo_Open);//close within the price range of the previous day
    //It's a bullish candlestick
    var isBearishContinuation = false;


    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLRICKSHAWMAN = function () {
    var params = CDLGETPARAMS(this.priceData);

    var lowerShadow = Math.abs(params.candleOne_Low - Math.min(params.candleOne_Open, params.candleOne_Close)),
        upperShadow = Math.abs(params.candleOne_High - Math.max(params.candleOne_Open, params.candleOne_Close)),
        candleBodySize = Math.abs(params.candleOne_Low - params.candleOne_High),
        realBodySize = Math.abs(params.candleOne_Open - params.candleOne_Close),
        isOpenCloseAlmostSame = ((params.candleOne_Open === params.candleOne_Close) || (realBodySize < (candleBodySize * 0.10))),
        isLowerShadowLong = (lowerShadow >= (candleBodySize * 0.40)) && (lowerShadow <= (candleBodySize * 0.80)),
        isUpperShadowLong = (upperShadow >= (candleBodySize * 0.40)) && (upperShadow <= (candleBodySize * 0.80));

    var isBullishContinuation = params.isCandleTwo_Bearish//occurs at the bottom of downtrends.
                                && isOpenCloseAlmostSame //vary small  body 
                                && isUpperShadowLong //long and almost same shadows 
                                && isLowerShadowLong;// long and almost same shadows

    var isBearishContinuation = params.isCandleTwo_Bullish //occurs at the top of uptrends\
                                && isOpenCloseAlmostSame //vary small body 
                                && isUpperShadowLong //long and almost same shadows
                                && isLowerShadowLong;// long and almost same shadows.

    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLRISEFALL3METHODS = function () {
    var params = CDLGETPARAMS(this.priceData);
    var isBullishContinuation = false, isBearishContinuation = false;

    if (params.candleFour_Index >= 0 && params.candleFive_Index > 0) {
        var isBullishContinuation = params.isCandleFive_Bullish && (this.indicators.isLongCandle(params.candleFive_Open, params.candleFive_High, params.candleFive_Low, params.candleFive_Close)) //The first candlestick in this pattern is a light bullish candlestick with a large real body
                                    && params.candleFour_Low > params.candleFive_Low && params.candleFour_High < params.candleFive_High // it should be within the high and low of the first candlestick. 
                                    && params.candleThree_Low > params.candleFive_Low && params.candleThree_High < params.candleFive_High // it should be within the high and low of the first candlestick. 
                                    && params.candleTwo_Low > params.candleFive_Low && params.candleTwo_High < params.candleFive_High // it should be within the high and low of the first candlestick. 
                                    && params.isCandleOne_Bullish && params.candleOne_Open > params.candleTwo_Close && params.candleOne_Close > params.candleFive_Close;//he last candlestick that completes the pattern should open higher than the close of its preceding candlestick and should close above the close of the first candlestick.

        var isBearishContinuation = params.isCandleFive_Bearish && (this.indicators.isLongCandle(params.candleFive_Open, params.candleFive_High, params.candleFive_Low, params.candleFive_Close))
                                    && params.candleFour_Low > params.candleFive_Low && params.candleFour_High < params.candleFive_High // it should be within the high and low of the first candlestick. 
                                    && params.candleThree_Low > params.candleFive_Low && params.candleThree_High < params.candleFive_High // it should be within the high and low of the first candlestick. 
                                    && params.candleTwo_Low > params.candleFive_Low && params.candleTwo_High < params.candleFive_High // it should be within the high and low of the first candlestick. 
                                    && params.isCandleOne_Bearish && params.candleOne_Open < params.candleTwo_Close && params.candleOne_Close < params.candleFive_Close;//The last candlestick that completes the pattern should below the close of its preceding candlestick and should close lower that the close of the first candlestick.

    }
    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLSEPARATINGLINES = function () {
    var params = CDLGETPARAMS(this.priceData);

    var isBullishContinuation = (params.candleOne_Open > Math.max(params.candleThree_Open, params.candleThree_Close)) //After an uptrend
                               && params.isCandleTwo_Bearish && (this.indicators.isLongCandle(params.candleTwo_Open, params.candleTwo_High, params.candleTwo_Low, params.candleTwo_Close)) // 1st day is a long red day
                               && params.isCandleOne_Bullish && (this.indicators.isLongCandle(params.candleOne_Open, params.candleOne_High, params.candleOne_Low, params.candleOne_Close))// 2nd day is a long white day
                               && (params.candleOne_Open === params.candleTwo_Open); //2nd day is a white day that opens at the opening price of the 1st day.


    var isBearishContinuation = (params.candleOne_Open < Math.min(params.candleThree_Open, params.candleThree_Close)) //After an downtrend
                               && params.isCandleTwo_Bullish && (this.indicators.isLongCandle(params.candleTwo_Open, params.candleTwo_High, params.candleTwo_Low, params.candleTwo_Close))  // 1st day is a long white day
                               && params.isCandleOne_Bearish && (this.indicators.isLongCandle(params.candleOne_Open, params.candleOne_High, params.candleOne_Low, params.candleOne_Close))// 2nd day is a long red day
                               && (params.candleOne_Open === params.candleTwo_Open); //2nd day is a red day that opens at the opening price of the 1st day.


    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLSHOOTINGSTAR = function () {
    var params = CDLGETPARAMS(this.priceData);

    var candleOneUpperShadow = Math.abs(Math.max(params.candleOne_Open, params.candleOne_Close) - params.candleOne_High),
        candleOneBody = Math.abs(params.candleOne_Open - params.candleOne_Close),
        candleBodySize = Math.abs(params.candleOne_Low - params.candleOne_High),
        candleOneLowerShadow = Math.abs(params.candleOne_Low - Math.min(params.candleOne_Close, params.candleOne_Open)),
        isOpenCloseLowAlmostSame = (candleOneBody < (candleBodySize * 0.40))
        && ((params.candleOne_Low === Math.min(params.candleOne_Open, params.candleOne_Close)) || (candleOneLowerShadow < (candleBodySize * 0.10)));

    var isBearishContinuation = Math.max(params.candleTwo_Close, params.candleTwo_Open) > (Math.max(params.candleThree_Open, params.candleThree_Close))
                               && (Math.max(params.candleOne_Close, params.candleOne_Open) > Math.max(params.candleTwo_Close, params.candleTwo_Open))
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
    var params = CDLGETPARAMS(this.priceData);

    var upperShadow = params.candleOne_High - Math.max(params.candleOne_Open, params.candleOne_Close),
        lowerShadow = Math.min(params.candleOne_Open, params.candleOne_Close) - params.candleOne_Low,
        candleBodySize = Math.abs(params.candleOne_High - params.candleOne_Low),
        realBodySize = Math.abs(params.candleOne_Open - params.candleOne_Close);


    var isBullishContinuation = params.isCandleTwo_Bearish && (params.candleTwo_Close < (Math.min(params.candleThree_Open, params.candleThree_Close)))
                              && params.isCandleOne_Bullish && (params.candleOne_Open < params.candleTwo_Close)
                              && (realBodySize <= (candleBodySize * 0.30)) //It is not too different to a Doji in structure, but rather than a flat body it has a small body between an open and close price
                              && (upperShadow > realBodySize) && (upperShadow < (candleBodySize * 0.50)) // The spinning top is composed of a small body with small upper and lower shadows.
                              && (lowerShadow > realBodySize) && (lowerShadow < (candleBodySize * 0.50));


    var isBearishContinuation = params.isCandleTwo_Bullish && (params.candleTwo_Close > (Math.max(params.candleThree_Open, params.candleThree_Close)))
                              && params.isCandleOne_Bearish && (params.candleOne_Open > params.candleTwo_Close)
                              && (realBodySize <= (candleBodySize * 0.30)) //It is not too different to a Doji in structure, but rather than a flat body it has a small body between an open and close price
                              && (upperShadow > realBodySize) && (upperShadow < (candleBodySize * 0.50)) // The spinning top is composed of a small body with small upper and lower shadows.
                              && (lowerShadow > realBodySize) && (lowerShadow < (candleBodySize * 0.50));

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLSTALLEDPATTERN = function () {
    var params = CDLGETPARAMS(this.priceData);

    var candleThreeBodySize = Math.abs(params.candleThree_Close - params.candleThree_Open),
        candleTwoBodySize = Math.abs(params.candleTwo_Close - params.candleTwo_Open),
        candleOneBodySize = Math.abs(params.candleOne_Close - params.candleOne_Open);


    var isBullishContinuation = params.isCandleThree_Bearish && (this.indicators.isLongCandle(params.candleThree_Open, params.candleThree_High, params.candleThree_Low, params.candleThree_Close))// three candlesticks in a downtrend
                               && params.isCandleTwo_Bearish && (this.indicators.isLongCandle(params.candleTwo_Open, params.candleTwo_High, params.candleTwo_Low, params.candleTwo_Close)) && (params.candleTwo_Open <= params.candleThree_Open) //The second candlestick must open close to the close of the previous day. 
                               && params.isCandleOne_Bearish && (params.candleOne_Open < params.candleTwo_Close)   //must open close to the close of the previous day.
                               //&& (candleOneBodySize < candleMediumHeight * 0.60); //the last candlestick must be short

    var isBearishContinuation = params.isCandleThree_Bullish && (this.indicators.isLongCandle(params.candleThree_Open, params.candleThree_High, params.candleThree_Low, params.candleThree_Close)) // three candlesticks in a downtrend
                               && params.isCandleTwo_Bullish && (this.indicators.isLongCandle(params.candleTwo_Open, params.candleTwo_High, params.candleTwo_Low, params.candleTwo_Close)) && (params.candleTwo_Open >= params.candleThree_Open) //The second candlestick must open close to the close of the previous day. 
                               && params.isCandleOne_Bullish && (params.candleOne_Open > params.candleTwo_Close)   //must open close to the close of the previous day.
                               //&& (candleOneBodySize < candleMediumHeight * 0.60); //the last candlestick must be short

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLSTICKSANDWICH = function () {
    var params = CDLGETPARAMS(this.priceData);
    var isBullishContinuation = false, isBearishContinuation = false;

    if (params.candleFour_Index >= 0) {
        var candleThreebodySize = Math.abs(params.candleThree_Close - params.candleThree_Open);
        var isCanldeOneCloseSameAsCandleThreeClose = (params.candleOne_Close === params.candleThree_Close)
                                          || (params.candleOne_Close <= (params.candleThree_Close + (candleThreebodySize * 0.05)))
                                          || (params.candleOne_Close >= (params.candleThree_Close - (candleThreebodySize * 0.05)));

        var isBullishContinuation = params.isCandleThree_Bearish && (this.indicators.isLongCandle(params.candleThree_Open, params.candleThree_High, params.candleThree_Low, params.candleThree_Close)) && (params.candleThree_Close < (Math.min(params.candleFour_Close, params.candleFour_Open))) //We see a black candlestick on the first day after a downtrend
                                    && params.isCandleTwo_Bullish && (params.candleTwo_Close > params.candleThree_Open) && (params.candleTwo_Open > params.candleThree_Close) && (params.candleTwo_Open < params.candleThree_Open) //The second candlestick is a white (green) candlestick that gaps up from the previous close and closes above the previous day's open
                                    && params.isCandleOne_Bearish && (params.candleOne_Open > params.candleTwo_Close) && (params.candleOne_Close < params.candleTwo_Open) //both of which will have a larger trading range than the middle candlestick.
                                    && (this.indicators.isLongCandle(params.candleOne_Open, params.candleOne_High, params.candleOne_Low, params.candleOne_Close)) && isCanldeOneCloseSameAsCandleThreeClose;//The third day is a black day that closes at or near the close of the first day.

        var isBearishContinuation = params.isCandleThree_Bullish && (this.indicators.isLongCandle(params.candleThree_Open, params.candleThree_High, params.candleThree_Low, params.candleThree_Close)) && (params.candleThree_Close > (Math.max(params.candleFour_Close, params.candleFour_Open))) //We see a white candlestick on the first day after an uptrend
                                    && params.isCandleTwo_Bearish && (params.candleTwo_Close < params.candleThree_Open) && (params.candleTwo_Open < params.candleThree_Close) && (params.candleTwo_Open > params.candleThree_Open)//The second candlestick is a black candlestick that gaps down from the previous close and closes bellow the previous day's open
                                    && params.isCandleOne_Bullish && (params.candleOne_Open < params.candleTwo_Close) && (params.candleOne_Close > params.candleTwo_Open) //both of which will have a larger trading range than the middle candlestick.
                                    && (this.indicators.isLongCandle(params.candleOne_Open, params.candleOne_High, params.candleOne_Low, params.candleOne_Close)) && isCanldeOneCloseSameAsCandleThreeClose;//The third day is a black day that closes at or near the close of the first day.

    }
    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLTAKURI = function () {
    var params = CDLGETPARAMS(this.priceData);

    var lowWick = Math.abs(params.candleOne_Low - Math.min(params.candleOne_Open, params.candleOne_Close)),
        highWick = Math.abs(params.candleOne_High - Math.max(params.candleOne_Open, params.candleOne_Close)),
        candleBodySize = Math.abs(params.candleOne_Low - params.candleOne_High),
        realBodySize = Math.abs(params.candleOne_Open - params.candleOne_Close),
        isOpenCloseHighAlmostSame = ((params.candleOne_Open === params.candleOne_Close) || (realBodySize < (candleBodySize * 0.20)))
        && ((params.candleOne_High === Math.max(params.candleOne_Open, params.candleOne_Close)) || (highWick < (candleBodySize * 0.20))),
        isLowerShadowLong = (lowWick >= (candleBodySize * 0.80));

    var isBullishContinuation = params.isCandleTwo_Bearish //occurs at the bottom of downtrends.
                                && isOpenCloseHighAlmostSame //the open, high, and close are the same or about the same price
                                && isLowerShadowLong;// with a Lower Shadow that is long at least three times the Real Body of the Candle; 

    var isBearishContinuation = params.isCandleTwo_Bullish //occurs at the top of uptrends
                                && isOpenCloseHighAlmostSame //the open, high, and close are the same or about the same price
                                && isLowerShadowLong;// with a Lower Shadow that is long at least three times the Real Body of the Candle; 

    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLTASUKIGAP = function () {
    var params = CDLGETPARAMS(this.priceData);

    var isBullishContinuation = params.isCandleThree_Bullish
                                && params.isCandleTwo_Bullish && params.candleTwo_Open > params.candleThree_Close //gaps above 1st day
                                && params.isCandleOne_Bearish && params.candleOne_Open > params.candleTwo_Open && params.candleOne_Open < params.candleTwo_Close //open inside the red 2day candle's real body.
                                && params.candleOne_Close < params.candleTwo_Open && params.candleOne_Close > params.candleThree_Close;//closes within the gap between the first two bars. 

    var isBearishContinuation = params.isCandleThree_Bearish
                                && params.isCandleTwo_Bearish && params.candleTwo_Open < params.candleThree_Close //gaps below 1st day
                                && params.isCandleOne_Bullish && params.candleOne_Open > params.candleTwo_Close && params.candleOne_Open < params.candleTwo_Open //open inside the red candle's real body.
                                && params.candleOne_Close < params.candleThree_Close && params.candleOne_Close > params.candleTwo_Open;//closes within the gap between the first two bars.

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLTHRUSTING = function () {
    var params = CDLGETPARAMS(this.priceData);

    var isBearishContinuation = params.isCandleTwo_Bearish && (this.indicators.isLongCandle(params.candleTwo_Open, params.candleTwo_High, params.candleTwo_Low, params.candleTwo_Close)) //day-one of the pattern is a long red candle continuing the trend
                                && params.isCandleOne_Bullish && (params.candleOne_Open < params.candleTwo_Close) //Day-two is a blue day
                                && params.candleOne_Close <= (params.candleTwo_Close + (Math.abs(params.candleTwo_Open - params.candleTwo_Close) / 2)) // closes into the body (below midpoint) of the previous day
                                && (params.candleOne_Close >= params.candleTwo_Close);

    var isBullishContinuation = params.isCandleTwo_Bullish && (this.indicators.isLongCandle(params.candleTwo_Open, params.candleTwo_High, params.candleTwo_Low, params.candleTwo_Close))////day-one of the pattern is a long blue candle
                                && params.isCandleOne_Bearish && (params.candleOne_Open > params.candleTwo_Close) //Day-two is a red day
                                && params.candleOne_Close >= (params.candleTwo_Close - (Math.abs(params.candleTwo_Open - params.candleTwo_Close) / 2)) // closes into the body (above midpoint) of the previous day
                                && (params.candleOne_Close <= params.candleTwo_Close);

    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLTRISTAR = function () {
    var params = CDLGETPARAMS(this.priceData);

    var candleThreeDoji = this.CDLDOJI(params.candleThree_Open, params.candleThree_High, params.candleThree_Low, params.candleThree_Close);

    var candleTwoDoji = this.CDLDOJI(params.candleTwo_Open, params.candleTwo_High, params.candleTwo_Low, params.candleTwo_Close);

    var candleOneDoji = this.CDLDOJI(params.candleOne_Open, params.candleOne_High, params.candleOne_Low, params.candleOne_Close);

    var isBullishContinuation = candleThreeDoji.isDoji
                                && candleTwoDoji.isDoji
                                && Math.max(params.candleTwo_Close, params.candleTwo_Open) < Math.min(params.candleThree_Close, params.candleThree_Open)
                                && Math.max(params.candleTwo_Close, params.candleTwo_Open) < Math.min(params.candleOne_Close, params.candleOne_Open)
                                && candleOneDoji.isDoji;

    var isBearishContinuation = candleThreeDoji.isDoji
                                && candleTwoDoji.isDoji
                                && Math.min(params.candleTwo_Close, params.candleTwo_Open) > Math.max(params.candleThree_Close, params.candleThree_Open)
                                && Math.min(params.candleTwo_Close, params.candleTwo_Open) > Math.max(params.candleOne_Close, params.candleOne_Open)
                                && candleOneDoji.isDoji;
    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLUNIQUE3RIVER = function () {
    var params = CDLGETPARAMS(this.priceData);
    var isBullishContinuation = false, isBearishContinuation = false;

        var candleTwoUpperShadow = Math.abs(params.candleTwo_Open - params.candleTwo_High);
        var candleTwoBody = Math.abs(params.candleTwo_Open - params.candleTwo_Close);
        var candleTwoLowerShadow = Math.abs(params.candleTwo_Low - params.candleTwo_Close);
        var candleThreeBody = Math.abs(params.candleThree_Close - params.candleThree_Open);

        var isBullishContinuation = params.isCandleThree_Bearish && (this.indicators.isLongCandle(params.candleThree_Open, params.candleThree_High, params.candleThree_Low, params.candleThree_Close))//The 1st candle has a long and bearish body
                                    && params.isCandleTwo_Bearish && params.candleTwo_Close > params.candleThree_Close && params.candleTwo_Open < params.candleThree_Open && params.candleTwo_Low < params.candleThree_Low //The 2nd candle is a hammer, and its body is inside the 1st bar's body;
                                    && params.isCandleOne_Bullish && params.candleOne_Close < params.candleTwo_Close; //tThe 3rd candle is small and bullish, its Close price is lower than 2nd bar's.

        //It's a bullish candlestick
        var isBearishContinuation = false;
    
    return {
        isBull: isBullishContinuation,
        isBear: isBearishContinuation
    };
}

CDL.prototype.CDLUPSIDEGAP2CROWS = function () {
    var params = CDLGETPARAMS(this.priceData);

    var isBullishContinuation = params.isCandleThree_Bullish && (this.indicators.isLongCandle(params.candleThree_Open, params.candleThree_High, params.candleThree_Low, params.candleThree_Close)) //by a long white candlestick
                                && params.isCandleTwo_Bearish //small black candle with a body
                                && (params.candleTwo_Close > params.candleThree_Close)//  gapping above the prior candle's body.
                                && params.isCandleOne_Bearish && (params.candleOne_Close < params.candleTwo_Close && params.candleOne_Open > params.candleTwo_Open) //opening higher than the Day 2 open, but closing below the Day 2 close
                                && (params.candleOne_Close > params.candleThree_Close);// and above the Day 1 close

    //It's a bullish candlestick
    var isBearishContinuation = false;

    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLXSIDEGAP3METHODS = function () {
    var params = CDLGETPARAMS(this.priceData);

    var isBullishContinuation = params.isCandleThree_Bullish && (this.indicators.isLongCandle(params.candleThree_Open, params.candleThree_High, params.candleThree_Low, params.candleThree_Close)) //Long white
                                && params.isCandleTwo_Bullish && (this.indicators.isLongCandle(params.candleTwo_Open, params.candleTwo_High, params.candleTwo_Low, params.candleTwo_Close)) //Long white
                                && (params.candleTwo_Open > params.candleThree_Close) //gaps above 1st day
                                && params.isCandleOne_Bearish && (params.candleOne_Open > params.candleTwo_Open) && (params.candleOne_Open < params.candleTwo_Close) //The third day opens lower, into the body of the top white (or green) candle 
                                && (params.candleOne_Close < params.candleThree_Close) && (params.candleOne_Close > params.candleThree_Open);//and closes into the body of the first white (or green) candle.

    var isBearishContinuation = params.isCandleThree_Bearish && (this.indicators.isLongCandle(params.candleThree_Open, params.candleThree_High, params.candleThree_Low, params.candleThree_Close)) //Long red
                                && params.isCandleTwo_Bearish && (this.indicators.isLongCandle(params.candleTwo_Open, params.candleTwo_High, params.candleTwo_Low, params.candleTwo_Close))  //Long red
                                && (params.candleTwo_Open < params.candleThree_Close) //gaps below 1st day
                                && params.isCandleOne_Bullish && (params.candleOne_Open < params.candleTwo_Open) && (params.candleOne_Open > params.candleTwo_Close)
                                && (params.candleOne_Close > params.candleThree_Close) && (params.candleOne_Close < params.candleThree_Open);


    return {
        isBear: isBearishContinuation,
        isBull: isBullishContinuation
    };
}

CDL.prototype.CDLHIGHWAVE = function () {
    var params = CDLGETPARAMS(this.priceData);

    var bodySize = Math.abs(params.candleOne_Close - params.candleOne_Open);
    var candleSize = Math.abs(params.candleOne_High - params.candleOne_Low);
    var upperShadow = Math.abs(params.candleOne_High - Math.max(params.candleOne_Open, params.candleOne_Close));
    var lowerShadow = Math.abs(Math.min(params.candleOne_Open, params.candleOne_Close) - params.candleOne_Low);

    var isBearishContinuation = params.isCandleOne_Bearish && (bodySize > (Math.max(upperShadow, lowerShadow) * 0.05))
                                && ((bodySize < (lowerShadow / 3)) && (bodySize < (upperShadow / 3)));//�High Wave� is a candlestick with a small body and long shadows.

    var isBullishContinuation = params.isCandleOne_Bullish && (bodySize > (Math.max(upperShadow, lowerShadow) * 0.05))
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
            var candleOne_Index = this.priceData.length - 1;
            var candleOne_Open = this.priceData[candleOne_Index].open,
                candleOne_High = this.priceData[candleOne_Index].high,
                candleOne_Low = this.priceData[candleOne_Index].low,
                candleOne_Close = this.priceData[candleOne_Index].close;
            var cdlObject = this.CDLMARUBOZU(candleOne_Open, candleOne_High, candleOne_Low, candleOne_Close);
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

CDLGETPARAMS = function (priceData) {
    var candleOne_Index = priceData.length - 1;
    var candleTwo_Index = candleOne_Index - 1;
    var candleThree_Index = candleOne_Index - 2;
    var candleFour_Index = candleOne_Index - 3;
    var candleFive_Index = candleOne_Index - 4;

    var candleParams = {
        candleOne_Open: priceData[candleOne_Index].open,
        candleOne_Close: priceData[candleOne_Index].close,
        candleOne_High: priceData[candleOne_Index].high,
        candleOne_Low: priceData[candleOne_Index].low,
        candleTwo_Open: priceData[candleTwo_Index].open,
        candleTwo_Close: priceData[candleTwo_Index].close,
        candleTwo_High: priceData[candleTwo_Index].high,
        candleTwo_Low: priceData[candleTwo_Index].low,
        candleThree_Open: priceData[candleThree_Index].open,
        candleThree_Close: priceData[candleThree_Index].close,
        candleThree_High: priceData[candleThree_Index].high,
        candleThree_Low: priceData[candleThree_Index].low,
        isCandleOne_Bullish: priceData[candleOne_Index].close > priceData[candleOne_Index].open,
        isCandleOne_Bearish: priceData[candleOne_Index].close < priceData[candleOne_Index].open,
        isCandleTwo_Bullish: priceData[candleTwo_Index].close > priceData[candleTwo_Index].open,
        isCandleTwo_Bearish: priceData[candleTwo_Index].close < priceData[candleTwo_Index].open,
        isCandleThree_Bullish: priceData[candleThree_Index].close > priceData[candleThree_Index].open,
        isCandleThree_Bearish: priceData[candleThree_Index].close < priceData[candleThree_Index].open
    };

    candleParams.candleFour_Index = candleFour_Index;
    if (candleFour_Index >= 0) {
        candleParams.candleFour_Open = priceData[candleFour_Index].open;
        candleParams.candleFour_Close = priceData[candleFour_Index].close;
        candleParams.candleFour_High = priceData[candleFour_Index].high;
        candleParams.candleFour_Low = priceData[candleFour_Index].low;
        candleParams.isCandleFour_Bullish = priceData[candleFour_Index].close > priceData[candleFour_Index].open;
        candleParams.isCandleFour_Bearish = priceData[candleFour_Index].close < priceData[candleFour_Index].open;
    };

    candleParams.candleFive_Index = candleFive_Index;
    if (candleFive_Index >= 0) {
        candleParams.candleFive_Open = priceData[candleFive_Index].open;
        candleParams.candleFive_Close = priceData[candleFive_Index].close;
        candleParams.candleFive_High = priceData[candleFive_Index].high;
        candleParams.candleFive_Low = priceData[candleFive_Index].low;
        candleParams.isCandleFive_Bullish = priceData[candleFive_Index].close > priceData[candleFive_Index].open;
        candleParams.isCandleFive_Bearish = priceData[candleFive_Index].close < priceData[candleFive_Index].open;
    };

    return candleParams;
}