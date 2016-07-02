/**
 * Created by arnab on 6/30/16.
 */
define(['jquery', 'lodash', 'moment', 'highstock', 'common/util'], function($) {

    return {
        mousewheel : function (containerIdWitHash) {
            $(containerIdWitHash).bind('DOMMouseScroll mousewheel', function(e){
                var chart = $(this).highcharts();
                var xAxis = chart.xAxis[0];
                var extremes = xAxis.getExtremes();
                //console.log(e.originalEvent.wheelDelta);
                //Each turn is around 120. We will show one candle per 120
                var noOfCandles = 4 * e.originalEvent.wheelDelta /120 | 0;
                //console.log(noOfCandles);
                //If its positive, then move up
                if(noOfCandles > 0) {
                    /*console.log('Min', moment(extremes.min).format("YYYY-MM-DD"),
                                'Max', moment(extremes.max).format("YYYY-MM-DD"),
                                'Data Min', moment(extremes.dataMin).format("YYYY-MM-DD"),
                                'Data Max', moment(extremes.dataMax).format("YYYY-MM-DD"),
                                'User Min', moment(extremes.userMin).format("YYYY-MM-DD"),
                                'User Max', moment(extremes.userMax).format("YYYY-MM-DD"),
                                '[0]', moment(data[0].time).format("YYYY-MM-DD"),
                                '[data.length - 1]', moment(data[data.length - 1].time).format("YYYY-MM-DD"));*/
                    var newMin = extremes.min - convertToTimeperiodObject($(this).data('timePeriod')).timeInMillis() * Math.abs(noOfCandles);
                    if (newMin > extremes.dataMin) {
                        xAxis.setExtremes(newMin, extremes.max);
                    }
                }
                else {
                    var newMin = extremes.min + convertToTimeperiodObject($(this).data('timePeriod')).timeInMillis() * Math.abs(noOfCandles);
                    if (newMin < extremes.dataMax) {
                        xAxis.setExtremes(newMin, extremes.max);
                    }
                }
            });
        }
    };

});
