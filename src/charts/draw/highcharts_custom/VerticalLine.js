/**
 * Created by Arnab Karmakar on 12/7/15.
 */
define(['highstock', 'common/util', 'charts/draw/highcharts_custom/PlotLine'], function() {



    return {

        init: function(chartID) {
            /*    -----------------------------------------------VERTICAL-LINE----------------------------------------------------------*/
            if (!window['VerticalLine']) {

                VerticalLine = function(chartID, options) {
                    PlotLine.call(this, 'VerticalLine', chartID, options);
                };
                VerticalLine.prototype = Object.create(PlotLine.prototype);
                VerticalLine.prototype.constructor = VerticalLine;

                VerticalLine.prototype.remove = function() {
                    this.series.removeVerticalLine(this.toolID);
                };

                VerticalLine.prototype.create = function(chartID) {
                    this.series.addVerticalLine(this.drawOptions) || Highcharts.Series.prototype.addVerticalLine(this.drawOptions);
                }
                window['VerticalLine'] = VerticalLine;
            }
            /*    -----------------------------------------------VERTICAL-LINE----------------------------------------------------------*/


            var VerticalLine = window['VerticalLine'];
            var verticalLine = new window['VerticalLine'](chartID, {});
            verticalLine.openDialog();



            (function(H, $) {

                //Make sure that HighStocks have been loaded
                //If we already loaded this, ignore further execution
                if (!H || H.Series.prototype.addVerticalLine) return;

                H.Series.prototype.addVerticalLine = function(verticalLineOptions) {

                    //Check for undefined
                    //Merge the options
                    var seriesID = this.options.id;
                    var verticalLineOptions = $.extend({
                        stroke: 'green',
                        'stroke-width': 2,
                        dashStyle: 'solid',
                        parentSeriesID: seriesID
                    }, verticalLineOptions);

                    var uniqueID = verticalLineOptions.id || 'VerticalLine_' + new Date().getTime();
                    addPlotLines.call(this, uniqueID, verticalLineOptions, verticalLineOptions.time);
                    return uniqueID;
                };

                H.Series.prototype.removeVerticalLine = function(uniqueID) {
                    //horizontalLineOptionsMap[uniqueID] = null;
                    //console.log('Before>>' + $(this).data('isInstrument'));
                    this.xAxis.removePlotLine(uniqueID);
                    //console.log('After>>' + $(this).data('isInstrument'));
                };


                function getDateTimeString(unixTimeStamp) {
                    var date = new Date(unixTimeStamp);
                    var dateArr = date.toString().split(' ').splice(0, 5);
                    return dateArr[0] + ", " + dateArr[1] + " " + dateArr[2] + " " + dateArr[3] + " " + dateArr[4];
                }

                function addPlotLines(uniqueID, verticalLineOptions, time) {
                    var zIndex = this.chart.series.length + 1;

                    var dateTime = getDateTimeString(time);

                    var line = this.xAxis.addPlotLine({
                        id: verticalLineOptions.id || uniqueID,
                        color: verticalLineOptions.stroke,
                        dashStyle: verticalLineOptions.dashStyle,
                        width: verticalLineOptions['stroke-width'],
                        value: time,
                        zIndex: zIndex,
                        label: {
                            text: dateTime,
                            align: 'left',
                            verticalAlign: 'middle',
                            textAlign: 'center',
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
                                    var newTime = this.axis.toValue(this.dragEnd.offsetX);

                                    if (newTime) {
                                        if (this.axis.getExtremes().min <= newTime && this.axis.getExtremes().max > newTime) {
                                            this.options.value = newTime;

                                            this.label.textSetter(getDateTimeString(newTime));
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


                    var toolRef = window['Drawtool'].getDrawTool(verticalLineOptions.chartID, verticalLineOptions.id);
                    toolRef.addEventhandlers();


                }

            }(Highcharts, jQuery));
        },

        //Fix this while working on draw module.
        //This will be called/needed when lines on chart are going to be moved
        // TODO
        updateVerticalLineSeries: function(context, newPrice) {

            context.options.value = newPrice;
            context.label.textSetter(newPrice);
            context.render();
        }

    };

});
