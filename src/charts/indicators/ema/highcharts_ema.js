/**
 * Created by arnab on 3/22/15.
 */
(function(H,$) {

    var OPEN = 0, HIGH = 1, LOW = 2, CLOSE = 3;

    //Make sure that HighStocks have been loaded
    //If we already loaded this, ignore further execution
    if (!H || H.Series.prototype.addEMA) return;

    H.Series.prototype.addEMA = function ( emaOptions ) {

        //Check for undefined
        //Merge the options
        emaOptions = $.extend(true, {}, {
            period : 21,
            stroke : 'red',
            strokeWidth : 2,
            dashStyle : 'line',
            levels : [],
            appliedTo: CLOSE
        }, emaOptions);

        var uniqueID = '_' + new Date().getTime();

        //If this series has data, add ATR series to the chart
        var data = this.options.data || [];
        //If period is higher than data.length, we cannot calculate EMA. Return from here
        if (emaOptions.period >= data.length) return;

        if (data && data.length > 0)
        {

            //Calculate EMA data
            /*  ema(t) = p(t) * 2/(T+1) + ema(t-1) * (1 - 2 / (T+1))
             *  Do not fill any value in emaData from 0 index to options.period-1 index
             */
            var tr = [], emaData = [], sum = 0.0;
            for (var index = 0; index < emaOptions.period; index++)
            {
                if (isOHLCorCandlestick(this.options.type))
                {
                    switch (emaOptions.appliedTo) {
                        case OPEN : sum += data[index].open ? data[index].open : data[index][1];break;
                        case HIGH : sum += data[index].high ? data[index].high : data[index][2];break;
                        case  LOW : sum += data[index].low ? data[index].low : data[index][3];break;
                        case CLOSE : sum += data[index].close ? data[index].close : data[index][4];break;
                    }
                }
                else
                {
                    sum += data[index].y ? data[index].y : data[index][1];
                }
                if (index == (emaOptions.period - 1))
                {
                    emaData.push([data[emaOptions.period - 1].x ? data[emaOptions.period - 1].x : data[emaOptions.period - 1][0], sum / emaOptions.period]);
                }
                else
                {
                    emaData.push([data[emaOptions.period - 1].x ? data[emaOptions.period - 1].x : data[emaOptions.period - 1][0], null]);
                }
            }

            for (var index = emaOptions.period; index < data.length; index++)
            {

                var price = 0.0;
                if (isOHLCorCandlestick(this.options.type))
                {
                    switch (emaOptions.appliedTo) {
                        case OPEN : price = data[index].open ? data[index].open : data[index][1];break;
                        case HIGH : price = data[index].high ? data[index].high : data[index][2];break;
                        case  LOW : price = data[index].low ? data[index].low : data[index][3];break;
                        case CLOSE : price = data[index].close ? data[index].close : data[index][4];break;
                    }
                }
                else
                {
                    price = data[index].y ? data[index].y : data[index][1];
                }

                //Calculate EMA - start
                //ema(t) = p(t) * 2/(T+1) + ema(t-1) * (1 - 2 / (T+1))
                var emaValue = (price * 2 / (emaOptions.period + 1)) +  (emaData[index - 1][1] * (1 - 2 / (emaOptions.period + 1)))
                emaData.push([(data[index].x || data[index][0]), Math.round(emaValue * 10000) / 10000]);
                //Calculate EMA - end

            }

            var chart = this.chart;

            this.emaOptions = this.emaOptions || {};
            this.emaOptions[uniqueID] = emaOptions;

            var series = this;
            this.emaSeries = this.emaSeries || {};
            this.emaSeries[uniqueID] = chart.addSeries({
                id: uniqueID,
                name: 'EMA(' + emaOptions.period  + ', ' + appliedPriceString(emaOptions.period) + ')',
                data: emaData,
                type: 'line',
                dataGrouping: series.options.dataGrouping,
                //yAxis: 'ema'+ uniqueID,
                opposite: series.options.opposite,
                color: emaOptions.stroke,
                lineWidth: emaOptions.strokeWidth,
                dashStyle: emaOptions.dashStyle
            }, false, false);

            //We are update everything in one shot
            chart.redraw();

        }

        return uniqueID;

    };

    H.Series.prototype.removeEMA = function (uniqueID) {
        var chart = this.chart;
        this.emaOptions[uniqueID] = null;
        chart.get(uniqueID).remove();
        this.emaSeries[uniqueID] = null;
    }

    /*
     *  Wrap HC's Series.addPoint
     */
    H.wrap(H.Series.prototype, 'addPoint', function(proceed, options, redraw, shift, animation) {

        proceed.call(this, options, redraw, shift, animation);
        updateEMASeries.call(this, options);

    });

    /*
     *  Wrap HC's Point.update
     */
    H.wrap(H.Point.prototype, 'update', function(proceed, options, redraw, animation) {

        proceed.call(this, options, redraw, animation);

        //if this is a point in EMA series, ignore
        if (this.series.options.name.indexOf('EMA') != -1) return;

        var series = this.series;

        //Update EMA values
        updateEMASeries.call(series, options, true);

    });

    /*
     * Function to find out if it contains OHLC values
     */
    function isOHLCorCandlestick(type) {
        return type == 'candlestick' || type == 'ohlc'
    }

    /**
     * This function should be called in the context of series object
     * @param options - The data update values
     */
    function updateEMASeries(options, isPointUpdate) {
        //if this is EMA series, ignore
        if (this.options.name.indexOf('EMA') == -1) {

            var series = this;
            var chart = series.chart;

            //Add a new EMA data point
            for (var key in this.emaSeries) {
                if (this.emaSeries[key] && this.emaSeries[key].options && this.emaSeries[key].options.data && this.emaSeries[key].options.data.length > 0) {
                    //This is EMA series. Add one more EMA point
                    //Calculate EMA data
                    /*
                     * ema(t) = p(t) * 2/(T+1) + ema(t-1) * (1 - 2 / (T+1))
                     */
                    //Find the data point
                    var data = series.options.data;
                    var emaData = this.emaSeries[key].options.data;
                    var matchFound = false;
                    var n = this.emaOptions[key].period;
                    for (var index = 1; index < data.length; index++) {
                        //Matching time
                        if (data[index][0] === options[0] || data[index].x === options[0] || matchFound) {
                            matchFound = true; //We have to recalculate all EMAs after a match has been found
                            var price = 0.0;
                            if (isOHLCorCandlestick(this.options.type))
                            {
                                switch (this.emaOptions[key].appliedTo) {
                                    case OPEN : price = data[index].open ? data[index].open : data[index][1];break;
                                    case HIGH : price = data[index].high ? data[index].high : data[index][2];break;
                                    case  LOW : price = data[index].low ? data[index].low : data[index][3];break;
                                    case CLOSE : price = data[index].close ? data[index].close : data[index][4];break;
                                }
                            }
                            else
                            {
                                price = data[index].y ? data[index].y : data[index][1];
                            }

                            //Calculate EMA - start
                            var emaValue = (price * 2 / (n + 1)) +  (emaData[index - 1][1] * (1 - 2 / (n + 1)))
                            emaData.push([(data[index].x || data[index][0]), Math.round(emaValue * 10000) / 10000]);
                            if (isPointUpdate)
                            {
                                chart.get(this.emaSeries[key].options.id).data[index].update([(data[index].x || data[index][0]), emaValue]);
                            }
                            else
                            {
                                chart.get(this.emaSeries[key].options.id).addPoint([(data[index].x || data[index][0]), emaValue], false, false);
                                //Most of the time, we add one data point after the main series has been added. This will not be a 
                                //performance issue if that is the scenario. But if add many data points after ATR is added to the
                                //main series, then we should rethink about this code
                                this.emaSeries[key].isDirty = true;
                                this.emaSeries[key].isDirtyData = true;
                                chart.redraw();
                            }
                        }
                    }
                }
            }
        }
    }

    function appliedPriceString(intValue) {
        var ret = 'CLOSE';
        switch (intValue) {
            case OPEN: ret = 'OPEN';break;
            case HIGH: ret = 'HIGH';break;
            case LOW: ret = 'LOW';break;
            case CLOSE: ret = 'CLOSE';break;
        }
        return ret;
    }

})(Highcharts, jQuery);
