/**
 * Created by arnab on 6/30/16.
 */
define(['jquery', 'lodash', 'highstock', 'common/util'], function($, _) {

    return {
        mousewheel : function (containerIdWitHash) {
            $(containerIdWitHash).bind('DOMMouseScroll mousewheel', function(e){
                e.preventDefault();
                var chart = $(this).highcharts();
                var xAxis = chart.xAxis[0];
                var extremes = xAxis.getExtremes();
                //console.log(e.originalEvent.wheelDelta);
                //Each turn is around 120. We will show one candle per 120
                //e.originalEvent.detail is for firefox.
                var noOfCandles = 4 * e.originalEvent.wheelDelta /120 | e.originalEvent.detail | 0;
                var timePeriodInMillis = convertToTimeperiodObject($(this).data('timePeriod')).timeInMillis() || 1000;
                //console.log(noOfCandles);
                //If its positive, then move up
                if(noOfCandles > 0) {
                    var newMin = (extremes.min - timePeriodInMillis * Math.abs(noOfCandles));
                    if (newMin > extremes.dataMin) {
                        xAxis.setExtremes(newMin, extremes.max);
                    }
                }
                else {
                    var newMin = (extremes.min + timePeriodInMillis * Math.abs(noOfCandles));
                    if (newMin < extremes.dataMax) {
                        xAxis.setExtremes(newMin, extremes.max);
                    }
                }
            });
        }
    };

});
