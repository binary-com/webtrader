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


    if (!window['Fibonacci']) {

        /*    -----------------------------------------------Fibonacci----------------------------------------------------------*/
        Fibonacci = function(type, chartID, options) {

            DrawTool.call(this, type, chartID, options);

            // Keeping bindOnce to true will limit the Drawing of item to One Instance per User-Interaction
            this.drawOnce = true;
            this.decimals = 4;

            // True if user selects a stock trend gaining momentum, false otherwise
            this.isUpTrend = true;
            // True if EndDate is after Start Date
            this.isForwardTrend = true;

            this.fibonacci_intervals = getFibonacciIntervals();

        };
        Fibonacci.prototype = Object.create(DrawTool.prototype);
        Fibonacci.constructor = Fibonacci;

        Fibonacci.prototype.addEventhandlers = function(drawOptions) {
            this.drawOptions = this.drawOptions || this.getDefaultDrawOptions();
            this.drawOptions.id = this.toolID;
            this.bindDrag(null, this.dragHandler);
        }

        Fibonacci.prototype.dragHandler = function() {
            this.updateCalculations().draw();
        }
        Fibonacci.prototype.removeEventhandlers = function() {
            this.unBindClick(this.clickHandler);
        }

        Fibonacci.prototype.draw = function() {
            return;
        }

        Fibonacci.prototype.updateCalculations = function() {

            var self = this;



            var end = {
                    xPos: this.startPos.x,
                    yPos: this.startPos.y,

                    xValue: this.startPos.xValue | 0,
                    yValue: this.startPos.yValue | 0
                },
                start = {
                    xPos: this.endPos.x,
                    yPos: this.endPos.y,

                    xValue: this.endPos.xValue | 0,
                    yValue: this.endPos.yValue | 0
                };


            this.isUpTrend = true;
            if (start.yPos < end.yPos) {
                this.isUpTrend = false;
            }
            
            this.isForwardTrend = true;
            if (start.xPos < end.xPos) {
                this.isForwardTrend = false;
            }

            _(this.fibonacci_intervals).forEach(function(fibonacciPoint, idx) {

                // LINE COORDINATES
                fibonacciPoint.y1 = fibonacciPoint.y2 = start.yPos + (end.yPos - start.yPos) * fibonacciPoint.value;
                fibonacciPoint.x1 = start.xPos;
                fibonacciPoint.x2 = end.xPos;


                var startPos = self.getValueFromCoordinates(fibonacciPoint.x1, fibonacciPoint.y1);
                var endPos = self.getValueFromCoordinates(fibonacciPoint.x2, fibonacciPoint.y2);


                // LINE VALUES
                fibonacciPoint.x1Value = startPos.x;
                fibonacciPoint.y1Value = startPos.y;
                fibonacciPoint.x2Value = endPos.x;
                fibonacciPoint.y2Value = endPos.y;

            });

            return this;
        }



        /*    -----------------------------------------------Fibonacci----------------------------------------------------------*/
        window['Fibonacci'] = Fibonacci;
    }

});
