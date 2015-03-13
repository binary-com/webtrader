/**
 * Created by arnab on 2/24/15.
 */

define(["common/util", "jquery-timer"], function() {


    //Key is the chartID and value is the instance of EventSourceHandler
    var eventSourceMap = {};

    function processOHLC(eachData, type, dataInHighChartsFormat)
    {

        var open = parseFloat(eachData[2]);
        var high = parseFloat(eachData[3]);
        var low = parseFloat(eachData[4]);
        var close = parseFloat(eachData[5]);
        var time = parseInt(eachData[1]) * 1000;

        //Ignore if last known bar time is greater than this new bar time
        if (dataInHighChartsFormat.length > 0 && dataInHighChartsFormat[dataInHighChartsFormat.length - 1][0] > time) return;


        if (type && isDataTypeClosePriceOnly(type))
        {
            if (!$.isNumeric(time) || !$.isNumeric(close)) return;
            dataInHighChartsFormat.push([time, close]);
        }
        else
        {
            if (!$.isNumeric(time) || !$.isNumeric(open) || !$.isNumeric(high) || !$.isNumeric(low) || !$.isNumeric(close)) return;
            dataInHighChartsFormat.push([time, open, high, low, close]);
        }

    }


    function renderChartFirstTime( chart, dataInHighChartsFormat, type, instrumentName, id, series_compare )
    {

        if( !chart ) return;

        chart.hideLoading();
        //set the range
        var totalLength = dataInHighChartsFormat.length;
        var endIndex = dataInHighChartsFormat.length > 30 ? totalLength - 30 : 0;

        //if chart.series.length == 0 -> means this the first series getting added to the chart
        //if ( !series_compare )
        {
            chart.xAxis[0].range = dataInHighChartsFormat[totalLength - 1][0] - dataInHighChartsFormat[endIndex][0]; //show 30 bars
        }

        chart.addSeries({
            id: id,
            name: instrumentName,
            data: dataInHighChartsFormat,
            type: type ? type : 'candlestick', //area, candlestick, line, areaspline, column, ohlc, scatter,
            dataGrouping: {
                enabled: false
            },
            compare: series_compare
        });

    }

    function nonTickChartUpdate( endTimeInMillis, mainChartSeries, startTimeInMillis, timeInMillis, price, timeperiod, type )
    {

        //console.log(startTimeInMillis + " " + timeInMillis + " " + endTimeInMillis);
        if ( timeInMillis < endTimeInMillis )
        {
            if (timeInMillis >= startTimeInMillis)
            {
                //console.log('Updating data point');
                var last = mainChartSeries.data[mainChartSeries.data.length - 1];
                if ( type && isDataTypeClosePriceOnly(type) )
                {
                    //console.log('I am updating just one data point!');
                    if (!$.isNumeric(price)) return;
                    //Only update when its not in loading mode
                    if (mainChartSeries.chart.series.length <= 2) { //TODO
                        if ($.isNumeric(price))
                        {
                            last.update([last.x, price]);
                        }
                    }
                }
                else
                {
                    var low = last.low;
                    var open = last.open;
                    var close = last.close;
                    var high = last.high;
                    //console.log(timeInMillis + " " + endTimeInMillis + " " + open + " " + high + " " + low + " " + close);
                    if (!$.isNumeric(open) || !$.isNumeric(high) || !$.isNumeric(low) || !$.isNumeric(close)) return;
                    if (open && high && low && close)
                    {
                        if (price < low) {
                            low = price;
                        } else if (price > high) {
                            high = price;
                        }
                        close = price;
                        if ($.isNumeric(open) && $.isNumeric(high) && $.isNumeric(low) && $.isNumeric(close))
                        {
                            last.update([last.x, open, high, low, close]);
                        }
                    }
                }
            }
        }
        else
        {
            //We remove the first data point before adding a new one
            addANewDataPoint( endTimeInMillis, price, mainChartSeries, timeperiod, type );
        }

    }

    function addANewDataPoint( endTimeInMillis, price, series, timeperiod, type )
    {
        if (!$.isNumeric(endTimeInMillis) || !$.isNumeric(price)) return;

        if (series.data && series.data.length > 0)
        {
            series.removePoint(0);
        }
        if (isTick( timeperiod ) || (type && isDataTypeClosePriceOnly(type)))
        {
            series.addPoint([endTimeInMillis, price]);
        }
        else
        {
            series.addPoint([endTimeInMillis, price, price, price, price]);
        }
        console.log("Total bars in memory : " + series.data.length);
    }

    function buildFeedURL(timeperiod, sourceURL) {
        var nowInMillis = new Date().getTime();
        if (isTick(timeperiod)) {
            //Fetch 30 minutes of tick data
            sourceURL += Math.floor(nowInMillis / 1000 - 30 * 60) + "?adjust_start_time=1";
        } else if (isMinute(timeperiod)) {
            var intValue = parseInt(timeperiod.replace('m', ''));
            //Get 1000 bars
            var startTimeInSeconds = (nowInMillis / 1000 - intValue * 60 * 1000);
            startTimeInSeconds = Math.floor(startTimeInSeconds <= 0 ? 1 : startTimeInSeconds);
            sourceURL += startTimeInSeconds + "?adjust_start_time=1&ohlc=" + timeperiod;
        } else if (isHourly(timeperiod)) {
            var intValue = parseInt(timeperiod.replace('h', ''));
            //Get 1000 bars
            var startTimeInSeconds = (nowInMillis / 1000 - intValue * 60 * 60 * 1000);
            startTimeInSeconds = Math.floor(startTimeInSeconds <= 0 ? 1 : startTimeInSeconds);
            sourceURL += startTimeInSeconds + "?adjust_start_time=1&ohlc=" + timeperiod;
        } else {
            var intValue = parseInt(timeperiod.replace('d', ''));
            //Get 1000 bars
            var startTimeInSeconds = (nowInMillis / 1000 - intValue * 24 * 60 * 60 * 1000);
            startTimeInSeconds = Math.floor(startTimeInSeconds <= 0 ? 1 : startTimeInSeconds);
            sourceURL += startTimeInSeconds + "?adjust_start_time=1&ohlc=" + timeperiod;
        }
        return sourceURL;
    }

    /**
     *
     * @param timeperiod
     * @param instrumentCode
     * @param containerIDWithHash
     * @param type
     * @param instrumentName
     * @param firstTimeLoad
     * @param series_compare - Whether to show percent or actual value
     */
    function init( timeperiod, instrumentCode, containerIDWithHash, type, instrumentName, firstTimeLoad, series_compare, id)
    {
        var eventSource = new EventSource(buildFeedURL(timeperiod, "https://stream.binary.com/stream/ticks/" + instrumentCode + "/"));
        if ($.isEmptyObject(eventSourceMap['' + containerIDWithHash])) {
            eventSourceMap['' + containerIDWithHash] = [];
        }
        eventSourceMap['' + containerIDWithHash].push(eventSource);

        firstTimeLoad = firstTimeLoad == null ? true : firstTimeLoad;

        //Generate a unique ID for this
        if (firstTimeLoad)
        {
            eventSource.id = "_" + new Date().getTime();
        }
        else
        {
            eventSource.id = id;
        }

        eventSource.addEventListener("message", function (event) {

            var data = JSON.parse(event.data) || [];
            var dataInHighChartsFormat = [];
            var chart = $(containerIDWithHash).highcharts();
            if (!chart) return;

            for ( var index = 0; index < data.length; index++ )
            {
                var eachData = data[index];

                //First time loading
                if (firstTimeLoad)
                {
                    if (eachData[0] == 'ohlc') {
                        processOHLC(eachData, type, dataInHighChartsFormat);
                    }
                    else if ( isTick(timeperiod) && data[index][0] == 'tick')
                    {
                        var timeInMillis = parseInt(data[index][1]) * 1000;
                        var price = parseFloat(data[index][2]);
                        //Ignore if last known bar time is greater than this new bar time
                        if (dataInHighChartsFormat.length > 0 && dataInHighChartsFormat[dataInHighChartsFormat.length - 1][0] > timeInMillis) continue;
                        dataInHighChartsFormat.push([timeInMillis, price]);
                    }
                }

                //Updating or adding more data in running chart
                else if ( eachData == 'tick' && chart)
                {

                    var series = chart.get(eventSource.id);
                    if( isTick( timeperiod ) )
                    {
                        var timeInMillis = parseInt(data[++index]) * 1000;
                        var price = parseFloat(data[++index]);
                        addANewDataPoint( timeInMillis, price, series, timeperiod, type );
                    }
                    else if (series && series.data && series.data.length > 0)
                    {

                        var timeInMillis = parseInt(data[++index]) * 1000;
                        var lastFormingBarDate = series.data[series.data.length - 1].x;
                        if (!lastFormingBarDate || timeInMillis < lastFormingBarDate) continue;

                        var startTimeInMillis = lastFormingBarDate;
                        var endTimeInMillis = startTimeInMillis;
                        if (isMinute(timeperiod)) {
                            var intValue = parseInt(timeperiod.replace('m', ''));
                            endTimeInMillis += intValue * 60 * 1000;
                        }
                        else if (isHourly(timeperiod)) {
                            var intValue = parseInt(timeperiod.replace('h', ''));
                            endTimeInMillis += intValue * 60 * 60 * 1000;
                        }
                        else if (isDaily(timeperiod)) {
                            var intValue = parseInt(timeperiod.replace('d', ''));
                            endTimeInMillis += intValue * 24 * 60 * 60 * 1000;
                        }
                        var price = parseFloat(data[++index]);


                        //console.log(startTimeInMillis + " " + endTimeInMillis + " " + price);
                        nonTickChartUpdate( endTimeInMillis, series, startTimeInMillis, timeInMillis, price, timeperiod, type );

                    }
                }

            }

            if (firstTimeLoad && dataInHighChartsFormat.length > 0)
            {
                firstTimeLoad = false;
                renderChartFirstTime( $(containerIDWithHash).highcharts(), dataInHighChartsFormat, type, instrumentName, eventSource.id, series_compare );
            }

        }, false);

        eventSource.addEventListener("error", function (event) {
            console.log('Error!');
            eventSource.close();
            //Try it after a second in order to make sure that there are not too many connection requests
            $(document).oneTime(1000, null, function () {
                console.log('Calling init again : ' + timeperiod + " " + instrumentCode + " "
                                                        + containerIDWithHash + " " + type + " " + instrumentName);
                //timeperiod, instrumentCode, containerIDWithHash, type, instrumentName, firstTimeLoad, series_compare, id
                init( timeperiod, instrumentCode, containerIDWithHash, type, instrumentName, false, series_compare, eventSource.id );
            });
            /*require(["jquery", "jquery-growl"], function($) {
             $.growl.error({ message: "Error establishing connection to feed for instrument : " + eventSourceHandler.instrumentName });
             });*/
        });
        eventSource.addEventListener("open", function (event) {
            console.log('Connection opened!');
        });

    }

    return {

        EventSourceHandler : function( containerIDWithHash, instrumentCode, instrumentName, timeperiod, type, series_compare )
        {
            init( timeperiod, instrumentCode, containerIDWithHash, type, instrumentName, true, series_compare );
        },

        close : function ( containerIDWithHash )
        {
            if (!$.isEmptyObject(eventSourceMap['' + containerIDWithHash])) {
                $(eventSourceMap['' + containerIDWithHash]).each(function (index) {
                    console.log('Closing EventSournce instance for container ID : ' + containerIDWithHash + ", index : " + index);
                    this.close();
                })
            }
        }

    };

});
