/**
 * Created by Ankit on 23 March 2016.
 *
 *   Description:- The Fibonacci retracements pattern can be useful for swing traders to identify reversals on a stock chart.
 *   
 * 
 *   
 */





define(['lodash', 'highstock', 'charts/draw/highcharts_custom/Fibonacci'], function(_) {


    return {
        init: function(chartID) {
            if (!window['Fibonacci']) {
                return;
            }
            if (!window['FibonacciRetracement']) {

                /*    -----------------------------------------------FibonacciRetracement----------------------------------------------------------*/
                FibonacciRetracement = function(type, chartID, options) {

                    Fibonacci.call(this, type, chartID, options);

                    // Keeping bindOnce to true will limit the Drawing to One Instance per User-Interaction
                    this.drawOnce = true;
                    this.decimals = 4;

                    // Show the Actual Value at the Fibonacci Interval  Example:-  "50% (1860.555)"
                    this.displayIntervalValue = true;

                    this.textAlignRight = true;
                    this.textAboveLine = true;

                };
                FibonacciRetracement.prototype = Object.create(Fibonacci.prototype);
                FibonacciRetracement.constructor = FibonacciRetracement;

                FibonacciRetracement.prototype.updateCalculations = function() {
                    var self = this;
                    var end = {
                            xPos: this.startPos.x,
                            yPos: this.startPos.y,

                            xValue: Math.round(this.startPos.xValue),
                            yValue: Math.round(this.startPos.yValue)
                        },
                        start = {
                            xPos: this.endPos.x,
                            yPos: this.endPos.y,

                            xValue: Math.round(this.endPos.xValue),
                            yValue: Math.round(this.endPos.yValue)
                        };

                    this.upTrend = this.isUpTrend(start.yPos, end.yPos);
                    this.forwardTrend = this.isForwardTrend(end.xPos, start.xPos);

                    var dY = end.yPos - start.yPos;

                    _(this.fibonacci_intervals).forEach(function(fibonacciPoint, idx) {

                        // LINE COORDINATES
                        fibonacciPoint.x1 = start.xPos;
                        fibonacciPoint.x2 = end.xPos;
                        fibonacciPoint.y1 = start.yPos + (dY) * fibonacciPoint.value;
                        fibonacciPoint.y2 = fibonacciPoint.y1; // Both 'y' coordinates are same since Fibonacci Trendline is a Horizontal Line                  


                        var startValues = self.getValueFromCoordinates(fibonacciPoint.x1, fibonacciPoint.y1);
                        var endValues = self.getValueFromCoordinates(fibonacciPoint.x2, fibonacciPoint.y2);


                        // LINE VALUES
                        fibonacciPoint.x1Value = startValues.x;
                        fibonacciPoint.x2Value = endValues.x;
                        fibonacciPoint.y1Value = startValues.y;
                        fibonacciPoint.y2Value = endValues.y;

                    });

                    return this;
                }

                FibonacciRetracement.prototype.draw = function() {

                    var self = this;

                    _(this.fibonacci_intervals).forEach(function(fibonacciPoint) {

                        if (fibonacciPoint.lineRef) {

                            // REDRAWING THE LINES (SLOWER)
                            // fibonacciPoint.lineRef.element.remove();
                            // fibonacciPoint.textRef.element.remove();
                            // fibonacciPoint.lineRef = self.drawLine(fibonacciPoint);
                            // fibonacciPoint.textRef = self.drawText(fibonacciPoint);


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

                FibonacciRetracement.prototype.getTextString = function(opts) {
                    return '<span style="color: ' + this.drawOptions.textColor + '"; font-weight:bold">' + opts.text + ((this.displayIntervalValue) ? ' (' + opts.y1Value.toFixed(this.decimals) + ')' : '') + '</span>'
                }

                FibonacciRetracement.prototype.drawText = function(opts) {
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

              

                FibonacciRetracement.prototype.updateLine = function(opts) {
                    return opts.lineRef.attr('d', 'M ' + opts.x1 + ' ' + opts.y1 + ' L ' + opts.x2 + ' ' + opts.y2);
                }

                FibonacciRetracement.prototype.updateText = function(opts) {
                    opts.textRef.destroy();
                    return opts.textRef = this.drawText(opts);;
                }

                FibonacciRetracement.prototype.remove = function(opts) {
                    _(this.fibonacci_intervals).forEach(function(fibonacciPoint) {
                        if (fibonacciPoint.lineRef) {
                            fibonacciPoint.lineRef.destroy();
                            fibonacciPoint.textRef.destroy();
                        }
                    });
                    return this;
                }



                /*    -----------------------------------------------FibonacciRetracement----------------------------------------------------------*/
                window['FibonacciRetracement'] = FibonacciRetracement;
            }


            var FibonacciRetracement = window['FibonacciRetracement'];
            var fiboRetracement = new FibonacciRetracement('FibonacciRetracement', chartID, {});
            fiboRetracement.openDialog();


        }
    }





});
