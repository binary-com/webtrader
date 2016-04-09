/**
 * Created by arnab on 4/3/15.
 *   Inheritence:-  DrawTool
 *                           => Shape
 *                                     => Circle

 */
define(['highstock', 'charts/draw/highcharts_custom/ShapeBase'], function() {
    if (!window['Shape']) return;

    if (!window['Circle']) {

        /*    -----------------------------------------------CIRCLE----------------------------------------------------------*/

        Circle = function(chartID, options) {
            Shape.call(this, 'Circle', chartID, options);
            this.isDraggable = true;
        };
        Circle.prototype = Object.create(Shape.prototype);
        Circle.prototype.constructor = Circle;

        Circle.prototype.create = function() {
            try {
                var chartID = this.chartID,
                    renderer = this.chartRef.renderer || $(chartID).highcharts().renderer,
                    self = this;

                var drawOptions = $.extend({}, this.getDefaultDrawOptions(), this.drawOptions);

                var radius = Math.sqrt(Math.pow(this.startPos.x - this.endPos.x, 2) + Math.pow(this.startPos.y - this.endPos.y, 2));


                //If Circle already drawn then update the radius
                if (this.circleRef) {
                    this.updateRadius(radius);
                    return;
                }

                // var shapeGroup = $(this.chartID).data('shapeGroup');
                // if (!shapeGroup) {
                //     $(this.chartID).data('shapeGroup', renderer.g().add());
                // }

                // Create the circle
                this.circleRef = renderer.circle(this.startPos.x, this.startPos.y, radius).attr(drawOptions).add( /*shapeGroup*/ ).toFront();


                // Adding drag Event on the SVG Circle Element
                if (this.isDraggable) {
                    var circleSVG = this.circleRef.element;
                    this.dragTool(circleSVG, this.dragCircle);

                }

            } catch (ex) {

                console.error('Error on Drawing Circle:' + ex.message);
            }

        }

        Circle.prototype.updateRadius = function(radius) {
            try {
                // update the circle size by updating it's Radius
                this.circleRef.attr({
                    r: radius
                }).toFront();
            } catch (ex) {
                console.error('Error on Drawing Circle:' + ex.message);
            }

        }

        Circle.prototype.dragCircle = function() {
            try {


                //Distance of the drag from previous position
                var dX = this.dragEndPos.x - this.dragStartPos.x;
                var dY = this.dragEndPos.y - this.dragStartPos.y;


                //console.log(dX, dY);

                //Setting the new start position
                this.dragStartPos.x = this.dragEndPos.x;
                this.dragStartPos.y = this.dragEndPos.y;


                //Getting the Circle's Centre co-ordinates
                var circleX = this.circleRef.attr('x');
                var circleY = this.circleRef.attr('y');


                this.circleRef.attr({
                    x: circleX + dX, //this.endPos.x, //currentX + newX,
                    y: circleY + dY //this.endPos.y // currentY + newY
                }).toFront();

            } catch (ex) {

                console.error('Error on Drawing Circle:' + ex.message);
            }

        }

        Circle.prototype.remove = function() {
            this.circleRef.destroy();
        };


        Circle.prototype.createDialog = function() {
            var self = this;
            var filePath = 'charts/draw/highcharts_custom/circle/circle';

            require([filePath], function(dialog) {
                self.dialog = dialog;
                self.openDialog();
            });

        }

        Circle.prototype.getDefaultDrawOptions = function(drawTool) {

            var defaultOptions = null;
            var drawTool = this.drawTool || drawTool;


            var defaultOptions = {
                'fill': 'rgba(255,0,0,0.4)',
                'stroke': 'black',
                'stroke-width': 2,
                dashStyle: 'solid',
                cursor: 'pointer',
                zIndex: 100
            };

            return defaultOptions;
        }

        /*    -----------------------------------------------CIRCLE----------------------------------------------------------*/

        window['Circle'] = Circle;

    }
});
