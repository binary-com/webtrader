/**
 * Created by Mahboob.M on 12/17/2015.
 */

define(['jquery', 'indicator_base'], function ($, indicatorBase) {

    var ema1 = [], ema2 = [], ema3 = [];

    var maTypeService = {

        SMA: "SMA", EMA: "EMA", WMA: "WMA", TEMA: "TEMA", TRIMA: "TRIMA",
       
        /*
         * Function to return price
         */
        getPrice: function (data, index, appliedTo, type) {
            if (typeof data[index] === 'number') {
                return data[index];
            }
            else if (data[index].length === 2) {
                return data[index][1] || data[index].y;
            }
            else if (indicatorBase.isOHLCorCandlestick(type)) {
                return indicatorBase.extractPriceForAppliedTO(appliedTo, data, index);
            }
            else {
                return indicatorBase.extractPrice(data, index);
            }
        },

        //****************************MA****************************************
        calculateMAValue: function (data, maData, index, period, maType, type, key, isPointUpdate, appliedTo)
        {
            var maValue=null;
            switch(maType)
            {
                case this.SMA:
                    maValue=this.calculateSMAValue(data,maData,index,period,type,appliedTo);
                    break;
                case this.EMA:
                    maValue=this.calculateEMAValue(data,maData,index,period,type,appliedTo);
                    break;
                case this.WMA:
                    maValue=this.calculateWMAValue(data,index,period,type,appliedTo);
                    break;
                case this.TEMA:
                    maValue = this.calculateTEMAValue(data, index, period, type, key, isPointUpdate,appliedTo)
                    break;
                case this.TRIMA:
                    maValue=this.calculateTRIMAValue(data,maData,index,period,type,appliedTo);
                    break;
            }
            return maValue;
        },
        /*
         * Function to calculate Single Moving Average
         */
        //*************************SMA***************************************
        calculateSMAValue: function (data, smaData, index, period, type, appliedTo) {
            if (index < period - 1) {
                return null;
            }
            else if (index === (period - 1)) {
                var sum = 0.0;
                for (var i = 0; i < period; i++) {
                    sum += this.getPrice(data, i, appliedTo, type);
                }
                return (sum / period);
            }
            else {
                var price = this.getPrice(data, index, appliedTo, type);
                //Calculate SMA - start
                var preSma = smaData[index - 1].length ? smaData[index - 1][1] : smaData[index - 1];
                return (preSma * (period - 1) + price) / period;
                //Calculate SMA - end
            }
        },

        //*************************EMA***************************************
        calculateEMAValue: function(data,emaData,index,period,type,appliedTo)
        {
            if(index<period-1)
            { 
                return null;
            }
            else if(index === period-1)
            {
                var sum = 0;
                for (var i = 0 ; i<period ; i++)
                {
                    sum += this.getPrice(data, i, appliedTo, type) || 0;
                }
                return sum/period;
            }
            else
            {
                //Calculate EMA - start
                //ema(t) = p(t) * 2/(T+1) + ema(t-1) * (1 - 2 / (T+1))
                var preEma = emaData[index-1].length?emaData[index-1][1]:emaData[index-1];
                var price = this.getPrice(data,index,appliedTo,type);
                return (price * 2 / (period + 1)) + (preEma * (1 - 2 / (period + 1)));
            }
        },

        //*************************TEMA*****************************************
        calculateTEMAValue: function (data, index, period, type, key, isPointUpdate, appliedTo) {

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
        calculateTRIMAValue: function (data, trimaData, index, period, type, appliedTo) {
            var Nm = Math.round(period + 1 / 2);
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
                var preTrima = trimaData[index - 1].length ? trimaData[index - 1][1] : trimaData[index - 1];
                return (preTrima * (Nm - 1) + price) / Nm;
            }
        }

    };

    return maTypeService;

});