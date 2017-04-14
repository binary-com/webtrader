/**
 * Created by arnab on 4/3/15.
 */
import H from 'highstock';
import $ from 'jquery';

let isLibraryLoaded = false,
   currentObject = null;

export const init = function() {

   if (isLibraryLoaded) return;
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
      const chart = this.chart;
      const renderer = chart.renderer;
      if (chart.annotate) {
         const bbox = chart.container.getBoundingClientRect();
         e = chart.pointer.normalize();
         if (currentObject == null) {

            let startX = e.chartX;
            // translate my coordinates to pixel values
            startX = chart.xAxis[0].toPixels(startX)
            let startY = e.chartY;
            startY = chart.yAxis[0].toPixels(startY);
            const endX = startX;
            const endY = startY;
            const radius = Math.sqrt(Math.pow(startX - endX, 2) + Math.pow(startY - endY, 2));

            const seriesGroup = this.chart.series[0].group;
            currentObject = renderer.circle(startX, startY, radius).attr({
               'fill': 'rgba(255,0,0,0.4)',
               'stroke': 'black',
               'stroke-width': 2
            }).add(seriesGroup);
            $(chart.container).one("mouseup", function() {
               chart.annotate = false;
               currentObject = null;
            });

         } else {

            const startX = currentObject.attr("cx");
            const startY = currentObject.attr("cy");
            let endX = e.chartX;
            endX = chart.xAxis[0].toPixels(endX);
            let endY = e.chartY;
            endY = chart.xAxis[0].toPixels(endY);
            const radius = Math.sqrt(Math.pow(startX - endX, 2) + Math.pow(startY - endY, 2));
            currentObject.attr({
               r: radius
            });

         }
      } else {
         c.call(this, e);
      }
   });

   // update annotations after chart redraw
   // Highcharts.addEvent(chart, 'redraw', function () {
   //   console.log('Redraw called - I am in circle.js!');
   // });

   isLibraryLoaded = true;

}

export default {
  init
}
