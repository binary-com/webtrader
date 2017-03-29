/**
 * Created by arnab on 6/30/16.
 */
import $ from 'jquery';
import _ from 'lodash';
import 'highstock';
import './util';



export const mousewheel = (containerIdWitHash) => {
   let noOfCandles = 0,
       scrollTimer = null;
   const chart = $(containerIdWitHash).highcharts();
   const timePeriodInMillis = convertToTimeperiodObject($(containerIdWitHash).data('timePeriod')).timeInMillis() || 1000;
   const xAxis = chart.xAxis[0];

   $(containerIdWitHash).unbind('DOMMouseScroll mousewheel').bind('DOMMouseScroll mousewheel', function(e) {
      e.preventDefault();
      //console.log(e.originalEvent.wheelDelta);
      //Each turn is around 120. We will show one candle per 120
      //e.originalEvent.detail is for firefox.
      noOfCandles += 4 * e.originalEvent.wheelDelta /120 | e.originalEvent.detail | 0;
      if(scrollTimer)
        clearTimeout(scrollTimer); //Clearing previously pending timers;
      scrollTimer = setTimeout(setNewExtremes,50);
   });

   function setNewExtremes() {
        console.log("called");
      const extremes = xAxis.getExtremes();
      //If its positive, then move up
      if(noOfCandles > 0) {
         const newMin = (extremes.min - timePeriodInMillis * Math.abs(noOfCandles));
         if (newMin > extremes.dataMin) {
            xAxis.setExtremes(newMin, extremes.max);
         } else {
             xAxis.setExtremes(extremes.dataMin, extremes.max);
         }
      }
      else {
         const newMin = (extremes.min + timePeriodInMillis * Math.abs(noOfCandles));
         if (newMin < extremes.dataMax) {
            xAxis.setExtremes(newMin, extremes.max);
         } else {
            xAxis.setExtremes(extremes.dataMax, extremes.max);             
         }
      }
      noOfCandles = 0;
   }
}

export default {
   mousewheel
};

