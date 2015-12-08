/**
 * Created by Arnab Karmakar on 12/7/15.
 */
define(['indicator_base', 'highstock'], function (indicatorBase) {

    /*
         This is a map storing information as -
         horizontalLineOptions[seriesID] = {
             stroke : 'red',
             strokeWidth : 1,
             dashStyle : 'dash',
             parentSeriesID : seriesID
         }
     */
    var horizontalLineOptionsMap = {};

    return {

        init: function() {

            (function(H,$,indicatorBase){

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addHorizontalLine) return;

                H.Series.prototype.addHorizontalLine = function ( horizontalLineOptions ) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    horizontalLineOptions = $.extend({
                        stroke : 'green',
                        strokeWidth : 2,
                        dashStyle : 'solid',
                        parentSeriesID : seriesID
                    }, horizontalLineOptions);

                    var uniqueID = '_' + new Date().getTime();
                    horizontalLineOptionsMap[uniqueID] = horizontalLineOptions;
                    addPlotLines.call(this, uniqueID, horizontalLineOptions, horizontalLineOptions.value);

                    return uniqueID;

                };

                H.Series.prototype.removeHorizontalLine = function (uniqueID) {
                    horizontalLineOptionsMap[uniqueID] = null;
                    //console.log('Before>>' + $(this).data('isInstrument'));
                    this.yAxis.removePlotLine('HorizontalLine' + uniqueID);
                    //console.log('After>>' + $(this).data('isInstrument'));
                }

                /**
                 * TODO -> Review it
                 * This function should be called in the context of series object
                 * @param options - The data update values
                 * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
                 */
                function updateHorizontalLineSeries(options, isPointUpdate) {
                    //if this is HorizontalLine series, ignore
                    if (this.options.name.indexOf('HorizontalLine') == -1) {
                        var series = this;
                        var lastData = series.options.data[series.data.length - 1];
                        var yAxis = this.yAxis;
                        $.each(yAxis.plotLinesAndBands, function (i, plotLine) {

                            var id = plotLine.options.id;
                            if (!id) return;

                            var horizontalLineOptions = horizontalLineOptionsMap[id.replace('HorizontalLine', '')];
                            if (horizontalLineOptions && horizontalLineOptions.parentSeriesID == series.options.id) {
                                yAxis.removePlotLine(id);
                                //get close price from OHLC or the current price of line charts
                                var price = lastData.y || lastData.close || lastData[4] || lastData[1];
                                addPlotLines.call(series, id.replace('HorizontalLine', ''), horizontalLineOptionsMap[id.replace('HorizontalLine', '')], price);
                            }
                        });
                        return false;
                    }
                }

                function addPlotLines(uniqueID, horizontalLineOptions, price) {
                    var zIndex = this.chart.series.length + 1;
                    var isChange = false;
                    if (!this.data[this.data.length - 1]) return;

                    if ($.isNumeric(this.data[this.data.length - 1].change)) {
                        isChange = true;
                        price = indicatorBase.toFixed(this.data[this.data.length - 1].change, 2);
                    }
                    console.log('Series name : ', this.options.name, ",", "Unique ID : ", uniqueID);
                    var name = horizontalLineOptions.name || (price + (isChange ? '%' : ''));
                    this.yAxis.addPlotLine({
                        id: 'HorizontalLine' + uniqueID,
                        color: horizontalLineOptions.stroke,
                        dashStyle: horizontalLineOptions.dashStyle,
                        width: horizontalLineOptions.strokeWidth,
                        value: price,
                        zIndex: zIndex,
                        label: {
                            text: name,
                            align: 'center'
                        }
                    });
                }

            }(Highcharts, jQuery, indicatorBase));

        },

        //Fix this while working on draw module.
        //This will be called/needed when lines on chart are going to be moved
        // TODO
        updateHorizontalLineSeries : function(series, options) {
            updateHorizontalLineSeries.call(series, options, true);
        }

    };

});
