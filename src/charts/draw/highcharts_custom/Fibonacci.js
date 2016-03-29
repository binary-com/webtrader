/**
 * Created by Ankit on 23 March 2016.
 *
 *   Description:- The Fibonacci retracements pattern can be useful for swing traders to identify reversals on a stock chart.
 *   
 * 
 *   References:-  http://www.investopedia.com/ask/answers/05/fibonacciretracement.asp
 *                 http://www.swing-trade-stocks.com/fibonacci-retracements.html   
 *                 http://www.onlinetradingconcepts.com/TechnicalAnalysis/Fibonacci.html  
 *   
 */





define(['lodash', 'highstock', 'charts/draw/highcharts_custom/DrawingBase'], function(_) {

    if (!window['DrawTool']) {
        return;
    }


    var getFibonacciIntervals = function() {
        return [{
            colour: '#857676',
            text: '0%',
            value: 0
        }, {
            colour: '#c7392a',
            text: '23.6%',
            value: 0.236
        }, {
            colour: '#8bcc29',
            text: '38.2%',
            value: 0.382
        }, {
            colour: '#29cc34 ',
            text: '50%',
            value: 0.5
        }, {
            colour: '#2ac79a',
            text: '61.8%',
            value: 0.618
        }, {
            colour: '#3193c4',
            text: '78.6%',
            value: 0.786
        }, {
            colour: '#767685',
            text: '100%',
            value: 1
        }, {
            colour: '#5656d6',
            text: '161%',
            value: 1.61
        }, {
            colour: '#d44a4a',
            text: '261%',
            value: 2.61
        }, {
            colour: '#9329cc',
            text: '361.8%',
            value: 3.618
        }, {
            colour: '#cc2993',
            text: '423.6%',
            value: 4.236
        }];
    };

    var mergeCustomInterval = function(fibonacciIntervals, customIntervals) {
        var min = 0,
            max = 5;

        // Merging Custom Intervals with the Main Fibonacci Intervals
        _.each(customIntervals, function(customInterval) {
            if (customInterval.value > min && customInterval.value <= max) {
                fibonacciIntervals.push(customInterval);
            }
        });
        return _.sortBy(fibonacciIntervals, 'value');
    };


    if (!window['Fibonacci']) {

        /*    -----------------------------------------------Fibonacci----------------------------------------------------------*/
        Fibonacci = function(type, chartID, options) {

            DrawTool.call(this, type, chartID, options);

            // Keeping bindOnce to true will limit the Drawing of item to One Instance per User-Interaction
            this.drawOnce = true;
            this.decimals = 4;

            // True if user selects a stock trend gaining momentum, false otherwise
            this.upTrend = true;

            // True if EndDate is after Start Date
            this.forwardTrend = true;

            this.fibonacci_intervals = getFibonacciIntervals();

        };
        Fibonacci.prototype = Object.create(DrawTool.prototype);
        Fibonacci.constructor = Fibonacci;

        Fibonacci.prototype.addEventhandlers = function(drawOptions) {

            if (this.drawOptions.customIntervals) {
                this.fibonacci_intervals = mergeCustomInterval(this.fibonacci_intervals, this.drawOptions.customIntervals);
            }
            this.drawOptions = this.drawOptions || this.getDefaultDrawOptions();
            this.drawOptions.id = this.toolID;
            this.bindDrag(null, this.dragHandler);
        }

        Fibonacci.prototype.drawLine = function(opts) {

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

        Fibonacci.prototype.dragHandler = function() {
            this.updateCalculations().draw();
        }
        Fibonacci.prototype.removeEventhandlers = function() {
            this.unBindClick(this.clickHandler);
        }

        Fibonacci.prototype.isUpTrend = function(startY, endY) {
            return startY < endY;
        }

        Fibonacci.prototype.getOnlyRequiredIntervals = function(peakPoint) {
            return _(this.fibonacci_intervals).filter(function(fibonacciPoint) {
                return fibonacciPoint.value <= peakPoint.value;
            }).sortBy('value').value();
        };

        Fibonacci.prototype.isForwardTrend = function(startX, endX) {
            return startX < endX;
        }

        /*    -----------------------------------------------Fibonacci----------------------------------------------------------*/
        window['Fibonacci'] = Fibonacci;
    }

});
