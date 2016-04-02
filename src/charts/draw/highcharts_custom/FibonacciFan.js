/**
 * Created by Ankit on 25 March 2016.
 *
 *   Description:- A charting technique consisting of three diagonal lines that use Fibonacci ratios to help identify key levels of support and resistance.
 *   
 *   Inheritence:-  DrawTool
 *                           => Fibonacci
 *                                        => FibonacciFan
 *      
 *   References:-  http://www.chart-formations.com/fibonacci/fans.aspx 
 *                 http://forexop.com/learning/fibonacci-fan/   
 *                 http://www.investopedia.com/terms/f/fibonaccifan.asp  
 */



define(['lodash', 'highstock', 'charts/draw/highcharts_custom/Fibonacci'], function(_) {


    return {
        init: function(chartID) {
            if (!window['Fibonacci']) {
                return;
            }
            if (!window['FibonacciFan']) {

                /*    -----------------------------------------------FibonacciFan----------------------------------------------------------*/
                FibonacciFan = function(type, chartID, options) {

                    Fibonacci.call(this, type, chartID, options);

                    // Keeping bindOnce to true will limit the Drawing to One Instance per User-Interaction
                    this.drawOnce = true;
                    this.decimals = 4;

                    // Show the Actual Value at the Fibonacci Interval  Example:-  "50% (1860.555)"
                    this.displayIntervalValue = true;

                    this.textAlignRight = true;
                    this.textAboveLine = true;

                    // The Peak Point is the End-Point from which the rest of the Calculation will be based upon
                    this.peakPoint = _.find(this.fibonacci_intervals, { value: 1 });

                    // Modifying the Default Fibonacci Intervals 
                    this.fibonacci_intervals = this.getOnlyRequiredIntervals(this.peakPoint);

                    // Draw the Gridlines which connects the Fibonacci intervals parellely
                    this.showGridlines = true;

                    // Show Text indicating the Fibonacci interval
                    this.showText = true;
                    // Optionally Show the actual value of the Fibonacci Fan-Line
                    this.displayIntervalValue = true;

                };
                FibonacciFan.prototype = Object.create(Fibonacci.prototype);
                FibonacciFan.constructor = FibonacciFan;             


                FibonacciFan.prototype.updateCalculations = function() {

                    var self = this,
                        start = {
                            xPos: this.startPos.x,
                            yPos: this.startPos.y,

                            xValue: this.startPos.xValue,
                            yValue: this.startPos.yValue
                        },
                        end = {
                            xPos: this.endPos.x,
                            yPos: this.endPos.y,

                            xValue: this.endPos.xValue,
                            yValue: this.endPos.yValue
                        };



                    // Calculate the Four Corner Points
                    this.startPoint = start;
                    this.endPoint = end;
                    this.pointVerticalToOrigin = this.getPointDetailsFromCoordinates(start.xPos, end.yPos);
                    this.pointHorizontalToOrigin = this.getPointDetailsFromCoordinates(end.xPos, start.yPos);


                    this.upTrend = this.isUpTrend(end.yPos, start.yPos);
                    this.forwardTrend = this.isForwardTrend(start.xPos, end.xPos);


                    // Cartesian Distance between the StartPoint & EndPoint 
                    var distance = this.getDistance();

                    // Horizontal Cartesian Distance between the StartPoint & EndPoint 
                    var dX = Math.abs(end.xPos - start.xPos);

                    // Vertical Cartesian Distance between the StartPoint & EndPoint 
                    var dY = Math.abs(end.yPos - start.yPos);


                    _(this.fibonacci_intervals).forEach(function(fibonacciPoint, idx) {

                        if (typeof fibonacciPoint.verticalPoint == "undefined") {
                            fibonacciPoint.verticalPoint = {};
                            fibonacciPoint.horizontalPoint = {};
                        }


                        // CALCULATE ALL FIBONACCI INTERVAL POINTS THAT ARE ON THE LINE VERTICAL TO ORIGIN
                        // fibonacciPoint.vertical.x1 = self.startPoint.xPos;
                        // fibonacciPoint.vertical.y1 = self.startPoint.yPos;
                        var verticalX = (self.forwardTrend) ? self.startPoint.xPos + (dX) * fibonacciPoint.value : self.startPoint.xPos - (dX) * fibonacciPoint.value,
                            verticalY = self.endPoint.yPos,
                            verticalPointValues = self.getValueFromCoordinates(verticalX, verticalY);

                        fibonacciPoint.verticalPoint.xPos = verticalX;
                        fibonacciPoint.verticalPoint.yPos = verticalY;
                        fibonacciPoint.verticalPoint.xValue = verticalPointValues.x;
                        fibonacciPoint.verticalPoint.yValue = verticalPointValues.y;



                        // CALCULATE ALL INTERVAL POINTS THAT ARE ON THE LINE HORIZONTAL TO ORIGIN
                        // fibonacciPoint.horizontal.x1 = self.startPoint.xPos;
                        // fibonacciPoint.horizontal.y1 = self.startPoint.yPos;
                        var horizontalX = self.endPoint.xPos,
                            horizontalY = (self.upTrend) ? self.startPoint.yPos - (dY) * fibonacciPoint.value : self.startPoint.yPos + (dY) * fibonacciPoint.value,
                            horizontalPointValues = self.getValueFromCoordinates(horizontalX, horizontalY);

                        fibonacciPoint.horizontalPoint.xPos = horizontalX;
                        fibonacciPoint.horizontalPoint.yPos = horizontalY;
                        fibonacciPoint.horizontalPoint.xValue = horizontalPointValues.x;
                        fibonacciPoint.horizontalPoint.yValue = horizontalPointValues.y;


                    });

                    return this;
                }

                FibonacciFan.prototype.draw = function() {

                    var self = this;

                    _(this.fibonacci_intervals).forEach(function(fibonacciPoint) {

                        // Plot Both the Upper & lower Fibonacci Fan lines
                        if (fibonacciPoint.horizontalPoint.lineRef && fibonacciPoint.verticalPoint.lineRef) {
                            self.updateFibonacciFanLines(fibonacciPoint);
                        } else {
                            self.drawFibonacciFanLines(fibonacciPoint);
                        }


                        // Draw GridLines
                        if (self.showGridlines) {
                            if (fibonacciPoint.horizontalGridLineRef && fibonacciPoint.verticalGridLineRef) {
                                self.updateFibonacciGridLines(fibonacciPoint);
                            } else {
                                self.drawFibonacciGridLines(fibonacciPoint);
                            }
                        }


                        // Draw Text indicating Fibonacci Interval & Value
                        if (self.showText) {
                            if (fibonacciPoint.horizontalGridLineTextRef && fibonacciPoint.verticalGridLineTextRef) {
                                self.updateText(fibonacciPoint).drawText(fibonacciPoint);
                            } else {
                                self.drawText(fibonacciPoint);
                            }
                        }


                    });
                    return this;
                }


                FibonacciFan.prototype.drawFibonacciFanLines = function(opts) {

                    var chartID = this.chartID,
                        renderer = this.chartRef.renderer || $(chartID).highcharts().renderer;


                    opts.horizontalPoint.lineRef = renderer.path(['M', this.startPoint.xPos, this.startPoint.yPos, 'L', opts.horizontalPoint.xPos, opts.horizontalPoint.yPos])
                        .attr({
                            name: this.toolID + "_" + opts.text + "_sub_horizontalLine",
                            id: this.toolID + "_" + opts.text + "_sub_horizontalLine",
                            opacity: 0.7,
                            dashStyle: 'dot',
                            stroke: opts.colour || this.drawOptions.stroke,
                            'stroke-width': this.drawOptions['stroke-width'],
                            zIndex: this.drawOptions.zIndex
                        }).add().toFront();


                    opts.verticalPoint.lineRef = renderer.path(['M', this.startPoint.xPos, this.startPoint.yPos, 'L', opts.verticalPoint.xPos, opts.verticalPoint.yPos])
                        .attr({
                            name: this.toolID + "_" + opts.text + "_sub_verticalLine",
                            id: this.toolID + "_" + opts.text + "_sub_verticalLine",
                            opacity: 0.7,
                            dashStyle: 'dot',
                            stroke: opts.colour || this.drawOptions.stroke,
                            'stroke-width': this.drawOptions['stroke-width'],
                            zIndex: this.drawOptions.zIndex
                        }).add().toFront();
                }


                FibonacciFan.prototype.drawFibonacciGridLines = function(opts) {

                    var chartID = this.chartID,
                        renderer = this.chartRef.renderer || $(chartID).highcharts().renderer;


                    opts.horizontalGridLineRef = renderer.path(['M', this.startPoint.xPos, opts.horizontalPoint.yPos, 'L', opts.horizontalPoint.xPos, opts.horizontalPoint.yPos])
                        .attr({
                            name: this.toolID + "_" + opts.text + "_grid_horizontalLine",
                            id: this.toolID + "_" + opts.text + "_grid_horizontalLine",
                            opacity: 0.5,
                            dashStyle: 'dot',
                            stroke: '#000' || opts.colour || this.drawOptions.stroke,
                            'stroke-width': 1 || this.drawOptions['stroke-width'],
                            zIndex: this.drawOptions.zIndex
                        }).add().toFront();


                    opts.verticalGridLineRef = renderer.path(['M', opts.verticalPoint.xPos, this.startPoint.yPos, 'L', opts.verticalPoint.xPos, opts.verticalPoint.yPos])
                        .attr({
                            name: this.toolID + "_" + opts.text + "_grid_verticalLine",
                            id: this.toolID + "_" + opts.text + "_grid_verticalLine",
                            opacity: 0.5,
                            dashStyle: 'dot',
                            stroke: '#000' || opts.colour || this.drawOptions.stroke,
                            'stroke-width': 1 || this.drawOptions['stroke-width'],
                            zIndex: this.drawOptions.zIndex
                        }).add().toFront();
                }

                FibonacciFan.prototype.drawText = function(opts) {

                    var chartID = this.chartID,
                        renderer = this.chartRef.renderer || $(chartID).highcharts().renderer;

                    // Create the Text Annotation on the Horizontal Fibonacci interval point
                    opts.horizontalGridLineTextRef = renderer.text(this.getTextString(opts, opts.horizontalPoint.yValue), opts.horizontalPoint.xPos, opts.horizontalPoint.yPos)
                        .attr({
                            zIndex: this.drawOptions.zIndex
                        })
                        .css({
                            color: this.drawOptions.textColor || '#a7a7a7',
                            fontSize: this.drawOptions.fontSize || 12
                        }).add().toFront();


                    // Create the Text Annotation on the Vertical Fibonacci interval point                        
                    opts.verticalGridLineTextRef = renderer.text(this.getTextString(opts, opts.verticalPoint.yValue), opts.verticalPoint.xPos, opts.verticalPoint.yPos)
                        .attr({
                            zIndex: this.drawOptions.zIndex
                        })
                        .css({
                            color: this.drawOptions.textColor || '#a7a7a7',
                            fontSize: this.drawOptions.fontSize || 12
                        }).add().toFront();


                }




                FibonacciFan.prototype.updateFibonacciFanLines = function(opts) {
                    opts.horizontalPoint.lineRef.attr('d', 'M ' + this.startPoint.xPos + ' ' + this.startPoint.yPos + ' L ' + opts.horizontalPoint.xPos + ' ' + opts.horizontalPoint.yPos);
                    opts.verticalPoint.lineRef.attr('d', 'M ' + this.startPoint.xPos + ' ' + this.startPoint.yPos + ' L ' + opts.verticalPoint.xPos + ' ' + opts.verticalPoint.yPos);
                }

                FibonacciFan.prototype.updateFibonacciGridLines = function(opts) {
                    opts.horizontalGridLineRef.attr('d', 'M ' + this.startPoint.xPos + ' ' + opts.horizontalPoint.yPos + ' L ' + opts.horizontalPoint.xPos + ' ' + opts.horizontalPoint.yPos);
                    opts.verticalGridLineRef.attr('d', 'M ' + opts.verticalPoint.xPos + ' ' + this.startPoint.yPos + ' L ' + opts.verticalPoint.xPos + ' ' + opts.verticalPoint.yPos);
                }

                FibonacciFan.prototype.updateText = function(opts) {
                    opts.horizontalGridLineTextRef.destroy();
                    opts.verticalGridLineTextRef.destroy();
                    return this;
                }

                FibonacciFan.prototype.getTextString = function(opts, value) {
                    return '<span style="color: ' + this.drawOptions.textColor + '"; font-weight:bold">' + opts.text + ((this.displayIntervalValue) ? ' (' + value.toFixed(this.decimals) + ')' : '') + '</span>'
                }



                FibonacciFan.prototype.remove = function(opts) {

                    var self = this;

                    _(this.fibonacci_intervals).forEach(function(fibonacciPoint) {

                        // Removing Both the Upper & lower Fibonacci Fan lines
                        if (fibonacciPoint.horizontalPoint.lineRef && fibonacciPoint.verticalPoint.lineRef) {

                            fibonacciPoint.horizontalPoint.lineRef.destroy();
                            fibonacciPoint.verticalPoint.lineRef.destroy();
                        }

                        // Removing GridLines
                        if (self.showGridlines) {
                            if (fibonacciPoint.verticalGridLineRef && fibonacciPoint.horizontalGridLineRef) {

                                fibonacciPoint.horizontalGridLineRef.destroy();
                                fibonacciPoint.verticalGridLineRef.destroy();
                            }
                        }

                        // Removing Text indicating Fibonacci Interval & Value
                        if (self.showText) {
                            if (fibonacciPoint.horizontalGridLineTextRef && fibonacciPoint.verticalGridLineTextRef) {

                                fibonacciPoint.horizontalGridLineTextRef.destroy();
                                fibonacciPoint.verticalGridLineTextRef.destroy();
                            }
                        }
                    });

                    return this;
                }


                /*    -----------------------------------------------FibonacciFan----------------------------------------------------------*/
                window['FibonacciFan'] = FibonacciFan;
            }


            var FibonacciFan = window['FibonacciFan'];
            var fibonacciFan = new FibonacciFan('FibonacciFan', chartID, {});
            fibonacciFan.openDialog();


        }
    }





});
