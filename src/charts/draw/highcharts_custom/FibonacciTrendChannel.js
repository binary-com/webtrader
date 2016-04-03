/**
 * Created by Ankit on 30 March 2016.
 *
 *   Description:- The graphic tool, The Fibonacci time interval, is a set of vertical lines that are drawn from each other on time intervals,
 *                 which correspond to the numbers of Fibonacci's sequence. Fibonacci Time interval is the tool of the forecast because,
 *                 according to a popular belief, the most significant market events occur through the time intervals corresponding to Fibonacci numbers.
 *   
 *   Inheritence:-  DrawTool
 *                           => Fibonacci
 *                                        => FibonacciTrendChannel
 *      
 *   References:-  http://www.forexrealm.com/technical-analysis/graphical-methods/figures/fibonacci-time-zone.html
 *                 http://stockcharts.com/school/doku.php?id=chart_school:chart_analysis:fibonacci_time_zones
 *                 http://www.investopedia.com/terms/f/fibonaccitimezones.asp 
 *                 https://ta.mql4.com/linestudies/fibonacci_time_zones  
 */





define(['lodash', 'highstock', 'charts/draw/highcharts_custom/Fibonacci'], function(_) {


    return {
        init: function(chartID) {
            if (!window['Fibonacci']) {
                return;
            }
            if (!window['FibonacciTrendChannel']) {

                /*    -----------------------------------------------FibonacciTrendChannel----------------------------------------------------------*/
                FibonacciTrendChannel = function(type, chartID, options) {

                    Fibonacci.call(this, type, chartID, options);

                    // Keeping bindOnce to true will limit the Drawing to One Instance per User-Interaction
                    this.drawOnce = true;
                    this.decimals = 4;

                    // Show the Actual Value at the Fibonacci Interval  Example:-  "50% (1860.555)"
                    this.displayIntervalValue = true;

                    this.textAlignRight = true;
                    this.textAboveLine = true;

                };
                FibonacciTrendChannel.prototype = Object.create(Fibonacci.prototype);
                FibonacciTrendChannel.constructor = FibonacciTrendChannel;

                Fibonacci.prototype.dragHandler = function() {
                    this.drawBaseline();
                }


                FibonacciTrendChannel.prototype.drawBaseline = function() {

                    var chartID = this.chartID,
                        renderer = this.chartRef.renderer || $(chartID).highcharts().renderer;

                    this.start = {
                        xPos: this.startPos.x,
                        yPos: this.startPos.y,

                        xValue: Math.round(this.startPos.xValue),
                        yValue: Math.round(this.startPos.yValue)
                    };
                    this.end = {
                        xPos: this.endPos.x,
                        yPos: this.endPos.y,

                        xValue: Math.round(this.endPos.xValue),
                        yValue: Math.round(this.endPos.yValue)
                    };

                    this.upTrend = this.isUpTrend(this.start.yPos, this.end.yPos);
                    this.forwardTrend = this.isForwardTrend(this.start.xPos, this.end.xPos);

                    // Removing the Previously Drawn line
                    if (this.baselineRef) {
                        this.baselineRef.destroy();
                    }

                    // Saving the Updated Initial Line Reference
                    this.baselineRef = renderer.path(['M', this.start.xPos, this.start.yPos, 'L', this.end.xPos, this.end.yPos]).attr({
                        name: this.toolID + "_temp",
                        id: this.toolID + "_temp",
                        opacity: 0.5,
                        stroke: "#a7a7a7",
                        'stroke-width': this.drawOptions['stroke-width'],
                        zIndex: 10
                    }).add().toFront();

                    return this;
                }



                FibonacciTrendChannel.prototype.bindNext = function() {

                    var chartID = this.chartID,
                        renderer = this.chartRef.renderer || $(chartID).highcharts().renderer,
                        self = this;


                    var onMouseDown = function() {
                        $(self.chartID).off('mousemove', self.mouseDrag);
                        $(self.chartID).off('mousedown', onMouseDown);
                    }

                    $(this.chartID).on('mousemove', { ref: this, container: this.chartID, callback: this.drawTrendChannels }, this.mouseDrag);
                    $(this.chartID).on('mousedown', onMouseDown);

                }

                FibonacciTrendChannel.prototype.drawTrendChannels = function() {
                    // Removing the Previously Drawn Baseline
                    if (this.baselineRef) {
                        this.baselineRef.destroy();
                        delete this.baselineRef;
                    }

                    this.updateCalculations().draw();
                }


                FibonacciTrendChannel.prototype.updateCalculations = function() {
                    var self = this,
                        // 'start' is the initial point of the BaseLine Drawn
                        start = this.start,
                        // 'end' is the final position of the BaseLine Drawn 
                        end = this.end,
                        // 'drag' is the current point at which the mouse is positioned at                   
                        drag = {
                            xPos: this.endPos.x,
                            yPos: this.endPos.y,

                            xValue: Math.round(this.endPos.xValue),
                            yValue: Math.round(this.endPos.yValue)
                        };


                    // Calculate dX & dY  between 'start' and 'drag'
                    var dX = drag.xPos - start.xPos;
                    var dY = drag.yPos - start.yPos;


                    _(this.fibonacci_intervals).forEach(function(fibonacciPoint, idx) {

                        // LINE COORDINATES
                        fibonacciPoint.x1 = start.xPos + (dX * fibonacciPoint.value);
                        fibonacciPoint.y1 = start.yPos + (dY * fibonacciPoint.value);

                        fibonacciPoint.x2 = end.xPos + (dX * fibonacciPoint.value);
                        fibonacciPoint.y2 = end.yPos + (dY * fibonacciPoint.value);


                        var startValues = self.getValueFromCoordinates(fibonacciPoint.x1, fibonacciPoint.y1);
                        var endValues = self.getValueFromCoordinates(fibonacciPoint.x2, fibonacciPoint.y2);


                        // LINE VALUES
                        fibonacciPoint.x1Value = startValues.x;
                        fibonacciPoint.y1Value = startValues.y;

                        fibonacciPoint.x2Value = endValues.x;
                        fibonacciPoint.y2Value = endValues.y;

                    });

                    return this;

                }

                FibonacciTrendChannel.prototype.draw = function() {

                    var self = this;

                    _(this.fibonacci_intervals).forEach(function(fibonacciPoint) {

                        if (fibonacciPoint.lineRef) {
                            // UPDATING THE LINES (FASTER)
                            self.updateLine(fibonacciPoint);
                            self.updateText(fibonacciPoint);

                        } else {
                            fibonacciPoint.lineRef = self.drawLine(fibonacciPoint);
                            fibonacciPoint.textRef = self.drawText(fibonacciPoint);
                        }
                    });
                    return this;
                }

                FibonacciTrendChannel.prototype.getTextString = function(opts) {
                    return '<span style="color: ' + this.drawOptions.textColor + '"; font-weight:bold">' + opts.text + ((this.displayIntervalValue) ? ' (' + opts.y1Value.toFixed(this.decimals) + ')' : '') + '</span>'
                }

                FibonacciTrendChannel.prototype.drawLine = function(opts) {

                    var chartID = this.chartID,
                        renderer = this.chartRef.renderer || $(chartID).highcharts().renderer;

                    return renderer.path(['M', opts.x1, opts.y1, 'L', opts.x2, opts.y2])
                        .attr({
                            name: this.toolID + "_" + opts.text,
                            id: this.toolID + "_" + opts.text,
                            opacity: 0.5,
                            dashStyle: 'dot',
                            stroke: opts.colour || this.drawOptions.stroke,
                            'stroke-width': this.drawOptions['stroke-width'],
                            zIndex: this.drawOptions.zIndex
                        }).add().toFront();
                }

                FibonacciTrendChannel.prototype.drawText = function(opts) {
                    var chartID = this.chartID,
                        renderer = this.chartRef.renderer || $(chartID).highcharts().renderer,
                        textXPos = opts.x1,
                        textYPos = opts.y1;

                    this.textAboveLine = true;

                    if (this.forwardTrend) {
                        textXPos = opts.x1;
                        textYPos += this.drawOptions['stroke-width'] + 1;
                        this.textAboveLine = false;
                    }

                    if (this.textAboveLine) {
                        textYPos -= this.drawOptions['stroke-width'] + 1;
                    }


                    // Create the Text Annotation
                    return renderer.text(this.getTextString(opts), textXPos, textYPos)
                        .attr({
                            zIndex: this.drawOptions.zIndex
                        })
                        .css({
                            color: this.drawOptions.textColor || '#a7a7a7',
                            fontSize: this.drawOptions.fontSize || 12
                        }).add().toFront();
                }



                FibonacciTrendChannel.prototype.updateLine = function(opts) {
                    return opts.lineRef.attr('d', 'M ' + opts.x1 + ' ' + opts.y1 + ' L ' + opts.x2 + ' ' + opts.y2);
                }

                FibonacciTrendChannel.prototype.updateText = function(opts) {
                    opts.textRef.destroy();
                    return opts.textRef = this.drawText(opts);;
                }

                FibonacciTrendChannel.prototype.remove = function(opts) {
                    _(this.fibonacci_intervals).forEach(function(fibonacciPoint) {
                        if (fibonacciPoint.lineRef) {
                            fibonacciPoint.lineRef.destroy();
                            fibonacciPoint.textRef.destroy();
                        }
                    });
                    return this;
                }


                /*    -----------------------------------------------FibonacciTimezone----------------------------------------------------------*/
                window['FibonacciTrendChannel'] = FibonacciTrendChannel;
            }


            var FibonacciTrendChannel = window['FibonacciTrendChannel'];
            var fibonacciTrendChannel = new FibonacciTrendChannel('FibonacciTrendChannel', chartID, {});
            fibonacciTrendChannel.openDialog();


        }
    }

});
