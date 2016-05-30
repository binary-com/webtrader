/**
 * Created by Arnab Karmakar on 12/7/15.
 */
define(['highstock', 'common/util'], function () {

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

        init: function(refererChartID) {

            (function(H,$){
                //Make sure that HighStocks have been loaded
                if (!H) return;

                var chart = $(refererChartID).highcharts();
                H.addEvent(chart,'click',function(evt){
                    if(chart.annotate){
                        chart.annotate = false;
                        addPlotLines(evt.yAxis[0].value, evt.yAxis[0].axis);
                        H.removeEvent(chart,'click');
                    }
                });

                function addPlotLines(value, axis){
                    var uniqueID = 'horizontalLine_' + new Date().getTime();
                    var line = axis.addPlotLine({
                        value: value,
                        width: 2,
                        color: 'green',
                        id: uniqueID
                    }).svgElem
                    .css({'cursor':'pointer'})
                    .attr('id',uniqueID)
                    .translate(0,0)
                    .on('mousedown', updateHorizontalLine)
                    .on('dblclick', removeLine);
                    horizontalLineOptionsMap[uniqueID] = line;
                    return line;
                }

                function updateHorizontalLine(evt) {
                    chart.annotate = true;
                    var lineID = $(this).attr('id'),
                        line = horizontalLineOptionsMap[lineID],
                        mouseUpEventAdded = false;
                    H.wrap(H.Pointer.prototype, 'drag', function(c, e){
                        if(chart.annotate){
                            if(!mouseUpEventAdded){
                                mouseUpEventAdded = true;
                                $(refererChartID).one("mouseup", function(){
                                    chart.annotate = false;
                                    mouseUpEventAdded = false;
                                    H.removeEvent(chart, 'mousemove');
                                });
                            }
                            if(chart.isInsidePlot(e.chartX -chart.plotLeft, e.chartY - chart.plotTop)){
                                removeLineWithID(line.element.id);
                                var value = chart.yAxis[0].toValue(e.chartY);
                                var axis = chart.yAxis[0];
                                line = addPlotLines(value, axis);
                            }
                        } else{
                            c.call(this, e);
                        }
                    });
                }

                function removeLine(evt){
                    var lineID = $(this).attr('id');
                    removeLineWithID(lineID);
                }

                function removeLineWithID(lineID){
                    delete horizontalLineOptionsMap[lineID];
                    chart.yAxis[0].removePlotLine(lineID);
                }
            }(Highcharts, jQuery));

        }
    };

});
