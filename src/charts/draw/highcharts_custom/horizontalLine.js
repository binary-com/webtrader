/**
 * Created by Arnab Karmakar on 12/7/15.
 */
//define(['highstock', 'common/util', 'jquery-ui', 'color-picker', 'ddslick'], function() {
define(['charts/draw/highcharts_custom/lineDrawOptions/lineDrawOptions','highstock', 'common/util'], function(lineDrawDialog) {    

    //This Object will hold All Instances/Information of this DrawTool for every Chart
    var drawToolMapping = {};  
    

    //Default Draw options
    var defaultDrawToolOptions = {
        stroke: 'green',
        strokeWidth: 2,
        dashStyle: 'solid',
        parentSeriesID: null,
        chartID: null, // ChartID
        uniqueID: null, // Unique Numeric ID
        uniqueName: null, // Name + (Unique Numeric ID)
        seriesRef: null, // Highchart Main Series Reference
        lineRef: null, // Highchart DrawTool Reference
        destroy: null // Function to Remove the DrawTool
    };


     var eventHandlerInfo={
        type:'click touch',
        handler:bindHandlers
    }

    // Event handlers for the Draw Operation
    function bindHandlers(e) {
        try {
            var chartID = e.data.chartID,
                drawOptions = e.data.drawOptions,
                seriesRef = e.data.drawOptions.seriesRef;

            if (e.originalEvent.xAxis) {

                drawOptions.time = e.originalEvent.xAxis[0].value;
                drawOptions.value = e.originalEvent.yAxis[0].value;

                (seriesRef) ? seriesRef.addHorizontalLine(drawOptions): $(chartID).highcharts().series[0].addHorizontalLine(drawOptions);
            }

        } catch (ex) {

            console.error('Error on Drawing:' + ex.message);
        }
    }

    function unbindHandlers(chartID) {
        $(chartID).off(eventHandlerInfo.type, eventHandlerInfo.handler);
    }    

    function init(chartID) {


        (function(H, $) {

            //var chartRef = null,
            //savedMouseMove = {};

            //Make sure that HighStocks have been loaded
            //If we already loaded this, ignore further execution
            if (!H || H.Series.prototype.addHorizontalLine) return;

            H.Series.prototype.addHorizontalLine = function(horizontalLineOptions) {

                //Check for undefined
                var seriesID = this.options.id;
                //Merge the options
                var horizontalLineOptions = $.extend({}, defaultDrawToolOptions, horizontalLineOptions);

                //Generating UniqueID for the HorizontalLine
                var uniqueID = horizontalLineOptions.uniqueID = '_' + new Date().getTime();
                var uniqueName = horizontalLineOptions.uniqueName = 'HorizontalLine' + uniqueID;

                if (!drawToolMapping[horizontalLineOptions.chartID]) {
                    drawToolMapping[horizontalLineOptions.chartID] = [];
                }


                //Adding Line Destroy Method on the Mapping itself
                horizontalLineOptions.destroy = removePlotLine.bind(this, uniqueName, horizontalLineOptions.chartID);



                // Mapping Multiple Horizontal Lines to a Specific Chart
                drawToolMapping[horizontalLineOptions.chartID].push(horizontalLineOptions);

                addPlotLines.call(this, uniqueID, horizontalLineOptions, horizontalLineOptions.value);




                return uniqueID;

            };

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



                    plotlineRef.options( /*SET NEW OPTIONS SUCH AS VALUE*/ );

                    /* RE-RENDEREING WILL UPDATE THE POSITION*/
                    plotlineRef.render();


                    $.each(yAxis.plotLinesAndBands, function(i, plotLine) {

                        var id = plotLine.options.id;
                        if (!id) return;

                        var horizontalLineOptions = drawToolMapping[id.replace('HorizontalLine', '')];
                        if (horizontalLineOptions && horizontalLineOptions.parentSeriesID == series.options.id) {
                            yAxis.removePlotLine(id);
                            //get close price from OHLC or the current price of line charts
                            var price = lastData.y || lastData.close || lastData[4] || lastData[1];
                            addPlotLines.call(series, id.replace('HorizontalLine', ''), drawToolMapping[id.replace('HorizontalLine', '')], price);
                        }
                    });
                    return false;
                }
            }

            H.Series.prototype.removeHorizontalLine = function(uniqueID) {
                drawToolMapping[uniqueID] = null;
                //console.log('Before>>' + $(this).data('isInstrument'));
                this.yAxis.removePlotLine('HorizontalLine' + uniqueID);
                //console.log('After>>' + $(this).data('isInstrument'));
            }




            function addPlotLines(uniqueID, horizontalLineOptions, price) {
                var zIndex = this.chart.series.length + 1;
                var isChange = false;
                //if (!this.data[this.data.length - 1]) return;

                // if ($.isNumeric(this.data[this.data.length - 1].change)) {
                //     isChange = true;
                //     price = toFixed(this.data[this.data.length - 1].change, 2);
                // }
                //console.log('Series name : ', this.options.name, ",", "Unique ID : ", uniqueID);
                var name = horizontalLineOptions.name || (price + (isChange ? '%' : ''));
                horizontalLineOptions.lineRef = this.chart.yAxis[0].addPlotLine({
                    id: horizontalLineOptions.uniqueName || 'HorizontalLine' + uniqueID,
                    color: horizontalLineOptions.stroke || "#000",
                    dashStyle: horizontalLineOptions.dashStyle || "solid",
                    width: horizontalLineOptions.strokeWidth || 2,
                    value: Number(price.toFixed("2")),
                    zIndex: zIndex,
                    events: {
                        click: function(e) {

                            console.log('click');
                            e.preventDefault();
                            e.stopPropagation()
                            // returning false so that it do not Draw a line over the current line
                            //return false;
                        },
                        mousedown: function() {
                            this.pressed = true;

                            console.log('mouse downnn');
                        },
                        mouseup: function() {
                            this.pressed = false
                            console.log('mouse upppppp');
                        },
                        mousemove: function(e) {
                            if (this.pressed) {
                                console.log('mouse dragged');
                            }
                            console.log('mouse moved');
                        },
                        mouseover: function() {
                            console.log('mouseover');
                        },
                        mouseout: function() {
                            console.log('mouseout');
                        }
                    },
                    label: {
                        text: name,
                        align: 'right'
                    }
                });
            }


            /**                
             * This function will remove the DrawTool Instance Info from the Mapping
             * @param id - The UniqueID of the DrawTool Instance
             * @param chartID - The ChartID on which the DrawTool is plotted
             */
            function removeDrawToolInstance(id, chartID) {

                var index = null;

                return $.each(drawToolMapping[chartID], function(idx, value) {
                    if (id == value.uniqueName) {
                        index = idx;
                    }
                }).splice(index, 1) || null;
            }


            /**                
             * This function should be called in the context of series object
             * @param options - The data update values
             * @param isPointUpdate - true if the update call is from Point.update, false for Series.update call
             */
            function removePlotLine(id, chartID) {

                if (this.yAxis) {
                    this.yAxis.removePlotLine(id);
                } else {
                    var chartRef = $(chartID).highcharts();
                    chartRef.yAxis[0].removePlotLine(id);
                }

                removeDrawToolInstance(id, chartID);

                //Returning 'this' for chaining purposes
                return this;
            }

        }(Highcharts, jQuery));

    }


    return {
        //Initializes Horizontal DrawTool Feature on the Highchart.Series.prototype
        //Also preloads(fetches using RequireJS) an optional Draw Tool Dialog Box files (HTML/CSS)
        init: init,
        //Maps All Instances of this Draw Tool  
        drawToolMapping: drawToolMapping,
        //Fix this while working on draw module.
        //This will be called/needed when lines on chart are going to be moved
        // TODO
        updateHorizontalLineSeries: function(series, options) {
            updateHorizontalLineSeries.call(series, options, true);
        },
        openDialog: function(dialogID, containerIDWithHash) {
            lineDrawDialog.openDialog(dialogID, containerIDWithHash,eventHandlerInfo);
        },
        unbindHandlers: unbindHandlers,
        //Removes All Horizontal Lines from the given Chart
        removeAllHorizontalLines: function(toolID, chartID) {

        }

    };

});
