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

        //****************************MA****************************************
        calculateMAValue: function (data, maData, index, period, maType, type, key, isPointUpdate, appliedTo) {
            var maValue = null;
            switch (maType) {
                case this.SMA:
                    maValue = this.calculateSMAValue(data, maData, index, period, type, appliedTo);
                    break;
                case this.EMA:
                    maValue = this.calculateEMAValue(data, maData, index, period, type, appliedTo);
                    break;
                case this.WMA:
                    maValue = this.calculateWMAValue(data, index, period, type, appliedTo);
                    break;
                case this.TEMA:
                    maValue = this.calculateTEMAValue(data, index, period, type, key, isPointUpdate, appliedTo)
                    break;
                case this.TRIMA:
                    maValue = this.calculateTRIMAValue(data, maData, index, period, type, appliedTo);
                    break;
            }
            return maValue;
        },

        //*************************SMA***************************************
        calculateSMAValue: function (data, maData, index, period, type, appliedTo) {
            //Calculate SMA data
            /*
                Daily Closing Prices: 11,12,13,14,15,16,17
                First day of 5-day SMA: (11 + 12 + 13 + 14 + 15) / 5 = 13
                Second day of 5-day SMA: (12 + 13 + 14 + 15 + 16) / 5 = 14
                Third day of 5-day SMA: (13 + 14 + 15 + 16 + 17) / 5 = 15

                Do not fill any value in smaData from 0 index to options.period-1 index
             */
            if (index < period - 1) {
                return null;
            }
            else if (index >= (period - 1)) {
                //This is the slowest method of calculating SMA. TODO
                //Reviewing it later while working on task https://trello.com/c/3zXWZcNW/256-review-the-calculation-of-all-ma-types-make-sure-that-they-are-matching-with-whats-in-tradingview-binary-com
                var sum = 0.0;
                for (var i = period - 1; i >= 0; i--) {
                    sum += this.getPrice(data, index - i, appliedTo, type);
                }
                return (sum / period);
            }
        },

        //*************************EMA***************************************
        calculateEMAValue: function (data, maData, index, period, type, appliedTo) {
            //Calculate EMA data
            /*  ema(t) = p(t) * 2/(T+1) + ema(t-1) * (1 - 2 / (T+1))
             *  Do not fill any value in emaData from 0 index to options.period-1 index
             */
            if (index < period - 1) {
                return null;
            }
            else if (index === period - 1) {
                var sum = 0;
                for (var i = 0 ; i < period ; i++) {
                    sum += this.getPrice(data, i, appliedTo, type);
                }
                return sum / period;
            }
            else {
                //Calculate EMA - start
                //ema(t) = p(t) * 2/(T+1) + ema(t-1) * (1 - 2 / (T+1))
                var preEma = maData[index - 1][1] || maData[index - 1].y;
                var price = this.getPrice(data, index, appliedTo, type);
                //console.log(preEma, price);
                return (price * 2 / (period + 1)) + (preEma * (1 - 2 / (period + 1)));
            }
        },

        //*************************TEMA*****************************************
        calculateTEMAValue: function (data, index, period, type, key, isPointUpdate, appliedTo) {
            //Calculate TEMA data
            /*
             The Triple Exponential Moving Average (TEMA) of time series 't' is:
             *      EMA1 = EMA(t,period)
             *      EMA2 = EMA(EMA1,period)
             *      EMA3 = EMA(EMA2,period))
             *      TEMA = 3*EMA1 - 3*EMA2 + EMA3
             * Do not fill any value in temaData from 0 index to options.period-1 index
             */
            var time = (data[index].x || data[index][0]);
            if (!ema1[key]) {
                ema1[key] = [], ema2[key] = [], ema3[key] = [];
                //*If it hasn't been called for index zero to period-1
                if (index === period - 1) {
                    for (var i = 0; i < period - 1; i++) {
                        ema1[key].push([time, null]);
                        ema2[key].push([time, null]);
                        ema3[key].push([time, null]);
                    }
                }
            };

            var price = this.getPrice(data, index, appliedTo, type);

            var ema1Value = this.calculateEMAValue(data, ema1[key], index, period, type, appliedTo);  //(price * 2 / (period + 1)) + (ema1[key][index - 1][1] * (1 - 2 / (period + 1)))
            if (isPointUpdate) {
                ema1[key][index] = [time, ema1Value];
            }
            else {
                ema1[key].push([time, ema1Value]);
            }

            var ema2Value = this.calculateEMAValue(ema1[key], ema2[key], index, period, type, appliedTo);  //(ema1Value * 2 / (period + 1)) + (ema2[key][index - 1][1] * (1 - 2 / (period + 1)))

            if (isPointUpdate) {
                ema2[key][index] = [time, ema2Value];
            }
            else {
                ema2[key].push([time, ema2Value]);
            }

            var ema3Value = this.calculateEMAValue(ema2[key], ema3[key], index, period, type, appliedTo); //(ema2Value * 2 / (period + 1)) + (ema3[key][index - 1][1] * (1 - 2 / (period + 1)));

            if (isPointUpdate) {
                ema3[key][index] = [time, ema3Value];
            }
            else {
                ema3[key].push([time, ema3Value]);
            }

            var temaValue = 3 * ema1Value - 3 * ema2Value + ema3Value;

            return temaValue;
        },

        //*************************WMA*****************************************
        calculateWMAValue: function (data, index, period, type, appliedTo) {
            //Calculate WMA data
            /*
            WMA = ( Price * n + Price(1) * n-1 + ... Price( n-1 ) * 1) / ( n * ( n + 1 ) / 2 )
            Where: n = time period
            *
            *  Do not fill any value in wmaData from 0 index to options.period-1 index
            */
            if (index < period - 1) {
                return null;
            }
            else {
                //Calculate WMA - start
                var wmaValue = 0;
                for (var subIndex = index, count = period; subIndex >= 0 && count >= 0; count--, subIndex--) {
                    var price = this.getPrice(data, subIndex, appliedTo, type);
                    wmaValue += price * count;
                }
            }
            return wmaValue / (period * (period + 1) / 2);
            //Calculate WMA - end
        },

        //*************************TRIMA******************************************
        calculateTRIMAValue: function (data, maData, index, period, type, appliedTo) {
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
            var Nm = Math.round((period + 1) / 2);
            if (index < (Nm - 1)) {
                return null;
            }
            else if (index === Nm - 1) {
                var sum = 0;
                for (var subIndex = 0; subIndex < Nm; subIndex++) {
                    sum += this.getPrice(data, subIndex, appliedTo, type);
                }
                return sum / Nm;
            }
            else {
                var price = this.getPrice(data, index, appliedTo, type);
                var preTrima = maData[index - 1][1] || maData[index - 1].y;
                return (preTrima * (Nm - 1) + price) / Nm;
            }
        }


    };

    return indicatorBase;

});
