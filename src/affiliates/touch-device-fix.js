/**
 * This file should be removed when we upgrade to Highstocks 4.2.6
 * */
function fixTouchEvent() {
  "use strict";
  // Check if the touch event is for zooming.
  var isPinch = false;
  //Check if the touch event started from inside the chart. If the event is not started inside the chart pinchDown is undefined.
  var wasInsideChart = false;
  Highcharts.wrap(Highcharts.Pointer.prototype, "touch", function(proceed, options) {
    var chart = this.chart, 
        isInsidePlot = chart.isInsidePlot(options.chartX - chart.plotLeft, options.chartY - chart.plotTop);

    if(isInsidePlot && !wasInsideChart && options.type == "touchstart"){
      wasInsideChart = true;
    }
    if(!isInsidePlot){
      wasInsideChart = false;
    }
    if(this.pinchDown.length >1){
      isPinch = true;
    }
    if((isPinch || options.type =="touchmove") && this.pinchDown.length == 0){
      isPinch = false;
      return;
    }
    if(wasInsideChart)
      proceed.call(this, options);
  });
}
