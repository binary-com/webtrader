/**
 * Created by Ankit on 15 March 2016.
 */
define(['highstock', 'charts/draw/highcharts_custom/DrawingBase'], function() {



    return {
        init: function(chartID) {

            // if (!window['LinePath']) return;

            /*    -----------------------------------------------PATH----------------------------------------------------------*/
            LinePath = function(chartID, options) {
                DrawTool.call(this, 'LinePath', chartID, options);
                this.drawOnce = true;
                this.isDraggable = true;
            };
            LinePath.prototype = Object.create(DrawTool.prototype);
            LinePath.prototype.constructor = LinePath;

            LinePath.prototype.addEventhandlers = function(drawOptions) {

                this.drawOptions = this.drawOptions || drawOptions || this.getDefaultDrawOptions();
                this.drawOptions.id = this.toolID;
                this.bindDrag(null, this.create);
            };

            LinePath.prototype.create = function() {
                var chartID = this.chartID,
                    renderer = this.chartRef.renderer || $(chartID).highcharts().renderer,
                    self = this;

                var drawOptions = $.extend({}, this.getDefaultDrawOptions(), this.drawOptions);


                var startX = endX = 0;
                var startY = endY = 0;

                startX = this.startPos.x;
                endX = this.endPos.x;

                startY = this.startPos.y;
                endY = this.endPos.y;

                if (this.LinePathRef) {
                    this.remove();
                }


                this.LinePathRef = renderer.path(['M', startX, startY, 'L', endX, endY]).attr({
                    name: drawOptions.toolID,
                    id: drawOptions.toolID,
                    opacity: 0.5,
                    stroke: drawOptions.stroke,
                    'stroke-width': drawOptions['stroke-width'],
                    zIndex: drawOptions.fill - 10
                }).add().toFront();

            };

            LinePath.prototype.update = function() {
                this.LinePathRef.path().add().toFront();
            };

            LinePath.prototype.remove = function() {
                this.LinePathRef.destroy();
            };
            /*    -----------------------------------------------PATH----------------------------------------------------------*/



            var line = new LinePath(chartID, {});
            line.openDialog();

        }
    }

});
