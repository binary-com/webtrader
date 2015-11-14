define(['websockets/binary_websockets',"charts/chartingRequestMap"], function(liveapi, chartingRequestMap) {

    var barsTable = chartingRequestMap.barsTable;
    liveapi.events.on('candles', function (data) {
        for ( var index in data.candles ) {
              var eachData = data.candles[index],
                    open  = parseFloat(eachData.open),
                    high  = parseFloat(eachData.high),
                    low   = parseFloat(eachData.low),
                    close = parseFloat(eachData.close),
                    time  = parseInt(eachData.epoch) * 1000,
                    bar   = barsTable.chain()
                                    .find({time : time})
                                    .find({instrumentCdAndTp : data.echo_req.passthrough.instrumentCdAndTp})
                                    .limit(1)
                                    .data();
              if (bar && bar.length > 0) {
                bar = bar[0];
                bar.open = open;
                bar.high = high;
                bar.low = low;
                bar.close = close;
                barsTable.update(bar);
              } else {
                  barsTable.insert({
                        instrumentCdAndTp : data.echo_req.passthrough.instrumentCdAndTp,
                        time: time,
                        open: open,
                        high: high,
                        low: low,
                        close: close
                  });
              }
        }
        barsLoaded(data.echo_req.passthrough.instrumentCdAndTp, chartingRequestMap, barsTable, data.echo_req.passthrough.isTimer, null);
    });
    liveapi.events.on('history', function (data) {
        //For tick history handling
        for (var index in data.history.times) {
            var time = parseInt(data.history.times[index]) * 1000,
                price = parseFloat(data.history.prices[index]),
                bar  = barsTable.chain()
                                    .find({time : time})
                                    .find({instrumentCdAndTp : data.echo_req.passthrough.instrumentCdAndTp})
                                    .limit(1)
                                    .data();
              if (bar && bar.length > 0) {
                bar = bar[0];
                bar.open = price;
                bar.high = price;
                bar.low = price;
                bar.close = price;
                barsTable.update(bar);
              } else {
                  barsTable.insert({
                        instrumentCdAndTp : data.echo_req.passthrough.instrumentCdAndTp,
                        time: time,
                        open: price,
                        high: price,
                        low: price,
                        close: price
                  });
              }
        }
        barsLoaded(data.echo_req.passthrough.instrumentCdAndTp, chartingRequestMap, barsTable, false, null);
    });

    function parseSuffixAndIntValue(timeperiod) {
      var intValInString = timeperiod.toUpperCase().replace('D', '').replace('M', '').replace('W', '');
      var intVal = intValInString == '' ? 1 : parseInt(intValInString);
      var suffix = timeperiod.toUpperCase().replace('' + intVal, '');
      return {
        suffix : suffix,
        intVal : intVal
     };
    };

    function totalSecondsInABar(suffix, intVal) {
      var totalSeconds = 0;
      switch(suffix) {
        case 'M':
          totalSeconds = intVal * 60;
          break;
        case 'H':
          totalSeconds = intVal * 60 * 60;
          break;
        case 'D':
          totalSeconds = intVal * 24 * 60 * 60;
          break;
      }
      return totalSeconds;
    };

    function processOHLC(open, high, low, close, time, type, dataInHighChartsFormat)
    {
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

    function renderChartFirstTime( chart, dataInHighChartsFormat, type, instrumentName, id, series_compare, instrumentCode )
    {
        if( !chart ) return;

        //set the range
        var totalLength = dataInHighChartsFormat.length;
        var endIndex = dataInHighChartsFormat.length > 30 ? totalLength - 30 : 0;

        //if chart.series.length == 0 -> means this the first series getting added to the chart
        //If series_compare == percent, that means, this series is an overlay series
        //if ( series_compare != 'percent' )
        {
            chart.xAxis[0].range = dataInHighChartsFormat[totalLength - 1][0] - dataInHighChartsFormat[endIndex][0]; //show 30 bars
        }

        //console.log('Rendering for : ' + instrumentCode + " " + id);
        var series = chart.addSeries({
            id: id,
            name: instrumentName,
            data: dataInHighChartsFormat,
            type: type ? type : 'candlestick', //area, candlestick, line, areaspline, column, ohlc, scatter,
            dataGrouping: {
                enabled: false
            },
            compare: series_compare
        });
        series.isDirty = true;
        //Its our variable
        $(series).data('isInstrument', true);//Currently used to indicate that this series is holding the chart OHLC or close data
        series.isDirtyData = true;

        //Add current price indicator
        $(document).oneTime(1000, null, function () {
            series.addCurrentPrice();
            chart.redraw();
        });

        chart.hideLoading();
    }

    function barsLoaded(instrumentCdAndTp, chartingRequestMap, barsTable, isTimer, specific_containerIDWithHash) {

            var key = instrumentCdAndTp;
            if (!chartingRequestMap[key])
                return;
            var chartIDList = chartingRequestMap[key].chartIDs;
            if (specific_containerIDWithHash) {
                var chartID = undefined;
                chartIDList.forEach(function (value) {
                    if (value.containerIDWithHash == specific_containerIDWithHash) {
                        chartID = value;
                        return false;
                    }
                });
                var chart = $(specific_containerIDWithHash).highcharts();
                //We just want to get bars which are after the last complete rendered bar on chart(excluding the currently forming bar because that might change its values)
                var db_bars = barsTable.chain()
                                        .find({instrumentCdAndTp : key})
                                        .simplesort('time', false).data();
                var dataInHighChartsFormat = [], type = $(specific_containerIDWithHash).data('type');
                for (var barIndex in db_bars) {
                    processOHLC(db_bars[barIndex].open, db_bars[barIndex].high, db_bars[barIndex].low, db_bars[barIndex].close, 
                        db_bars[barIndex].time, type, dataInHighChartsFormat);
                }
                console.log('series_compare : ', chartID.series_compare, ", instrumentCode : ", chartID.instrumentCode,
                                ', instrumentName : ', chartID.instrumentName);
                renderChartFirstTime(chart, dataInHighChartsFormat, type, chartID.instrumentName, key, chartID.series_compare, chartID.instrumentCode);

            } else {
                for (var index in chartIDList) {
                    var chartID = chartIDList[index];
                    if (isTimer) 
                    {
                        var series = $(chartID.containerIDWithHash).highcharts().get(instrumentCdAndTp);
                        var lastBarOpenTime = series.data[series.data.length - 1].x || series.data[series.data.length - 1].time;
                        var db_bars = barsTable.chain()
                                                .find({instrumentCdAndTp : key})
                                                .where(function(obj) {
                                                    return obj.time >= lastBarOpenTime;
                                                })
                                                .simplesort('time', false).data();
                        for (var index in db_bars) {
                            var dbBar = db_bars[index];
                            //If the bar already exists, then update it, else add a new bar
                            var foundBar = undefined;
                            for(var indx = series.data.length - 1; indx >= 0; indx--) {
                                var value = series.data[indx];
                                if (value && dbBar.time == (value.x || value.time)) {
                                    foundBar = value;
                                    break;
                                }
                            }
                            if (foundBar) {
                                if (type && isDataTypeClosePriceOnly(type)) {
                                    foundBar.update([dbBar.time, dbBar.close]);
                                } else {
                                    foundBar.update([dbBar.time, dbBar.open, dbBar.high, dbBar.low, dbBar.close]);
                                }
                            } else {
                                if (type && isDataTypeClosePriceOnly(type)) {
                                    series.addPoint([dbBar.time, dbBar.close], false, false);
                                } else {
                                    series.addPoint([dbBar.time, dbBar.open, dbBar.high, dbBar.low, dbBar.close], false, false);
                                }
                            }
                            //We have to mark it dirty because for OHLC, Highcharts leave some weird marks on chart that do not belong to OHLC
                            series.isDirty = true;
                            series.isDirtyData = true;
                        }
                        series.chart.redraw();
                    }
                    else 
                    {
                        var chart = $(chartID.containerIDWithHash).highcharts();
                        //We just want to get bars which are after the last complete rendered bar on chart(excluding the currently forming bar because that might change its values)
                        var db_bars = barsTable.chain()
                                                .find({instrumentCdAndTp : key})
                                                .simplesort('time', false).data();
                        var dataInHighChartsFormat = [], 
                                type = $(chartID.containerIDWithHash).data('type');
                        for (var barIndex in db_bars) {
                            processOHLC(db_bars[barIndex].open, db_bars[barIndex].high, db_bars[barIndex].low, db_bars[barIndex].close, 
                                db_bars[barIndex].time, type, dataInHighChartsFormat);
                        }
                        renderChartFirstTime(chart, dataInHighChartsFormat, type, chartID.instrumentName, key, chartID.series_compare, chartID.instrumentCode);
                    }
                }  
            } 

            if ($.isEmptyObject(chartingRequestMap[key].tickStreamingID)) {
                var chartID = chartingRequestMap[key].chartIDs[0];
                var instrumentCode = $(chartID.containerIDWithHash).data('instrumentCode');
                var timeperiod = $(chartID.containerIDWithHash).data('timeperiod');
                //Subscribe to tick streaming
                liveapi.send({
                    "ticks": chartID.instrumentCode,
                    "passthrough": {
                        "instrumentCdAndTp": key
                    }
                });

                if (isTick(timeperiod)) return; //TODO think about what to do for tick charts

                var db_bars = barsTable.chain()
                                .find({instrumentCdAndTp : key})
                                .simplesort('time', true)
                                .limit(1)
                                .data();
                var parsedSuffixAndIntValue = parseSuffixAndIntValue(timeperiod),
                      suffix = parsedSuffixAndIntValue.suffix,
                      intVal = parsedSuffixAndIntValue.intVal,
                      totalSecsInBar = totalSecondsInABar(suffix, intVal);
                var currentFormingBarOpenTime = db_bars[0].time; //In milliseconds
                var nextBarDateInLocal = currentFormingBarOpenTime + totalSecsInBar * 1000;//In seconds
                var dateNow = new Date();

                //If nextBarDateInLocal is less that dateNow.getTime(), that means this is probably a delayed feed
                while (nextBarDateInLocal < dateNow.getTime()) {
                    nextBarDateInLocal += totalSecsInBar * 1000;//In seconds
                }

                console.log(currentFormingBarOpenTime, totalSecsInBar, nextBarDateInLocal, dateNow.getTime());
                //Start a timer to get new bars periodically
                console.log('seconds after which setTimeout will be called : ', Math.ceil(nextBarDateInLocal - dateNow.getTime()) / 1000);
                console.log('seconds after which setInterval will be called : ', totalSecsInBar);

                chartingRequestMap[key].timerHandler = "_" + new Date().getTime();
                //Trigger scheduled time + 1s later. Hitting server before 1s is too early to get current bar
                $(document).oneTime(Math.ceil(nextBarDateInLocal - dateNow.getTime()) + 1000, chartingRequestMap[key].timerHandler, function() {
                    console.log('Set time out called at : ', new Date());

                    function requestBarUpdates() {
                      var lastBar = barsTable.chain()
                                            .find({instrumentCdAndTp : key})
                                            .simplesort('time', true)
                                            .limit(1)
                                            .data();
                      if (lastBar && lastBar.length > 0) {
                        lastBar = lastBar[0];
                        console.log('LastBar : ', lastBar);
                        //requests new bars
                        //Send the WS request
                        var parsedSuffixAndIntValue = parseSuffixAndIntValue(timeperiod),
                              suffix = parsedSuffixAndIntValue.suffix,
                              intVal = parsedSuffixAndIntValue.intVal;
                        var requestObject = {
                            "ticks_history": instrumentCode,
                            "end": 'latest',
                            //"count": count,
                            "start": lastBar.time/1000,
                            "granularity":  totalSecsInBar,
                            "passthrough": {
                                "isTimer": "true",
                                "instrumentCdAndTp" : key
                            }
                          };
                        console.log('Timer based request >> ', JSON.stringify(requestObject));
                        liveapi.send(requestObject);
                      }
                    };

                    //From now onwards we can have one interval timer to update new bars
                    chartingRequestMap[key].timerHandler = "_" + new Date().getTime();
                    $(document).everyTime(totalSecsInBar * 1000, chartingRequestMap[key].timerHandler, requestBarUpdates);

                    requestBarUpdates();

                });

            }
        }
    return {

        /**
         * @param timeperiod
         * @param instrumentCode
         * @param containerIDWithHash
         * @param type
         * @param instrumentName
         * @param firstTimeLoad
         * @param series_compare
         * @param id
         */
        retrieveChartDataAndRender: function( timeperiod, instrumentCode, containerIDWithHash, type, instrumentName, series_compare)
        {

            var parsedSuffixAndIntValue = parseSuffixAndIntValue(timeperiod),
                  suffix = parsedSuffixAndIntValue.suffix,
                  intVal = parsedSuffixAndIntValue.intVal,
                  totalSeconds = totalSecondsInABar(suffix, intVal);
            console.log(suffix, intVal, totalSeconds);

            //We are only going to request 1000 bars if possible
            var numberOfBarsToRequest = 1000;
            if (suffix == 'D' && intVal > 1) {
                numberOfBarsToRequest = Math.floor(numberOfBarsToRequest / intVal);
            }
            var rangeEndDate = Math.ceil(new Date().getTime() / 1000);
            var rangeStartDate = rangeEndDate - numberOfBarsToRequest * totalSeconds;
            var count = Math.ceil((rangeEndDate - rangeStartDate) / totalSeconds);
            if (isTick(timeperiod)) {
                count = 1000;
            }
            console.log('Number of bars requested : ', count);

            if (!$.isEmptyObject(chartingRequestMap[(instrumentCode + timeperiod).toUpperCase()])) {
                //Since streaming for this instrument+timeperiod has already been requested, 
                //we just take note of containerIDWithHash so that once the data is received, we will just
                //call refresh for all registered charts
                chartingRequestMap[(instrumentCode + timeperiod).toUpperCase()].chartIDs.push({
                        containerIDWithHash : containerIDWithHash,
                        series_compare : series_compare,
                        instrumentCode : instrumentCode,
                        instrumentName : instrumentName
                    });   
                //We still need to call refresh the chart with data we already received
                //Use local caching to retrieve that data. 
                barsLoaded((instrumentCode + timeperiod).toUpperCase(), chartingRequestMap, barsTable, false, containerIDWithHash);
                return;
            }
                    
            var key = (instrumentCode + timeperiod).toUpperCase();
            chartingRequestMap[key] = chartingRequestMap[key] || { tickStreamingID: ''};
            chartingRequestMap[key].chartIDs = [
                    {
                        containerIDWithHash : containerIDWithHash,
                        series_compare : series_compare,
                        instrumentCode : instrumentCode,
                        instrumentName : instrumentName
                    }
            ];

            //Send the WS request
            var requestObject = {
                "ticks_history": instrumentCode,
                "end": 'latest',
                "count": count,
                "adjust_start_time" : 1,
                "passthrough": {
                    "instrumentCdAndTp" : (instrumentCode + timeperiod).toUpperCase()
                }
              };
              if (!isTick(timeperiod)) {
                requestObject = $.extend(requestObject, {
                    "start": rangeStartDate,
                    "granularity":  totalSeconds
                });
              }
            console.log(JSON.stringify(requestObject));
            liveapi.send(requestObject);
        }
    };

});
