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
            if (!window['FibonacciArc']) {

                /*    -----------------------------------------------FibonacciArc----------------------------------------------------------*/
                FibonacciArc = function(type, chartID, options) {

                    Fibonacci.call(this, type, chartID, options);

                    // Keeping bindOnce to true will limit the Drawing to One Instance per User-Interaction
                    this.drawOnce = true;
                    this.decimals = 4;

                    // Show the Actual Value at the Fibonacci Interval  Example:-  "50% (1860.555)"
                    this.displayIntervalValue = true;

                    this.textAlignRight = true;
                    this.textAboveLine = true;

                };
                FibonacciArc.prototype = Object.create(Fibonacci.prototype);
                FibonacciArc.constructor = FibonacciArc;

                Fibonacci.prototype.getDistance = function() {
                    return Math.sqrt((this.startPos.x - this.endPos.x) * (this.startPos.x - this.endPos.x) + (this.startPos.y - this.endPos.y) * (this.startPos.y - this.endPos.y));
                };

                FibonacciArc.prototype.updateCalculations = function() {

                    var self = this,

                        start = {
                            xPos: this.startPos.x,
                            yPos: this.startPos.y,

                            xValue: Math.round(this.startPos.xValue),
                            yValue: Math.round(this.startPos.yValue)
                        },
                        end = {
                            xPos: this.endPos.x,
                            yPos: this.endPos.y,

                            xValue: Math.round(this.endPos.xValue),
                            yValue: Math.round(this.endPos.yValue)
                        },
                        _previousRadius = 0;


                    this.upTrend = this.isUpTrend(end.yPos, start.yPos);
                    this.forwardTrend = this.isForwardTrend(start.xPos, end.xPos);

                    var distance = this.getDistance();

                    _(this.fibonacci_intervals).forEach(function(fibonacciPoint, idx) {

                        // CENTER COORDINATES
                        fibonacciPoint.centerX = start.xPos;
                        fibonacciPoint.centerY = start.yPos;

                        // CENTER VALUES
                        fibonacciPoint.centerXValue = start.xValue;
                        fibonacciPoint.centerYValue = start.yValue;

                        // INNER RADIUS
                        fibonacciPoint.innerRadius = _previousRadius;

                        // OUTER RADIUS
                        fibonacciPoint.outerRadius = _previousRadius = Math.abs(distance) * fibonacciPoint.value;

                        // OUTER COORDINATES
                        fibonacciPoint.outerX = fibonacciPoint.centerX;
                        fibonacciPoint.outerY = (self.upTrend) ? fibonacciPoint.centerY - fibonacciPoint.outerRadius : fibonacciPoint.centerY + fibonacciPoint.outerRadius;

                        // OUTER VALUES
                        var outerValues = self.getValueFromCoordinates(fibonacciPoint.centerX, fibonacciPoint.outerY);
                        fibonacciPoint.outerXValue = outerValues.x;
                        fibonacciPoint.outerYValue = outerValues.y;

                        // START ANGLE
                        fibonacciPoint.startAngle = (self.upTrend) ? Math.PI : 0;

                        // END ANGLE
                        fibonacciPoint.endAngle = (self.upTrend) ? 0 : Math.PI;
                    });

                    return this;
                }

                FibonacciArc.prototype.draw = function() {

                    var self = this;

                    _(this.fibonacci_intervals).forEach(function(fibonacciPoint) {

                        if (fibonacciPoint.arcRef) {

                            // REDRAWING THE ARCS (SLOWER)
                            fibonacciPoint.arcRef.element.remove();
                            fibonacciPoint.arcRef.destroy();
                            fibonacciPoint.arcRef = self.drawArc(fibonacciPoint);
                            self.updateText(fibonacciPoint);

                        } else {
                            fibonacciPoint.arcRef = self.drawArc(fibonacciPoint);
                            fibonacciPoint.textRef = self.drawText(fibonacciPoint);
                        }
                    });
                    return this;
                }

                FibonacciArc.prototype.getTextString = function(opts) {
                    return '<span style="color: ' + this.drawOptions.textColor + '"; font-weight:bold">' + opts.text + ((this.displayIntervalValue) ? ' (' + opts.outerYValue.toFixed(this.decimals) + ')' : '') + '</span>'
                }

                FibonacciArc.prototype.drawText = function(opts) {
                    var chartID = this.chartID,
                        renderer = this.chartRef.renderer || $(chartID).highcharts().renderer,
                        textXPos = opts.centerX,
                        textYPos = opts.outerY;

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

                FibonacciArc.prototype.drawArc = function(opts) {

                    var chartID = this.chartID,
                        renderer = this.chartRef.renderer || $(chartID).highcharts().renderer;

                    return renderer.arc(opts.centerX, opts.centerY, opts.outerRadius, opts.innerRadius, opts.startAngle, opts.endAngle).attr({
                        name: this.toolID + "_" + opts.text,
                        id: this.toolID + "_" + opts.text,
                        opacity: 0.4,
                        fill: opts.colour || this.drawOptions.stroke,
                        dashStyle: 'dot',
                        stroke: opts.colour || this.drawOptions.stroke,
                        'stroke-width': this.drawOptions['stroke-width'],
                        zIndex: this.drawOptions.fill - 10
                    }).add().toFront();
                }

                FibonacciArc.prototype.updateText = function(opts) {
                    opts.textRef.destroy();
                    return opts.textRef = this.drawText(opts);;
                }

                FibonacciArc.prototype.remove = function(opts) {
                    _(this.fibonacci_intervals).forEach(function(fibonacciPoint) {
                        if (fibonacciPoint.arcRef) {
                            fibonacciPoint.arcRef.destroy();
                            fibonacciPoint.textRef.destroy();
                        }
                    });
                    return this;
                }


                /*    -----------------------------------------------FibonacciArc----------------------------------------------------------*/
                window['FibonacciArc'] = FibonacciArc;
            }


            var FibonacciArc = window['FibonacciArc'];
            var fibonacciArc = new FibonacciArc('FibonacciArc', chartID, {});
            fibonacciArc.openDialog();


        }
    }





});
