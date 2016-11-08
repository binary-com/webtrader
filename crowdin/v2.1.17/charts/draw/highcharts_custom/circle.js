/**
 * Created by arnab on 4/3/15.
 */
define(['highstock'], function () {

  var isLibraryLoaded = false, currentObject = null;

  return {
      init: function() {

        if (isLibraryLoaded) return;

          (function(H,$) {

            /*
              - When not annnotating, allow dragging of chart or zooming
              - Have to annotate chart where it got triggered from
              TODO
              - check if the drag is inside chart container
              - Glow the object when hover over
              - Should be able to hold and move the objects
              - Change mouse cursor to square when inside the chart area
              - Escape should remove the annotate mode
            */

            // when drawing annotation, don't zoom/select place
            H.wrap(H.Pointer.prototype, 'drag', function(c, e) {
              var chart = this.chart;
              var renderer = chart.renderer;
              if (chart.annotate) {
                var bbox = chart.container.getBoundingClientRect();
                e = chart.pointer.normalize();
                if (currentObject == null) {

                  var startX = e.chartX;
                  // translate my coordinates to pixel values
                  startX = chart.xAxis[0].toPixels(startX)
                  var startY = e.chartY;
                  startY = chart.yAxis[0].toPixels(startY);
                  var endX = startX;
                  var endY = startY;
                  var radius = Math.sqrt(Math.pow(startX - endX, 2) + Math.pow(startY - endY, 2));

                  var seriesGroup = this.chart.series[0].group;
                  currentObject = renderer.circle(startX, startY, radius).attr({
                    'fill'        : 'rgba(255,0,0,0.4)',
                    'stroke'      : 'black',
                    'stroke-width': 2
                  }).add(seriesGroup);
                  $(chart.container).one("mouseup", function() {
                    chart.annotate = false;
                    currentObject = null;
                  });

                } else {

                  var startX = currentObject.attr("cx");
                  var startY = currentObject.attr("cy");
                  var endX = e.chartX;
                  endX = chart.xAxis[0].toPixels(endX);
                  var endY = e.chartY;
                  endY = chart.xAxis[0].toPixels(endY);
                  var radius = Math.sqrt(Math.pow(startX - endX, 2) + Math.pow(startY - endY, 2));
                  currentObject.attr({
                    r : radius
                  });

                }
              }
            	else {
            		c.call(this, e);
            	}
            });

            // update annotations after chart redraw
        		// Highcharts.addEvent(chart, 'redraw', function () {
        		// 	console.log('Redraw called - I am in circle.js!');
        		// });

            isLibraryLoaded = true;

          } (Highcharts,jQuery));

      }
  }

});
