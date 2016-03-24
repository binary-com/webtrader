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
                    this.textAlignRight = true;
                    this.textAboveLine = true;

                };
                FibonacciRetracement.prototype = Object.create(Fibonacci.prototype);
                FibonacciRetracement.constructor = FibonacciRetracement;

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
                    return '<span style="color: ' + this.drawOptions.textColor + '"; font-weight:bold">' + opts.text + ' (' + opts.y1Value.toFixed(this.decimals) + ')' + '</span>'
                }

                FibonacciRetracement.prototype.drawText = function(opts) {
                    var chartID = this.chartID,
                        renderer = this.chartRef.renderer || $(chartID).highcharts().renderer,
                        textXPos = opts.x1,
                        textYPos = opts.y1;

                    this.textAboveLine = true;

                    if (this.isForwardTrend) {
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

                FibonacciRetracement.prototype.drawLine = function(opts) {

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
                            zIndex: this.drawOptions.fill - 10
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
