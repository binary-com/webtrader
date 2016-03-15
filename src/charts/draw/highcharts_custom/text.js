/**
 * Created by Ankit on 14 March 2016.
 */
define(['highstock', 'charts/draw/highcharts_custom/ShapeBase'], function() {

    return {
        init: function(chartID) {


            if (!window['TextAnnotation']) {
                /*    -----------------------------------------------TEXT----------------------------------------------------------*/

                TextAnnotation = function(chartID, options) {
                    Shape.call(this, 'Text', chartID, options);

                    this.isDraggable = true;
                    this.padding = 15;
                };
                TextAnnotation.prototype = Object.create(Shape.prototype);
                TextAnnotation.prototype.constructor = TextAnnotation;

                TextAnnotation.prototype.addEventhandlers = function(drawOptions) {
                    this.drawOptions = this.drawOptions || this.getDefaultDrawOptions();
                    this.drawOptions.id = this.toolID;
                    this.bindClick(this.drawOptions, this.clickHandler);
                }

                TextAnnotation.prototype.create = function() {
                    try {
                        var chartID = this.chartID,
                            renderer = this.chartRef.renderer || $(chartID).highcharts().renderer,
                            self = this;

                        var drawOptions = $.extend({}, this.getDefaultDrawOptions(), this.drawOptions);


                        // VALUES
                        var xValue = this.drawOptions.time;
                        var yValue = this.drawOptions.value;
                        //CO-ORDINATES
                        var xPos = this.series.xAxis.toPixels(xValue);
                        var yPos = this.series.yAxis.toPixels(yValue);


                        // Create the Text Annotation
                        this.textRef = renderer.text('<span style="color: ' + drawOptions.textColor + '"; font-weight:bold">' + drawOptions.text + '</span>', xPos, yPos).attr({
                            zIndex: drawOptions.zIndex
                        }).css({
                            color: '#4572A7',
                            fontSize: drawOptions.fontSize
                        }).add().toFront();


                        // Get the Values of the Text Box
                        var box = this.textRef.getBBox();

                        // Create a Styled box Around the Text. 
                        // TODO box.x & box.y not working accurately from second text anootation onwards on the chart
                        this.rectangleRef = renderer.rect( /*box.x*/ xPos - 5, /*box.y*/ yPos - 20, box.width + this.padding, box.height + this.padding, 2).attr({
                            fill: 'rgba(0,0,0,0)',
                            stroke: drawOptions.stroke,
                            cursor: 'pointer',
                            'stroke-width': drawOptions['stroke-width'],
                            zIndex: drawOptions.zIndex
                        }).add().toFront();

                        // Adding drag Event on the SVG Circle Element
                        if (this.isDraggable) {
                            var rectangleSVG = this.rectangleRef.element;
                            this.dragTool(rectangleSVG, this.dragTextAnnotation);
                        }

                    } catch (ex) {
                        console.error('Error on Drawing Circle:' + ex.message);
                    }

                }

                TextAnnotation.prototype.dragTextAnnotation = function() {
                    try {


                        //Distance of the drag from previous position
                        var dX = this.dragEndPos.x - this.dragStartPos.x;
                        var dY = this.dragEndPos.y - this.dragStartPos.y;


                        //Setting the new start position
                        this.dragStartPos.x = this.dragEndPos.x;
                        this.dragStartPos.y = this.dragEndPos.y;


                        //Getting the Rectangle's Centre co-ordinates
                        var rectangleX = this.rectangleRef.attr('x');
                        var rectangleY = this.rectangleRef.attr('y');
                        this.rectangleRef.attr({
                            x: rectangleX + dX, //this.endPos.x, //currentX + newX,
                            y: rectangleY + dY //this.endPos.y // currentY + newY
                        }).toFront();


                        // Also Update the Text Annotation Coordinates
                        var textX = this.textRef.attr('x');
                        var textY = this.textRef.attr('y');
                        this.textRef.attr({
                            x: textX + dX, //this.endPos.x, //currentX + newX,
                            y: textY + dY //this.endPos.y // currentY + newY
                        });

                    } catch (ex) {
                        console.error('Error on Drawing Circle:' + ex.message);
                    }

                }

                TextAnnotation.prototype.remove = function() {
                    this.rectangleRef.destroy();
                    this.textRef.destroy();
                };

                window['TextAnnotation'] = TextAnnotation;

                /*    -----------------------------------------------TEXT----------------------------------------------------------*/

            }

            var TextAnnotation = window['TextAnnotation'];
            var text = new TextAnnotation(chartID, {});
            text.openDialog();
        }
    }

});
