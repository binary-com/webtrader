/**
 * Created by arnab on 3/30/15.
 */

define(['jquery'], function ($) {

    var indicatorBase = {

        OPEN: 0, HIGH: 1, LOW: 2, CLOSE: 3,

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
                            height: ( (topForNextSubWindow + GAP + heightOfEachSubWindow) > 100 ? (100 - topForNextSubWindow - GAP) : heightOfEachSubWindow) + '%',
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

        extractPriceForAppliedTO: function (appliedTO, data, index) {
            var price = 0;
            switch (appliedTO) {
                case indicatorBase.OPEN :
                    price += data[index].open || data[index][1];
                    break;
                case indicatorBase.HIGH :
                    price += data[index].high || data[index][2];
                    break;
                case  indicatorBase.LOW :
                    price += data[index].low || data[index][3];
                    break;
                case indicatorBase.CLOSE :
                    price += data[index].close || data[index][4];
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

        findDataUpdatedDataPoint: function (data, options) {
            var dataPointIndex = -1;
            for (var index = data.length - 1; index >= 1; index--) {
                //Matching time
                if (data[index][0] === options[0] || data[index].x === options[0]) {
                    dataPointIndex = index;
                    break;
                }
            }
            return dataPointIndex;
        }
    };

    return indicatorBase;

});
