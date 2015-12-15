/**
 * Created by Arnab Karmakar on 12/7/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    /*
     This is a map storing information as -
     verticalLineOptions[seriesID] = {
         stroke : 'red',
         strokeWidth : 1,
         dashStyle : 'dash',
         parentSeriesID : seriesID
     }
     */
    var verticalLineOptionsMap = {};

    return {

        init: function() {

            (function(H,$,indicatorBase){

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addVerticalLine) return;

                H.Series.prototype.addVerticalLine = function ( verticalLineOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    verticalLineOptions = $.extend({
                        stroke : 'orange',
                        strokeWidth : 2,
                        dashStyle : 'solid',
                        parentSeriesID : seriesID
                    }, verticalLineOptions);

                    var uniqueID = '_' + new Date().getTime();
                    verticalLineOptionsMap[uniqueID] = verticalLineOptions;
                    addPlotLines.call(this, uniqueID, verticalLineOptions, verticalLineOptions.value);

                    return uniqueID;

                };

                H.Series.prototype.removeVerticalLine = function (uniqueID) {
                    verticalLineOptionsMap[uniqueID] = null;
                    //console.log('Before>>' + $(this).data('isInstrument'));
                    this.yAxis.removePlotLine('VerticalLine' + uniqueID);
                    //console.log('After>>' + $(this).data('isInstrument'));
                }

                /**
                 * TODO -> Review it
                 * This function should be called in the context of series object
                 * @param options - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateVerticalLineSeries(options, isPointUpdate) {
                    //if this is VerticalLine series, ignore
                    if (this.options.name.indexOf('VerticalLine') == -1) {
                        var series = this;
                        var lastData = series.options.data[series.data.length - 1];
                        var yAxis = this.yAxis;
                        $.each(yAxis.plotLinesAndBands, function (i, plotLine) {

                            var id = plotLine.options.id;
                            if (!id) return;

                            var verticalLineOptions = verticalLineOptionsMap[id.replace('VerticalLine', '')];
                            if (verticalLineOptions && verticalLineOptions.parentSeriesID == series.options.id) {
                                yAxis.removePlotLine(id);
                                //get close price from OHLC or the current price of line charts
                                var price = lastData.y || lastData.close || lastData[4] || lastData[1];
                                addPlotLines.call(series, id.replace('VerticalLine', ''), verticalLineOptionsMap[id.replace('VerticalLine', '')], price);
                            }
                        });
                        return false;
                    }
                }

                function addPlotLines(uniqueID, verticalLineOptions, time) {
                    var zIndex = this.chart.series.length + 1;
                    if (!this.data[this.data.length - 1]) return;

                    //console.log('Series name : ', this.options.name, ",", "Unique ID : ", uniqueID);
                    var name = verticalLineOptions.name || time;
                    this.xAxis.addPlotLine({
                        id: 'VerticalLine' + uniqueID,
                        color: verticalLineOptions.stroke,
                        dashStyle: verticalLineOptions.dashStyle,
                        width: verticalLineOptions.strokeWidth,
                        value: time,
                        zIndex: zIndex,
                        label: {
                            text: name,
                            verticalAlign: 'middle'
                        }
                    });
                }

            }(Highcharts, jQuery, indicatorBase));

        },

        //Fix this while working on draw module.
        //This will be called/needed when lines on chart are going to be moved
        // TODO
        updateVerticalLineSeries : function(series, options) {
            updateVerticalLineSeries.call(series, options, true);
        }

    };

});