/**
 * Created by arnab on 3/30/15.
 */
define(['jquery', 'lodash', 'common/util', 'highcharts-more'], function ($, _) {

    var indicatorsMetaData = [];
    require(['text!charts/indicators/indicators.json'], function (indicatorsJSON) {
        indicatorsMetaData = _.cloneDeep(JSON.parse(indicatorsJSON));
    });

    var indicators = {

        OPEN: 0, HIGH: 1, LOW: 2, CLOSE: 3,

        initHighchartIndicators : function(barsTable) {
            Highcharts.Series.prototype.addIndicator = function(indicatorID, options) {
                var data = barsTable
                            .chain()
                            .find({instrumentCdAndTp: this.options.id})
                            .simplesort('time', false)
                            .data();
                //Class name for all CDL type of indicators is CDL
                var indicatorObject = new window[_.startsWith(indicatorID.toUpperCase(), 'CDL') ? 'CDL' : indicatorID.toUpperCase()](data, options, indicators);
                var series = this;
                var chart = series.chart;
                var indicatorMetadata = indicatorsMetaData[indicatorID];
                if (indicatorMetadata) {
                    var seriesAndAxisConfArr = indicatorObject.buildSeriesAndAxisConfFromData(indicatorMetadata);
                    seriesAndAxisConfArr.forEach(function(seriesAndAxisConfArr) {
                        if (seriesAndAxisConfArr.axisConf) {
                            chart.addAxis(seriesAndAxisConfArr.axisConf, false, false, false);
                            indicators.recalculate(chart);
                        }
                        if (seriesAndAxisConfArr.seriesConf) {
                            var conf = _.extend(seriesAndAxisConfArr.seriesConf, {
                                dataGrouping : series.options.dataGrouping,
                                opposite : series.options.opposite
                            });
                            if (indicatorMetadata.onChartIndicator) {
                                conf = _.extend(conf, {
                                    compare : series.options.compare
                                });
                            }
                            chart.addSeries(conf, false, false);
                        }
                    });
                    chart.redraw();
                    this[indicatorID] = this[indicatorID] || [];
                    this[indicatorID].push(indicatorObject);
                } else {
                    console.error('Unable to add indicator!');
                }
            };
            Highcharts.Series.prototype.removeIndicator = function(indicatorSeriesIDArr) {
                var series = this;
                if (series.options.isInstrument) {
                    for (var key in indicatorsMetaData) {
                        var each = indicatorsMetaData[key];
                        if (series[each.id]) {//This is a check to find out, if this indicator was loaded for this chart
                            series[each.id].forEach(function (eachInstanceOfTheIndicator, index) {
                                if (eachInstanceOfTheIndicator.isSameInstance(indicatorSeriesIDArr)) {
                                    indicatorSeriesIDArr.forEach(function(e) {
                                        /**
                                         * There could be only 2 things to remove
                                         * 1. Axis   -> "indicatorID-uniqueID"
                                         * 2. series -> "uniqueID"
                                         */
                                        //Delete series
                                        var something = series.chart.get(e);
                                        if (something) {
                                            something.remove(false);
                                        }
                                        //Delete axis
                                        something = series.chart.get(each.id + '-' + e);
                                        if (something) {
                                            something.remove(false);
                                            indicators.recalculate(series.chart);
                                        }
                                    });
                                    series[each.id].splice(index, 1);
                                    return false;
                                }
                            });
                        }
                    }
                }
                this.chart.redraw();
            };
            /*
             *  Wrap HC's Series.addPoint
             */
            Highcharts.wrap(Highcharts.Series.prototype, 'addPoint', function(proceed, options, redraw, shift, animation) {
                proceed.call(this, options, redraw, shift, animation);
                var series = this;
                if (series.options.isInstrument) {
                    var time = options[0];
                    var bar = (barsTable.chain()
                        .find({'$and': [{instrumentCdAndTp: series.options.id}, {time: time}]})
                        .simplesort("time", true)
                        .limit(1)
                        .data() || [])[0];
                    if (bar) {
                        for (var key in indicatorsMetaData) {
                            var each = indicatorsMetaData[key];
                            if (series[each.id]) {//This is a check to find out, if this indicator was loaded for this chart
                                series[each.id].forEach(function (eachInstanceOfTheIndicator) {
                                    var indicatorUpdated = eachInstanceOfTheIndicator.addPoint(bar);
                                    indicatorUpdated.forEach(function(iu) {
                                        if (_.isArray(iu.value)) {
                                            series.chart.get(iu.id).addPoint(_.flattenDeep([time, iu.value]));
                                        } else if (iu.value instanceof CDLUpdateObject) {
                                            if (_.isNumber(iu.value.x) && iu.value.x > 0 &&  !_.isEmpty(iu.value.text)) {
                                                series.chart.get(iu.id).addPoint(iu.value.toJSObject());
                                            }
                                        } else {
                                            if (iu.color) {
                                                series.chart.get(iu.id).addPoint([time, iu.value]);
                                                var seriesData = series.chart.get(iu.id).data;
                                                seriesData[seriesData.length - 1].update({
                                                    color: iu.color
                                                });
                                            }
                                            else {
                                                 series.chart.get(iu.id).addPoint([time, iu.value]);
                                            }
                                        }
                                    });
                                });
                            }
                        }
                    }
                }
            });
            /*
             * Update will be called for all series
             * We do not have to worry about indicator series, because they will not have instance of indicator Classes
             * Wrap HC's Point.update
             */
            Highcharts.wrap(Highcharts.Point.prototype, 'update', function(proceed, options, redraw, animation) {
                proceed.call(this, options, redraw, animation);
                var series = this.series;
                if (series.options.isInstrument) {
                    var time = this.x || this.time;
                    var bar = (barsTable.chain()
                        .find({'$and': [{instrumentCdAndTp: series.options.id}, {time: time}]})
                        .simplesort("time", true)
                        .limit(1)
                        .data() || [])[0];
                    if (bar) {
                        for (var key in indicatorsMetaData) {
                            var each = indicatorsMetaData[key];
                            if (series[each.id]) {
                                series[each.id].forEach(function (eachInstanceOfTheIndicator) {
                                    var indicatorUpdated = eachInstanceOfTheIndicator.update(bar);
                                    indicatorUpdated.forEach(function(iu) {
                                        var indicatorSeries = series.chart.get(iu.id);
                                        var seriesData = indicatorSeries.data;
                                        if (_.isArray(iu.value)) {
                                            seriesData[seriesData.length - 1]
                                                .update(_.flattenDeep([time, iu.value]));
                                        } else if (iu.value instanceof CDLUpdateObject) {
                                            var renderingData = iu.value.toJSObject();
                                            var x = renderingData.x;
                                            var matchingSeriesData = _.find(seriesData, function(ee) {
                                                return _.isNumber(x) && x > 0 && x === ee.x;
                                            });
                                            if (matchingSeriesData) matchingSeriesData.remove();
                                            if (_.isNumber(x) && x > 0 && !_.isEmpty(renderingData.text)) {
                                                indicatorSeries.addPoint(renderingData);
                                            }
                                        } else {
                                            seriesData[seriesData.length - 1]
                                                .update({
                                                    y: iu.value
                                                });
                                        }
                                    });
                                });
                            }
                        }
                    }
                }
            });
        },

        /*
         * Function to recalculate heights of different sections in a chart
         */
        recalculate: function (chart) {
            var GAP = 1;
            var totalYAxes = chart.yAxis.length;
            totalYAxes--;//Excluding main chart
            totalYAxes--;//Excluding navigator chart
            var heightOfEachSubWindow = Math.round(45 / totalYAxes);
            var topForNextSubWindow = 0;

            if (totalYAxes <= 0) {
                //assign all space to the main chart
                chart.yAxis[0].update({
                    top: '0%',
                    height: '100%'
                }, false);
            }
            else {
                $.each(chart.yAxis, function (index, current_yAxis) {
                    //Main chart - Keeping it at 50%
                    if (index == 0) {
                        current_yAxis.update({
                            top: '0%',
                            height: '50%'
                        }, false);
                        topForNextSubWindow += 50;
                    }
                        //Ignore navigator axis
                    else if (current_yAxis.options && current_yAxis.options.id && current_yAxis.options.id.toLowerCase().indexOf('navigator') != -1) {
                    }
                    else {
                        //I am dividing remaining 45% among all subwindows. If its crossing 100%, the last window will get what is possible out of left over from 100%
                        current_yAxis.update({
                            top: (topForNextSubWindow + GAP) + '%',
                            height: ((topForNextSubWindow + GAP + heightOfEachSubWindow) > 100 ? (100 - topForNextSubWindow - GAP) : heightOfEachSubWindow) + '%',
                            offset: 0
                        }, false);
                        topForNextSubWindow += GAP + heightOfEachSubWindow;
                    }
                });
            }
        },

        appliedPriceString: function (intValue) {
            var ret = 'CLOSE';
            switch (intValue) {
                case indicators.OPEN:
                    ret = 'OPEN';
                    break;
                case indicators.HIGH:
                    ret = 'HIGH';
                    break;
                case indicators.LOW:
                    ret = 'LOW';
                    break;
                case indicators.CLOSE:
                    ret = 'CLOSE';
                    break;
            }
            return ret;
        },

        getIndicatorOrPriceValue: function(data, appliedTo) {
            var price = data.close;
            switch(appliedTo) {
                case this.OPEN: price = data.open; break;
                case this.HIGH: price = data.high; break;
                case this.LOW: price  = data.low; break;
            }
            return price;
        },

        /**
         * Long candle is "candle body" = "70% of Math.abs(high - low)"
         * @param open
         * @param high
         * @param low
         * @param close
         * @returns {boolean}
         */
        isLongCandle : function(open, high, low, close) {
            var bodySize = Math.abs(open - close);
            var candleSize = Math.abs(high - low);
            return bodySize >= (.7 * candleSize);
        }

    };

    return indicators;

});
