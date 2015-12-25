/**
 * Created by arnab on 3/30/15.
 */

define(['jquery'], function ($) {

    var ema1 = [], ema2 = [], ema3 = [];

    var indicatorBase = {

        OPEN: 0, HIGH: 1, LOW: 2, CLOSE: 3,
        SMA: "SMA", EMA: "EMA", WMA: "WMA", TEMA: "TEMA", TRIMA: "TRIMA",

        /*
         * Function to find out if it contains OHLC values
         */
        isOHLCorCandlestick: function (type) {
            return type == 'candlestick' || type == 'ohlc';
        },

        /*
         * Function to recalculate heights of different sections in a chart
         */
        recalculate: function (chart) {
            var GAP = 1;
            var totalYAxes = chart.yAxis.length;
            totalYAxes--;//Excluding main chart
            totalYAxes--;//Excluding navigator chart
            var heightOfEachSubWindow = Math.round(45 / totalYAxes);
            var topForNextSubWindow = 0;

            if (totalYAxes <= 0) {
                //assign all space to the main chart
                chart.yAxis[0].update({
                    top: '0%',
                    height: '100%'
                }, false);
            }
            else {
                $.each(chart.yAxis, function (index, current_yAxis) {
                    //Main chart - Keeping it at 50%
                    if (index == 0) {
                        current_yAxis.update({
                            top: '0%',
                            height: '50%'
                        }, false);
                        topForNextSubWindow += 50;
                    }
                        //Ignore navigator axis
                    else if (current_yAxis.options && current_yAxis.options.id && current_yAxis.options.id.toLowerCase().indexOf('navigator') != -1) {
                    }
                    else {
                        //I am dividing remaining 45% among all subwindows. If its crossing 100%, the last window will get what is possible out of left over from 100%
                        current_yAxis.update({
                            top: (topForNextSubWindow + GAP) + '%',
                            height: ((topForNextSubWindow + GAP + heightOfEachSubWindow) > 100 ? (100 - topForNextSubWindow - GAP) : heightOfEachSubWindow) + '%',
                            offset: 0
                        }, false);
                        topForNextSubWindow += GAP + heightOfEachSubWindow;
                    }
                });
            }
        },

        appliedPriceString: function (intValue) {
            var ret = 'CLOSE';
            switch (intValue) {
                case indicatorBase.OPEN:
                    ret = 'OPEN';
                    break;
                case indicatorBase.HIGH:
                    ret = 'HIGH';
                    break;
                case indicatorBase.LOW:
                    ret = 'LOW';
                    break;
                case indicatorBase.CLOSE:
                    ret = 'CLOSE';
                    break;
            }
            return ret;
        },

        /**
         * @param appliedTO
         * @param data
         * @param index
         * @returns {number}
         */
        extractPriceForAppliedTO: function (appliedTO, data, index) {
            var price = 0.0;
            switch (appliedTO) {
                case indicatorBase.OPEN:
                    price = data[index].open || data[index][1];
                    break;
                case indicatorBase.HIGH:
                    price = data[index].high || data[index][2];
                    break;
                case indicatorBase.LOW:
                    price = data[index].low || data[index][3];
                    break;
                case indicatorBase.CLOSE:
                    price = data[index].close || data[index][4];
                    break;
            }
            return price;
        },

        extractPrice: function (data, index) {
            return data[index][4] || data[index].close || data[index][1] || data[index].y;
        },

        toFixed: function (value, precision) {
            if ($.isNumeric(value)) {
                value = Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
            }
            return value;
        },

        checkCurrentSeriesHasIndicator: function (optionsMap, currentSeriesID) {
            var ret = false;
            if (optionsMap && currentSeriesID) {
                $.each(optionsMap, function (key, value) {
                    if (value && value.parentSeriesID == currentSeriesID) {
                        ret = true;
                        return false;
                    }
                });
            }
            return ret;
        },

        findIndexInDataForTime: function (data, time) {
            var dataPointIndex = -1;
            for (var index = data.length - 1; index >= 1; index--) {
                //Matching time
                if ((data[index][0] || data[index].x) === time) {
                    dataPointIndex = index;
                    break;
                }
            }
            return dataPointIndex;
        },

        isDoji: function (options) {
            if (options && options.open && options.high && options.low && options.close) {
                var isOpenCloseSame = (options.open == options.close),
                        differenceBet_Open_High = Math.abs(options.open - options.high),
                        differenceBet_Open_Low = Math.abs(options.open - options.low),
                        candleBodySize = Math.abs(options.low - options.high);

                //Either open and close is same or difference between Open and Close is 1% of the total size of candle
                var isBearishContinuation = (isOpenCloseSame || ((candleBodySize * 0.10) >= Math.abs(options.open - options.close)))
                                  && differenceBet_Open_High < differenceBet_Open_Low;

                var isBullishContinuation = (isOpenCloseSame || ((candleBodySize * 0.10) >= Math.abs(options.open - options.close)))
                                  && differenceBet_Open_High > differenceBet_Open_Low;
            }
            return {
                isBull: isBullishContinuation,
                isBear: isBearishContinuation
            };
        },


        //**Moving Average Types Calculations
        getPrice: function (data, index, appliedTo, type) {
            if (this.isOHLCorCandlestick(type)) {
                return this.extractPriceForAppliedTO(appliedTo, data, index);
            }
            else {
                return this.extractPrice(data, index);
            }
        },

        getIndicatorData: function (data, index) {
            return data[index][1] || data[index].y || null;
        },

        //****************************MA****************************************
        calculateMAValue: function (maOptions) {
            //maOptions contains:
            //    data: tpData[key],
            //    maData: maData[key],
            //    index: index,
            //    period: period,
            //    maType: maType,
            //    type: type,
            //    key: key,
            //    isPointUpdate: isPointUpdate,
            //    appliedTo: null,
            //    isIndicatorData: true
            var maValue = null;
            switch (maOptions.maType) {
                case this.SMA:
                    maValue = this.calculateSMAValue(maOptions);
                    break;
                case this.EMA:
                    maValue = this.calculateEMAValue(maOptions);
                    break;
                case this.WMA:
                    maValue = this.calculateWMAValue(maOptions);
                    break;
                case this.TEMA:
                    maValue = this.calculateTEMAValue(maOptions)
                    break;
                case this.TRIMA:
                    maValue = this.calculateTRIMAValue(maOptions);
                    break;
            }
            return maValue;
        },

        //*************************SMA***************************************
        calculateSMAValue: function (maOptions) {
            //Calculate SMA data
            /*
                Daily Closing Prices: 11,12,13,14,15,16,17
                First day of 5-day SMA: (11 + 12 + 13 + 14 + 15) / 5 = 13
                Second day of 5-day SMA: (12 + 13 + 14 + 15 + 16) / 5 = 14
                Third day of 5-day SMA: (13 + 14 + 15 + 16 + 17) / 5 = 15

                Do not fill any value in smaData from 0 index to options.period-1 index
             */
            if (maOptions.index < maOptions.period - 1) {
                return null;
            }
            else if (maOptions.index >= (maOptions.period - 1)) {
                //This is the slowest method of calculating SMA. TODO
                //Reviewing it later while working on task https://trello.com/c/3zXWZcNW/256-review-the-calculation-of-all-ma-types-make-sure-that-they-are-matching-with-whats-in-tradingview-binary-com
                var sum = 0.0;
                for (var i = maOptions.period - 1; i >= 0; i--) {
                    if (maOptions.isIndicatorData)
                        sum += this.getIndicatorData(maOptions.data, maOptions.index-i);
                    else
                        sum += this.getPrice(maOptions.data, maOptions.index-i, maOptions.appliedTo, maOptions.type);
                }
                return (sum / maOptions.period);
            }
//            else {
//                //var price = this.getPrice(data, index, appliedTo, type);
//                //var preSma = typeof maData[index - 1] === "number" ? maData[index - 1] : (maData[index - 1][1] || maData[index - 1].y);
//                //preSma = preSma ? preSma : null;
//                //return (preSma * (period - 1) + price) / period;
//                var price = this.getPrice(data, index, appliedTo, type);
//                var dropPrice = this.getPrice(data, index - period, appliedTo, type);
//                var preSma = typeof maData[index - 1] === "number" ? maData[index - 1] : (maData[index - 1][1] || maData[index - 1].y);
//                preSma = preSma ? preSma : null;
//                return preSma + (price / period) - (dropPrice / period);
//=======
//                return (sum / maOptions.period);
//>>>>>>> upstream/development
//            }
        },

        //*************************EMA***************************************
        calculateEMAValue: function (maOptions) {
            //Calculate EMA data
            /*  ema(t) = p(t) * 2/(T+1) + ema(t-1) * (1 - 2 / (T+1))
             *  Do not fill any value in emaData from 0 index to options.period-1 index
             */
            if (maOptions.index < maOptions.period - 1) {
                return null;
            }
            else if (maOptions.index === maOptions.period - 1) {
                var sum = 0;
                for (var i = 0 ; i < maOptions.period ; i++) {
                    if (maOptions.isIndicatorData)
                        sum += this.getIndicatorData(maOptions.data, i);
                    else
                        sum += this.getPrice(maOptions.data, i, maOptions.appliedTo, maOptions.type);
                }
                return sum / maOptions.period;
            }
            else {
                //Calculate EMA - start
                //ema(t) = p(t) * 2/(T+1) + ema(t-1) * (1 - 2 / (T+1))
                var preEma = this.getIndicatorData(maOptions.maData, maOptions.index - 1);
                var price = 0;
                if (maOptions.isIndicatorData)
                    price = this.getIndicatorData(maOptions.data, maOptions.index);
                else
                    price = this.getPrice(maOptions.data, maOptions.index, maOptions.appliedTo, maOptions.type);
                return (price * 2 / (maOptions.period + 1)) + (preEma * (1 - 2 / (maOptions.period + 1)));
            }
        },

        //*************************TEMA*****************************************
        calculateTEMAValue: function (maOptions) {
            //Calculate TEMA data
            /*
             The Triple Exponential Moving Average (TEMA) of time series 't' is:
             *      EMA1 = EMA(t,period)
             *      EMA2 = EMA(EMA1,period)
             *      EMA3 = EMA(EMA2,period))
             *      TEMA = 3*EMA1 - 3*EMA2 + EMA3
             * Do not fill any value in temaData from 0 index to options.period-1 index
             */
            var time = (maOptions.data[maOptions.index].x || maOptions.data[maOptions.index][0]);
            if (!ema1[maOptions.key]) {
                ema1[maOptions.key] = [], ema2[maOptions.key] = [], ema3[maOptions.key] = [];
                //*If it hasn't been called for index zero to period-1
                if (maOptions.index === maOptions.period - 1) {
                    for (var i = 0; i < maOptions.period - 1; i++) {
                        ema1[maOptions.key].push([time, null]);
                        ema2[maOptions.key].push([time, null]);
                        ema3[maOptions.key].push([time, null]);
                    }
                }
            };

            var ma1Options = {
                data: maOptions.data,
                maData: ema1[maOptions.key],
                index: maOptions.index,
                period: maOptions.period,
                type: maOptions.type,
                appliedTo: maOptions.appliedTo,
                isIndicatorData: maOptions.isIndicatorData || false
            };
            var ema1Value = this.calculateEMAValue(ma1Options);
            if (maOptions.isPointUpdate) {
                ema1[maOptions.key][maOptions.index] = [time, ema1Value];
            }
            else {
                ema1[maOptions.key].push([time, ema1Value]);
            }

            var ma2Options = {
                data: ema1[maOptions.key],
                maData: ema2[maOptions.key],
                index: maOptions.index,
                period: maOptions.period,
                type: maOptions.type,
                appliedTo: maOptions.appliedTo,
                isIndicatorData: true
            };
            var ema2Value = this.calculateEMAValue(ma2Options);

            if (maOptions.isPointUpdate) {
                ema2[maOptions.key][maOptions.index] = [time, ema2Value];
            }
            else {
                ema2[maOptions.key].push([time, ema2Value]);
            }

            var ma3Options = {
                data: ema2[maOptions.key],
                maData: ema3[maOptions.key],
                index: maOptions.index,
                period: maOptions.period,
                type: maOptions.type,
                appliedTo: maOptions.appliedTo,
                isIndicatorData: true
            };
            var ema3Value = this.calculateEMAValue(ma3Options);

            if (maOptions.isPointUpdate) {
                ema3[maOptions.key][maOptions.index] = [time, ema3Value];
            }
            else {
                ema3[maOptions.key].push([time, ema3Value]);
            }

            var temaValue = 3 * ema1Value - 3 * ema2Value + ema3Value;

            return temaValue;
        },

        //*************************WMA*****************************************
        calculateWMAValue: function (maOptions) {
            //Calculate WMA data
            /*
            WMA = ( Price * n + Price(1) * n-1 + ... Price( n-1 ) * 1) / ( n * ( n + 1 ) / 2 )
            Where: n = time period
            *
            *  Do not fill any value in wmaData from 0 index to options.period-1 index
            */
            if (maOptions.index < maOptions.period - 1) {
                return null;
            }
            else {
                //Calculate WMA - start
                var wmaValue = 0;
                for (var subIndex = maOptions.index, count = maOptions.period; subIndex >= 0 && count >= 0; count--, subIndex--) {
                    var price = 0;
                    if (maOptions.isIndicatorData)
                        price = this.getIndicatorData(maOptions.data, subIndex);
                    else
                        price = this.getPrice(maOptions.data, subIndex, maOptions.appliedTo, maOptions.type);
                    wmaValue += price * count;
                }
            }
            return wmaValue / (maOptions.period * (maOptions.period + 1) / 2);
            //Calculate WMA - end
        },

        //*************************TRIMA******************************************
        calculateTRIMAValue: function (maOptions) {
            //Calculate TRIMA data
            /*

                 MA = ( SMA ( SMAm, Nm ) ) / Nm

                 Where:

                 N = Time periods + 1
                 Nm = Round ( N / 2 )
                 SMAm = ( Sum ( Price, Nm ) ) / Nm
             *
             *  Do not fill any value in trimaData from 0 index to options.period-1 index

             */
            var Nm = Math.round((maOptions.period + 1) / 2);
            if (maOptions.index < (Nm - 1)) {
                return null;
            }
            else if (maOptions.index === Nm - 1) {
                var sum = 0;
                for (var subIndex = 0; subIndex < Nm; subIndex++) {
                    if (maOptions.isIndicatorData)
                        sum += this.getIndicatorData(maOptions.data, subIndex);
                    else
                        sum += this.getPrice(maOptions.data, subIndex, maOptions.appliedTo, maOptions.type);
                }
                return sum / Nm;
            }
            else {
                var price = 0;
                if (maOptions.isIndicatorData)
                    price = this.getIndicatorData(maOptions.data, maOptions.index);
                else
                    price = this.getPrice(maOptions.data, maOptions.index, maOptions.appliedTo, maOptions.type);
                var preTrima = this.getIndicatorData(maOptions.maData, maOptions.index - 1);
                return (preTrima * (Nm - 1) + price) / Nm;
            }
        }
    };

    return indicatorBase;

});
