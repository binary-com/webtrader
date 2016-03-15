/**
 * Created by Arnab Karmakar on 12/7/15.
 */
define(['highstock', 'common/util', 'charts/draw/highcharts_custom/PlotLine'], function() {



    return {

        init: function(chartID) {
            /*    -----------------------------------------------HORIZONTAL-LINE----------------------------------------------------------*/
            if (!window['HorizontalLine']) {

                HorizontalLine = function(chartID, options) {
                    PlotLine.call(this, 'HorizontalLine', chartID, options);
                };
                HorizontalLine.prototype = Object.create(PlotLine.prototype);
                HorizontalLine.prototype.constructor = HorizontalLine;

                HorizontalLine.prototype.remove = function() {
                    this.series.removeHorizontalLine(this.toolID);
                };

                HorizontalLine.prototype.create = function(chartID) {
                    this.addPrototypesOnSeries();
                    this.series.addHorizontalLine(this.drawOptions) || Highcharts.Series.prototype.addHorizontalLine(this.drawOptions);
                }

                HorizontalLine.prototype.addPrototypesOnSeries = function() {
                    (function(H, $) {

                        //Make sure that HighStocks have been loaded
                        //If we already loaded this, ignore further execution
                        if (!H || H.Series.prototype.addHorizontalLine) return;

                        H.Series.prototype.addHorizontalLine = function(horizontalLineOptions) {

                            //Check for undefined
                            //Merge the options
                            var seriesID = this.options.id;
                            var horizontalLineOptions = $.extend({
                                stroke: 'green',
                                'stroke-width': 2,
                                dashStyle: 'solid',
                                parentSeriesID: seriesID
                            }, horizontalLineOptions);

                            var uniqueID = horizontalLineOptions.id || 'HorizontalLine_' + new Date().getTime();
                            //horizontalLineOptionsMap[uniqueID] = horizontalLineOptions;
                            addPlotLines.call(this, uniqueID, horizontalLineOptions, horizontalLineOptions.value);

                            return uniqueID;
                        };

                        H.Series.prototype.removeHorizontalLine = function(uniqueID) {
                            //horizontalLineOptionsMap[uniqueID] = null;
                            //console.log('Before>>' + $(this).data('isInstrument'));
                            this.yAxis.removePlotLine(uniqueID);
                            //console.log('After>>' + $(this).data('isInstrument'));
                        };

                        function addPlotLines(uniqueID, horizontalLineOptions, price) {
                            var zIndex = this.chart.series.length + 1;
                            var isChange = false;
                            if (!this.data[this.data.length - 1]) return;

                            if ($.isNumeric(this.data[this.data.length - 1].change)) {
                                isChange = true;
                                price = toFixed(this.data[this.data.length - 1].change, 2);
                            }
                            //console.log('Series name : ', this.options.name, ",", "Unique ID : ", uniqueID);

                            var name = horizontalLineOptions.name || (price + (isChange ? '%' : ''));


                            var line = this.yAxis.addPlotLine({
                                id: horizontalLineOptions.id || uniqueID,
                                color: horizontalLineOptions.stroke,
                                dashStyle: horizontalLineOptions.dashStyle,
                                width: horizontalLineOptions['stroke-width'],
                                value: price,
                                zIndex: zIndex,
                                label: {
                                    text: name,
                                    align: 'center',
                                    style: {
                                        fontSize: 16,
                                        fontWeight: 'bold'
                                    }
                                },
                                events: {
                                    mousedown: function(e) {
                                        this.down = true;
                                        this.dragStart = e;
                                    },
                                    mouseover: function(e) {
                                        this.over = true
                                    },
                                    mouseout: function(e) {
                                        this.down = false;
                                        this.dragStart = undefined;
                                        
                                    },
                                    mousemove: function(e) {
                                        if (this.over && this.down) {
                                            this.dragEnd = e;                                           
                                            var newPrice = this.axis.toValue(this.dragEnd.offsetY).toFixed(4); 
                                            if (newPrice) {
                                                if (this.axis.getExtremes().min <= newPrice && this.axis.getExtremes().max > newPrice) {
                                                    this.options.value = newPrice;
                                                    this.label.textSetter(newPrice);
                                                    this.render();
                                                }
                                            } 
                                        }
                                    },
                                    mouseup: function(e) {
                                        this.down = false;
                                        this.dragStart = undefined;
                                    }
                                }
                            }).svgElem.css({
                                'cursor': 'pointer'
                            });


                            var toolRef = window['Drawtool'].getDrawTool(horizontalLineOptions.chartID, horizontalLineOptions.id);
                            toolRef.addEventhandlers();


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
                                $.each(yAxis.plotLinesAndBands, function(i, plotLine) {

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

                    }(Highcharts, jQuery));

                }

                window['HorizontalLine'] = HorizontalLine;
            }
            /*    -----------------------------------------------HORIZONTAL-LINE----------------------------------------------------------*/


            var HorizontalLine = window['HorizontalLine'];
            var horizontalLine = new window['HorizontalLine'](chartID, {});
            horizontalLine.openDialog();

        },

        //Fix this while working on draw module.
        //This will be called/needed when lines on chart are going to be moved
        // TODO
        updateHorizontalLineSeries: function(context, newPrice) {

            context.options.value = newPrice;
            context.label.textSetter(newPrice);
            context.render();
        }

    };

});
