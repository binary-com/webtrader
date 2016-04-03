/**
 * Created by Ankit on 30 March 2016.
 *
 *   Description:- The graphic tool, The Fibonacci time interval, is a set of vertical lines that are drawn from each other on time intervals,
 *                 which correspond to the numbers of Fibonacci's sequence. Fibonacci Time interval is the tool of the forecast because,
 *                 according to a popular belief, the most significant market events occur through the time intervals corresponding to Fibonacci numbers.
 *   
 *   Inheritence:-  DrawTool
 *                           => Fibonacci
 *                                        => FibonacciTimezone
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
            if (!window['FibonacciTimezone']) {

                /*    -----------------------------------------------FibonacciTimezone----------------------------------------------------------*/
                FibonacciTimezone = function(type, chartID, options) {

                    Fibonacci.call(this, type, chartID, options);

                    // Keeping bindOnce to true will limit the Drawing to One Instance per User-Interaction
                    this.drawOnce = true;
                    this.decimals = 4;

                    // Show the Actual Value at the Fibonacci Interval  Example:-  "50% (1860.555)"
                    this.displayIntervalValue = true;                   

                    // Overwriting the Default Fibonacci Sequence
                    this.fibonacci_intervals = this.getFibonacciSequence();

                };
                FibonacciTimezone.prototype = Object.create(Fibonacci.prototype);
                FibonacciTimezone.constructor = FibonacciTimezone;

                FibonacciTimezone.prototype.updateCalculations = function() {

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


                    // this.upTrend = this.isUpTrend(end.yPos, start.yPos);
                    this.forwardTrend = this.isForwardTrend(start.xPos, end.xPos);

                    //var distance = this.getDistance();

                    // Horizontal Cartesian Distance between the StartPoint & EndPoint 
                    var dX = Math.abs(end.xPos - start.xPos);

                    // Vertical Cartesian Distance between the StartPoint & EndPoint 
                    //var dY = Math.abs(end.yPos - start.yPos);

                    _(this.fibonacci_intervals).forEach(function(fibonacciPoint, idx) {
                        fibonacciPoint.xPos = start.xPos + ((self.forwardTrend) ? dX * fibonacciPoint.value : -dX * fibonacciPoint.value);
                        fibonacciPoint.yPos = start.yPos;

                        var pointValues = self.getValueFromCoordinates(fibonacciPoint.xPos, fibonacciPoint.yPos);

                        fibonacciPoint.xValue = pointValues.x;
                        fibonacciPoint.yValue = pointValues.y;
                    });

                    return this;
                }

                FibonacciTimezone.prototype.draw = function() {

                    var self = this;
                    _(this.fibonacci_intervals).forEach(function(fibonacciPoint) {

                        if (fibonacciPoint.lineRef) {
                            fibonacciPoint.lineRef.destroy();
                            fibonacciPoint.lineRef = self.drawTimezoneLine(fibonacciPoint);

                        } else {
                            fibonacciPoint.lineRef = self.drawTimezoneLine(fibonacciPoint);
                        }
                    });
                    return this;
                }

                FibonacciTimezone.prototype.getTextString = function(opts) {
                    return opts.text + ((this.displayIntervalValue) ? "    (" + this.getDateTimeString(opts.xValue) + ")" : "");
                }

                FibonacciTimezone.prototype.drawTimezoneLine = function(opts) {

                    var chartID = this.chartID,
                        renderer = this.chartRef.renderer || $(chartID).highcharts().renderer,
                        axis = this.chartRef.xAxis[0];

                    return axis.addPlotLine({
                        id: this.toolID + "_" + opts.text,
                        color: opts.colour || this.drawOptions.stroke,
                        dashStyle: 'solid',
                        width: this.drawOptions['stroke-width'],
                        value: opts.xValue,
                        zIndex: this.drawOptions.fill - 10,
                        label: {
                            text: this.getTextString(opts),
                            align: 'left',
                            verticalAlign: 'middle',
                            textAlign: 'center',
                            style: {
                                color: this.drawOptions.textColor || '#a7a7a7',
                                fontSize: this.drawOptions.fontSize || 12,
                                fontWeight: 'bold'
                            }
                        }
                    });
                }

                FibonacciTimezone.prototype.remove = function(opts) {
                    _(this.fibonacci_intervals).forEach(function(fibonacciPoint) {
                        if (fibonacciPoint.lineRef) {
                            fibonacciPoint.lineRef.destroy();
                        }
                    });
                    return this;
                }


                /*    -----------------------------------------------FibonacciTimezone----------------------------------------------------------*/
                window['FibonacciTimezone'] = FibonacciTimezone;
            }


            var FibonacciTimezone = window['FibonacciTimezone'];
            var fibonacciTimezone = new FibonacciTimezone('FibonacciTimezone', chartID, {});
            fibonacciTimezone.openDialog();


        }
    }





});
