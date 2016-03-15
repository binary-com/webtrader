/**
 * Created by Ankit on 14 March 2016.
 */
define(['highstock', 'charts/draw/highcharts_custom/ShapeBase'], function() {


    return {
        init: function(chartID) {

            if (!window['Shape']) return;

            if (!window['Rectangle']) {

                /*    -----------------------------------------------RECT----------------------------------------------------------*/

                Rectangle = function(chartID, options) {
                    Shape.call(this, 'Rectangle', chartID, options);

                    this.isDraggable = true;
                };
                Rectangle.prototype = Object.create(Shape.prototype);
                Rectangle.prototype.constructor = Rectangle;

                Rectangle.prototype.create = function() {
                    try {
                        var chartID = this.chartID,
                            renderer = this.chartRef.renderer || $(chartID).highcharts().renderer,
                            self = this;

                        var drawOptions = $.extend({}, this.getDefaultDrawOptions(), this.drawOptions);


                        var startX = 0;
                        // SWAPPING X COORDINATES
                        if (this.startPos.x > this.endPos.x) {
                            startX = this.endPos.x;
                        } else {
                            startX = this.startPos.x
                        }


                        var startY = 0;
                        // SWAPPING Y COORDINATES
                        if (this.startPos.y < this.endPos.y) {
                            startY = this.startPos.y
                        } else {
                            startY = this.endPos.y;
                        }



                        var dX = this.startPos.x - this.endPos.x;
                        var dY = this.startPos.y - this.endPos.y;

                        var width = Math.abs(dX);
                        var height = Math.abs(dY);


                        //If Circle already drawn then update the radius
                        if (this.rectangleRef) {
                            this.updateRectangle(startX, startY, width, height);
                            return;
                        }


                        //Adding all SVG Elements to the Same ShapeGroup for a given Chart
                        // var shapeGroup = $(this.chartID).data('shapeGroup');
                        // if (!shapeGroup) {
                        //     $(this.chartID).data('shapeGroup', renderer.g().add());
                        // }


                        // Create the Rectangle
                        this.rectangleRef = renderer.rect(this.startPos.x, this.startPos.y, width, height).attr(drawOptions).add( /*shapeGroup*/ ).toFront();


                        // Adding drag Event on the SVG Circle Element
                        if (this.isDraggable) {
                            var rectagleSVG = this.rectangleRef.element;
                            this.dragTool(rectagleSVG, this.dragRectangle);

                        }

                    } catch (ex) {

                        console.error('Error on Drawing Circle:' + ex.message);
                    }

                }

                Rectangle.prototype.updateRectangle = function(xPos, yPos, width, height) {
                    try {
                        // update the circle size by updating it's Radius
                        this.rectangleRef.attr({
                            x: xPos,
                            y: yPos,
                            width: width,
                            height: height
                        });
                    } catch (ex) {
                        console.error('Error on Drawing Rect:' + ex.message);
                    }

                }

                Rectangle.prototype.dragRectangle = function() {
                    try {


                        //Distance of the drag from previous position
                        var dX = this.dragEndPos.x - this.dragStartPos.x;
                        var dY = this.dragEndPos.y - this.dragStartPos.y;


                        console.log(dX, dY);

                        //Setting the new start position
                        this.dragStartPos.x = this.dragEndPos.x;
                        this.dragStartPos.y = this.dragEndPos.y;


                        //Getting the Circle's Centre co-ordinates
                        var circleX = this.rectangleRef.attr('x');
                        var circleY = this.rectangleRef.attr('y');


                        this.rectangleRef.attr({
                            x: circleX + dX, //this.endPos.x, //currentX + newX,
                            y: circleY + dY //this.endPos.y // currentY + newY
                        }).toFront();



                    } catch (ex) {

                        console.error('Error on Drawing Circle:' + ex.message);
                    }

                }

                Rectangle.prototype.remove = function() {
                    this.rectangleRef.destroy();
                };

                /*    -----------------------------------------------RECT----------------------------------------------------------*/

                window['Rectangle'] = Rectangle;
            }

            var Rectangle = window['Rectangle'];
            var rectangle = new Rectangle(chartID, {});
            rectangle.openDialog();
        }
    }

});
