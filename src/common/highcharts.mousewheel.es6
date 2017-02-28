/**
 * Created by arnab on 6/30/16.
 */
import $ from 'jquery';
import _ from 'lodash';
import 'highstock';
import './util';

export const mousewheel = (containerIdWitHash) => {
   $(containerIdWitHash).bind('DOMMouseScroll mousewheel', function(e) {
      e.preventDefault();
      const chart = $(this).highcharts();
      const xAxis = chart.xAxis[0];
      const extremes = xAxis.getExtremes();
      //console.log(e.originalEvent.wheelDelta);
      //Each turn is around 120. We will show one candle per 120
      //e.originalEvent.detail is for firefox.
      const noOfCandles = 4 * e.originalEvent.wheelDelta /120 | e.originalEvent.detail | 0;
      const timePeriodInMillis = convertToTimeperiodObject($(this).data('timePeriod')).timeInMillis() || 1000;
      //console.log(noOfCandles);
      //If its positive, then move up
      if(noOfCandles > 0) {
         const newMin = (extremes.min - timePeriodInMillis * Math.abs(noOfCandles));
         if (newMin > extremes.dataMin) {
            xAxis.setExtremes(newMin, extremes.max);
         }
      }
      else {
         const newMin = (extremes.min + timePeriodInMillis * Math.abs(noOfCandles));
         if (newMin < extremes.dataMax) {
            xAxis.setExtremes(newMin, extremes.max);
         }
      }
   });
}

export default {
   mousewheel
};

